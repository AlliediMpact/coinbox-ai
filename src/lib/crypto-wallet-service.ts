/**
 * Cryptocurrency Wallet Integration Service
 * Supports Bitcoin, Ethereum, USDT, and other major cryptocurrencies
 * Integration with blockchain APIs for wallet management
 */

import axios from 'axios';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export type CryptoType = 'BTC' | 'ETH' | 'USDT' | 'USDC' | 'BNB' | 'SOL';

export interface CryptoWallet {
  userId: string;
  wallets: {
    [key in CryptoType]?: {
      address: string;
      balance: number;
      balanceUSD: number;
      privateKeyEncrypted?: string; // Encrypted, never expose
      createdAt: Date;
      lastSync: Date;
    };
  };
}

export interface CryptoTransaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE' | 'TRANSFER';
  cryptoType: CryptoType;
  amount: number;
  amountUSD: number;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  confirmations?: number;
  fee?: number;
  timestamp: Date;
  notes?: string;
}

export interface CryptoPrice {
  symbol: CryptoType;
  priceUSD: number;
  priceZAR: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
}

class CryptoWalletService {
  private db = getFirestore();
  private coinGeckoApiUrl = 'https://api.coingecko.com/api/v3';
  private blockchainApiUrl = 'https://blockchain.info';

  // Crypto to CoinGecko ID mapping
  private coinGeckoIds: { [key in CryptoType]: string } = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
    SOL: 'solana',
  };

  /**
   * Create or get crypto wallet for user
   */
  async createWallet(userId: string, cryptoType: CryptoType): Promise<string> {
    try {
      const walletRef = doc(this.db, 'cryptoWallets', userId);
      const walletDoc = await getDoc(walletRef);

      if (walletDoc.exists()) {
        const data = walletDoc.data() as CryptoWallet;
        if (data.wallets[cryptoType]) {
          return data.wallets[cryptoType]!.address;
        }
      }

      // Generate new address (in production, use proper key generation)
      const address = this.generateMockAddress(cryptoType);

      const walletData: Partial<CryptoWallet> = {
        userId,
        wallets: {
          ...(walletDoc.exists() ? walletDoc.data().wallets : {}),
          [cryptoType]: {
            address,
            balance: 0,
            balanceUSD: 0,
            createdAt: new Date(),
            lastSync: new Date(),
          },
        },
      };

      await setDoc(walletRef, walletData, { merge: true });
      return address;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create crypto wallet');
    }
  }

  /**
   * Get wallet balance for specific crypto
   */
  async getBalance(userId: string, cryptoType: CryptoType): Promise<number> {
    try {
      const walletRef = doc(this.db, 'cryptoWallets', userId);
      const walletDoc = await getDoc(walletRef);

      if (!walletDoc.exists()) {
        return 0;
      }

      const data = walletDoc.data() as CryptoWallet;
      return data.wallets[cryptoType]?.balance || 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  /**
   * Get all wallet balances for user
   */
  async getAllBalances(userId: string): Promise<CryptoWallet['wallets']> {
    try {
      const walletRef = doc(this.db, 'cryptoWallets', userId);
      const walletDoc = await getDoc(walletRef);

      if (!walletDoc.exists()) {
        return {};
      }

      const data = walletDoc.data() as CryptoWallet;
      
      // Update USD values with current prices
      const updatedWallets = { ...data.wallets };
      for (const [crypto, wallet] of Object.entries(updatedWallets)) {
        if (wallet) {
          const price = await this.getCurrentPrice(crypto as CryptoType);
          wallet.balanceUSD = wallet.balance * price.priceUSD;
        }
      }

      return updatedWallets;
    } catch (error) {
      console.error('Error getting all balances:', error);
      return {};
    }
  }

  /**
   * Get current crypto price
   */
  async getCurrentPrice(cryptoType: CryptoType): Promise<CryptoPrice> {
    try {
      const coinId = this.coinGeckoIds[cryptoType];
      const response = await axios.get(
        `${this.coinGeckoApiUrl}/simple/price`,
        {
          params: {
            ids: coinId,
            vs_currencies: 'usd,zar',
            include_24hr_change: true,
            include_24hr_vol: true,
            include_market_cap: true,
          },
          timeout: 5000,
        }
      );

      const data = response.data[coinId];

      return {
        symbol: cryptoType,
        priceUSD: data.usd || 0,
        priceZAR: data.zar || 0,
        change24h: data.usd_24h_change || 0,
        volume24h: data.usd_24h_vol || 0,
        marketCap: data.usd_market_cap || 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching price:', error);
      // Return mock data if API fails
      return this.getMockPrice(cryptoType);
    }
  }

  /**
   * Get prices for all supported cryptocurrencies
   */
  async getAllPrices(): Promise<CryptoPrice[]> {
    const cryptoTypes: CryptoType[] = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL'];
    const prices = await Promise.all(
      cryptoTypes.map(crypto => this.getCurrentPrice(crypto))
    );
    return prices;
  }

  /**
   * Send crypto to another address
   */
  async sendCrypto(
    userId: string,
    cryptoType: CryptoType,
    toAddress: string,
    amount: number
  ): Promise<CryptoTransaction> {
    try {
      // Check balance
      const balance = await this.getBalance(userId, cryptoType);
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      // In production, broadcast transaction to blockchain
      // For now, create mock transaction
      const txHash = this.generateMockTxHash();
      const price = await this.getCurrentPrice(cryptoType);

      const transaction: CryptoTransaction = {
        id: `tx_${Date.now()}`,
        userId,
        type: 'WITHDRAWAL',
        cryptoType,
        amount,
        amountUSD: amount * price.priceUSD,
        toAddress,
        txHash,
        status: 'PENDING',
        confirmations: 0,
        fee: amount * 0.001, // 0.1% fee
        timestamp: new Date(),
      };

      // Update balance
      const walletRef = doc(this.db, 'cryptoWallets', userId);
      const walletDoc = await getDoc(walletRef);
      const data = walletDoc.data() as CryptoWallet;

      await updateDoc(walletRef, {
        [`wallets.${cryptoType}.balance`]: balance - amount,
        [`wallets.${cryptoType}.lastSync`]: serverTimestamp(),
      });

      // Save transaction
      await setDoc(doc(this.db, 'cryptoTransactions', transaction.id), transaction);

      return transaction;
    } catch (error: any) {
      console.error('Error sending crypto:', error);
      throw new Error(error.message || 'Failed to send crypto');
    }
  }

  /**
   * Swap one crypto for another
   */
  async swapCrypto(
    userId: string,
    fromCrypto: CryptoType,
    toCrypto: CryptoType,
    amount: number
  ): Promise<{ transaction: CryptoTransaction; received: number }> {
    try {
      // Check balance
      const balance = await this.getBalance(userId, fromCrypto);
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Get prices
      const fromPrice = await this.getCurrentPrice(fromCrypto);
      const toPrice = await this.getCurrentPrice(toCrypto);

      // Calculate swap amount (with 0.5% fee)
      const amountUSD = amount * fromPrice.priceUSD;
      const fee = amountUSD * 0.005;
      const received = (amountUSD - fee) / toPrice.priceUSD;

      const transaction: CryptoTransaction = {
        id: `swap_${Date.now()}`,
        userId,
        type: 'TRADE',
        cryptoType: fromCrypto,
        amount,
        amountUSD,
        status: 'CONFIRMED',
        fee,
        timestamp: new Date(),
        notes: `Swapped ${amount} ${fromCrypto} for ${received.toFixed(8)} ${toCrypto}`,
      };

      // Update balances
      const walletRef = doc(this.db, 'cryptoWallets', userId);
      const walletDoc = await getDoc(walletRef);
      const data = walletDoc.data() as CryptoWallet;

      const fromBalance = data.wallets[fromCrypto]?.balance || 0;
      const toBalance = data.wallets[toCrypto]?.balance || 0;

      await updateDoc(walletRef, {
        [`wallets.${fromCrypto}.balance`]: fromBalance - amount,
        [`wallets.${toCrypto}.balance`]: toBalance + received,
        [`wallets.${fromCrypto}.lastSync`]: serverTimestamp(),
        [`wallets.${toCrypto}.lastSync`]: serverTimestamp(),
      });

      // Save transaction
      await setDoc(doc(this.db, 'cryptoTransactions', transaction.id), transaction);

      return { transaction, received };
    } catch (error: any) {
      console.error('Error swapping crypto:', error);
      throw new Error(error.message || 'Failed to swap crypto');
    }
  }

  /**
   * Generate mock wallet address
   */
  private generateMockAddress(cryptoType: CryptoType): string {
    const prefixes: { [key in CryptoType]: string } = {
      BTC: '1',
      ETH: '0x',
      USDT: '0x',
      USDC: '0x',
      BNB: 'bnb',
      SOL: '',
    };

    const length = cryptoType === 'BTC' ? 34 : cryptoType.startsWith('BNB') ? 42 : 42;
    const chars = '0123456789abcdef';
    let address = prefixes[cryptoType];

    for (let i = address.length; i < length; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }

    return address;
  }

  /**
   * Generate mock transaction hash
   */
  private generateMockTxHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  /**
   * Get mock price data
   */
  private getMockPrice(cryptoType: CryptoType): CryptoPrice {
    const mockPrices: { [key in CryptoType]: number } = {
      BTC: 42000,
      ETH: 2800,
      USDT: 1,
      USDC: 1,
      BNB: 320,
      SOL: 95,
    };

    const zarRate = 18.5; // USD to ZAR rate

    return {
      symbol: cryptoType,
      priceUSD: mockPrices[cryptoType],
      priceZAR: mockPrices[cryptoType] * zarRate,
      change24h: Math.random() * 10 - 5, // -5% to +5%
      volume24h: Math.random() * 1000000000,
      marketCap: Math.random() * 100000000000,
      lastUpdated: new Date(),
    };
  }
}

export const cryptoWalletService = new CryptoWalletService();
