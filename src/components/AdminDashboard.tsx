
'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {useState, useEffect} from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    Calendar,
} from "@/components/ui/calendar"
import {cn} from "@/lib/utils"
import {format} from "date-fns"
import {CalendarIcon} from "@radix-ui/react-icons"; // Corrected import
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {useToast} from "@/hooks/use-toast";
import React from "react";
import { LucideIcon } from 'lucide-react';
import {
    Home,
    LayoutDashboard,
    Users,
    Coins,
    Wallet,
    Shield,
    Share2,
    HelpCircle,
    Menu,
    Search,
    Bell,
    Cog,
    LogOut,
    User as UserIcon,
    PackagePlus,
    CreditCard,
    Settings,
    TrendingUp,
    AlertCircle,
} from 'lucide-react';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
    ArrowLeft,
    ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const users = [
    {id: 1, name: "John Doe", email: "john.doe@example.com", status: "Active", verified: true, membership: "Basic"},
    {id: 2, name: "Jane Smith", email: "jane.smith@example.com", status: "Inactive", verified: false, membership: "Ambassador"},
    {id: 3, name: "Alice Johnson", email: "alice.johnson@example.com", status: "Active", verified: true, membership: "VIP"},
    {id: 4, name: "Bob Williams", email: "bob.williams@example.com", status: "Inactive", verified: false, membership: "Basic"},
    {id: 5, name: "Charlie Brown", email: "charlie.brown@example.com", status: "Active", verified: true, membership: "Ambassador"},
    {id: 6, name: "Diana Miller", email: "diana.miller@example.com", status: "Inactive", verified: false, membership: "VIP"},
    {id: 7, name: "Ethan Davis", email: "ethan.davis@example.com", status: "Active", verified: true, membership: "Basic"},
    {id: 8, name: "Fiona Wilson", email: "fiona.wilson@example.com", status: "Inactive", verified: false, membership: "Ambassador"},
    {id: 9, name: "George Taylor", email: "george.taylor@example.com", status: "Active", verified: true, membership: "VIP"},
    {id: 10, name: "Hannah Moore", email: "hannah.moore@example.com", status: "Inactive", verified: false, membership: "Basic"},
    {id: 11, name: "Isaac Clark", email: "isaac.clark@example.com", status: "Active", verified: true, membership: "Ambassador"},
    {id: 12, name: "Julia Adams", email: "julia.adams@example.com", status: "Inactive", verified: false, membership: "VIP"},
];

const transactions = [
    {id: 1, userId: 1, type: "Deposit", amount: "R1000", date: "2024-07-15", status: "Completed"},
    {id: 2, userId: 2, type: "Withdrawal", amount: "R200", date: "2024-07-14", status: "Pending"},
    {id: 3, userId: 1, type: "Loan", amount: "R300", date: "2024-07-12", status: "Completed"},
    {id: 4, userId: 3, type: "Deposit", amount: "R500", date: "2024-07-10", status: "Completed"},
    {id: 5, userId: 4, type: "Withdrawal", amount: "R100", date: "2024-07-08", status: "Pending"},
    {id: 6, userId: 2, type: "Loan", amount: "R400", date: "2024-07-05", status: "Completed"},
    {id: 7, userId: 5, type: "Deposit", amount: "R1200", date: "2024-07-03", status: "Completed"},
    {id: 8, userId: 6, type: "Withdrawal", amount: "R250", date: "2024-07-01", status: "Pending"},
    {id: 9, userId: 3, type: "Loan", amount: "R350", date: "2024-06-28", status: "Completed"},
    {id: 10, userId: 7, type: "Deposit", amount: "R800", date: "2024-06-26", status: "Completed"},
    {id: 11, userId: 8, type: "Withdrawal", amount: "R180", date: "2024-06-24", status: "Pending"},
    {id: 12, userId: 4, type: "Loan", amount: "R280", date: "2024-06-22", status: "Completed"},
    {id: 13, userId: 9, type: "Deposit", amount: "R1500", date: "2024-06-20", status: "Completed"},
    {id: 14, userId: 10, type: "Withdrawal", amount: "R320", date: "2024-06-18", status: "Pending"},
    {id: 15, userId: 5, type: "Loan", amount: "R420", date: "2024-06-16", status: "Completed"}
];

const initialTransactionDetails = {
    id: null,
    userId: null,
    type: '',
    amount: '',
    date: '',
    status: ''
};

// Define a type for action logs
type ActionLogItem = {
    id: number;
    timestamp: string;
    action: string;
    details: string;
}

const sampleActionLogs: ActionLogItem[] = [
    { id: 1, timestamp: "2024-08-01 10:00", action: "User Verified", details: "Verified user John Doe" },
    { id: 2, timestamp: "2024-08-01 10:15", action: "Transaction Reviewed", details: "Reviewed transaction ID 12345" },
];


export default function AdminDashboard() {
    const [userList, setUserList] = useState(users);
    const [transactionList, setTransactionList] = useState(transactions);
    const [open, setOpen] = useState(false);
    const [transactionDetails, setTransactionDetails] = useState(initialTransactionDetails);
    const [filter, setFilter] = useState('all');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const {toast} = useToast();
    const [actionLogs, setActionLogs] = useState<ActionLogItem[]>(sampleActionLogs);
    const { user } = useAuth(); // Use the useAuth hook
    const [isMounted, setIsMounted] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Get current users
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = userList.slice(indexOfFirstUser, indexOfLastUser);

    // Change page
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const handleVerifyUser = (id: number) => {
        const updatedUserList = userList.map(user => {
            if (user.id === id) {
                // Log the action
                logAdminAction("User Verified", `Verified user ${user.name}`);
                return {...user, verified: true};
            }
            return user;
        });
        setUserList(updatedUserList);
    };

    const handleEnableUser = (id: number) => {
        const updatedUserList = userList.map(user => {
            if (user.id === id) {
                // Log the action
                logAdminAction("User Enabled", `Enabled user ${user.name}`);
                return {...user, status: "Active"};
            }
            return user;
        });
        setUserList(updatedUserList);
    };

    const handleDisableUser = (id: number) => {
        const updatedUserList = userList.map(user => {
            if (user.id === id) {
                // Log the action
                logAdminAction("User Disabled", `Disabled user ${user.name}`);
                return {...user, status: "Inactive"};
            }
            return user;
        });
        setUserList(updatedUserList);
    };

    const handleOpenTransactionDetails = (transaction: any) => {
        setTransactionDetails({
            id: transaction.id,
            userId: transaction.userId,
            type: transaction.type,
            amount: transaction.amount,
            date: transaction.date,
            status: transaction.status,
        });
        setOpen(true);
    };

    const handleUpdateTransactionStatus = (status: string) => {
        setTransactionList(transactionList.map(transaction =>
            transaction.id === transactionDetails.id ? {...transaction, status: status} : transaction
        ));
        setTransactionDetails({...transactionDetails, status: status});
        setOpen(false);
        logAdminAction("Transaction Updated", `Updated transaction ${transactionDetails.id} to ${status}`); // Log the action
    };

    const filteredTransactions = filter === 'all' ? transactionList : transactionList.filter(transaction => transaction.type === filter);

    const last7DaysTransactions = transactionList.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return transactionDate >= sevenDaysAgo;
    });

    // Dummy data for the bar chart
    const chartData = [
        {name: 'Deposits', count: transactionList.filter(t => t.type === 'Deposit').length},
        {name: 'Withdrawals', count: transactionList.filter(t => t.type === 'Withdrawal').length},
        {name: 'Loans', count: transactionList.filter(t => t.type === 'Loan').length},
    ];

    const handleResetFilters = () => {
        setFilter('all');
        setDate(undefined);
        setTransactionDetails(initialTransactionDetails);
        toast({
            title: "Filters Reset",
            description: "Transaction filters have been reset.",
        });
    };

    // Function to log admin actions
    const logAdminAction = (action: string, details: string) => {
        const newLog: ActionLogItem = {
            id: actionLogs.length + 1,
            timestamp: new Date().toLocaleString(),
            action: action,
            details: details,
        };
        setActionLogs(prevLogs => [newLog, ...prevLogs]); // Add new log at the beginning
    };

      if (!isMounted) {
        return <div>Loading...</div>;
    }
     // Check if the user is an admin (based on email)
    if (!user || user.email !== 'admin@example.com') {
        return (
            
                <h2>Access Denied</h2>
                
            
        );
    }


    return (
        
            
                
                    
                        
                            
                                <CardTitle>{"User Management"}</CardTitle>
                            
                            
                                <CardDescription>{"Manage user accounts and verify identities."}</CardDescription>
                            
                        
                        
                            
                                
                                    
                                        ID
                                        Name
                                        Email
                                        Status
                                        Verified
                                        Membership
                                        Actions
                                    
                                
                            
                            
                                {currentUsers.map((user) => (
                                    
                                        
                                            {user.id}
                                            {user.name}
                                            {user.email}
                                            {user.status}
                                            {user.verified ? "Yes" : "No"}
                                            {user.membership}
                                            
                                                
                                                     
                                                            Verify
                                                        
                                                        Verify this user
                                                     
                                                
                                                
                                                     
                                                            Enable
                                                        
                                                        Enable this user
                                                     
                                                
                                            
                                                
                                                     
                                                            Disable
                                                        
                                                        Disable this user
                                                     
                                                
                                            
                                        
                                    
                                ))}
                            
                        

                        
                            
                                
                                    {userList.length} Users
                                
                                
                                    
                                        
                                            
                                                
                                                
                                                
                                                    
                                                    
                                                
                                            
                                        
                                    
                                
                            
                        
                    
                
            

            
                
                    
                        
                            
                                {"Transaction Monitoring"}
                            
                            
                                {"Review and monitor transactions for fraud prevention."}
                            
                        
                        
                            
                                
                                    
                                        Filter by Type
                                        
                                            
                                                
                                                    {filter}
                                                
                                                
                                                    All
                                                    Deposit
                                                    Withdrawal
                                                    Loan
                                                
                                            
                                        
                                    
                                
                            
                            
                                
                                    
                                         Filter by Date
                                        
                                            
                                                
                                                    
                                                        
                                                    
                                                
                                                Pick a date
                                            
                                        
                                        
                                            
                                                
                                                    
                                            
                                        
                                    
                                
                            
                            
                                
                                    
                                         
                                             Reset Filters
                                         
                                         Click to reset all filters
                                        
                                    
                                
                            
                        

                        
                            
                                ID
                                User ID
                                Type
                                Amount
                                Date
                                Status
                                Actions
                            
                            
                                {filteredTransactions.map((transaction) => (
                                    
                                        
                                            {transaction.id}
                                            {transaction.userId}
                                            {transaction.type}
                                            {transaction.amount}
                                            {transaction.date}
                                            {transaction.status}
                                            
                                                
                                                     
                                                            Review
                                                        
                                                        Review this transaction
                                                     
                                                
                                            
                                        
                                    
                                ))}
                            
                        
                    
                
            
            
                
                    
                        
                            {"Transaction Statistics"}
                            
                            
                                {"Statistics of transactions in the last 7 days."}
                            
                        
                    
                        
                            
                                
                                
                                    
                                
                                
                                    
                                
                                
                                    
                                
                                
                                    
                                
                            
                        
                    
                

                
                    
                        
                            Compliance Information
                            
                            
                                Information related to user compliance and activity.
                            
                        
                    
                        
                            Total KYC Verified Users: {userList.filter(user => user.verified).length}
                            Total Active Users: {userList.filter(user => user.status === 'Active').length}
                            Last login: {new Date().toLocaleDateString()}
                            Date: {new Date().toLocaleDateString()}
                        
                    
                
            
            
                
                    
                        
                            Transaction Details
                        
                        
                            Review and update transaction status.
                        
                    
                    
                        
                            
                                Transaction ID
                                
                                    {transactionDetails.id}
                                
                                User ID
                                
                                    {transactionDetails.userId}
                                
                                Type
                                
                                    {transactionDetails.type}
                                
                                Amount
                                
                                    {transactionDetails.amount}
                                
                                Date
                                
                                    {transactionDetails.date}
                                
                                Status
                                
                                    
                                        
                                            {transactionDetails.status || "Select Status"}
                                        
                                        
                                            Pending
                                            Completed
                                            Failed
                                            Refunded
                                        
                                    
                                
                            
                        
                        
                            
                                Cancel
                            
                        
                    
                
            

            
                
                    
                        Admin Action Log
                        
                        
                            Log of admin actions for auditing and monitoring.
                        
                    
                    
                        
                            
                                Timestamp
                                Action
                                Details
                            
                            
                                {actionLogs.map((log) => (
                                    
                                        
                                            {log.timestamp}
                                            {log.action}
                                            {log.details}
                                        
                                    
                                ))}
                            
                        
                    
                
            
        
    );
}

