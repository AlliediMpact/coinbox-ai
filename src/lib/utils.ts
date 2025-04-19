import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface LoanMatch {
    id: string;
    lender: string;
    amount: number;
    interestRate: number;
    duration: number;
    riskScore: number;
}

export async function findLoanMatches(
    amount: number,
    borrowerId: string,
    membershipTier: string,
    riskScore: number
): Promise<LoanMatch[]> {
    const db = getFirestore();
    
    // Calculate the maximum interest rate based on risk score
    const baseInterest = 25; // 25% base interest rate
    const riskAdjustedInterest = baseInterest + (riskScore / 2); // Increase interest for higher risk

    try {
        const q = query(
            collection(db, "lendingOffers"),
            where("status", "==", "active"),
            where("minimumAmount", "<=", amount),
            where("maximumAmount", ">=", amount),
            where("acceptedTiers", "array-contains", membershipTier)
        );

        const querySnapshot = await getDocs(q);
        const matches: LoanMatch[] = [];

        for (const doc of querySnapshot.docs) {
            const offer = doc.data();
            
            // Skip if the lender is the same as borrower
            if (offer.lenderId === borrowerId) continue;

            // Calculate escrow requirements
            const escrowRequired = amount * 1.25; // 25% collateral
            
            matches.push({
                id: doc.id,
                lender: offer.lenderId,
                amount: amount,
                interestRate: riskAdjustedInterest,
                duration: offer.duration || 30, // 30 days default
                riskScore: riskScore
            });
        }

        // Sort matches by interest rate (best deals first)
        return matches.sort((a, b) => a.interestRate - b.interestRate);
    } catch (error) {
        console.error("Error finding loan matches:", error);
        return [];
    }
}

export function calculateRepaymentSchedule(
    principal: number,
    interestRate: number,
    durationDays: number
) {
    const totalRepayment = principal * (1 + (interestRate / 100));
    const borrowerWalletAmount = totalRepayment * 0.05; // 5% to borrower's wallet
    const lenderAmount = totalRepayment - borrowerWalletAmount;
    
    return {
        totalRepayment,
        borrowerWalletAmount,
        lenderAmount,
        dueDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    };
}

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2
    }).format(amount);
};
