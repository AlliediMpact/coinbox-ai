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

const users = [
    {id: 1, name: "John Doe", email: "john.doe@example.com", status: "Active", verified: true, membership: "Basic"},
    {id: 2, name: "Jane Smith", email: "jane.smith@example.com", status: "Inactive", verified: false, membership: "Ambassador"},
];

const transactions = [
    {id: 1, userId: 1, type: "Deposit", amount: "R1000", date: "2024-07-15", status: "Completed"},
    {id: 2, userId: 2, type: "Withdrawal", amount: "R200", date: "2024-07-14", status: "Pending"},
];

const initialTransactionDetails = {
    id: null,
    userId: null,
    type: '',
    amount: '',
    date: '',
    status: ''
};

export default function AdminDashboard() {
    const [userList, setUserList] = useState(users);
    const [transactionList, setTransactionList] = useState(transactions);
    const [open, setOpen] = useState(false);
    const [transactionDetails, setTransactionDetails] = useState(initialTransactionDetails);
    const [filter, setFilter] = useState('all');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const {toast} = useToast();

    const handleVerifyUser = (id: number) => {
        setUserList(userList.map(user => user.id === id ? {...user, verified: true} : user));
    };

    const handleEnableUser = (id: number) => {
        setUserList(userList.map(user => user.id === id ? {...user, status: "Active"} : user));
    };

    const handleDisableUser = (id: number) => {
        setUserList(userList.map(user => user.id === id ? {...user, status: "Inactive"} : user));
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

    return (
        <div>
            <h1 className="text-3xl font-bold mb-5">Admin Dashboard</h1>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Manage user accounts and verify identities.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Verified</TableHead>
                                    <TableHead>Membership</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userList.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.status}</TableCell>
                                        <TableCell>{user.verified ? "Yes" : "No"}</TableCell>
                                        <TableCell>{user.membership}</TableCell>
                                        <TableCell>
                                            {!user.verified && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="secondary" size="sm"
                                                                    onClick={() => handleVerifyUser(user.id)}>
                                                                Verify
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Verify this user
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            {user.status === "Inactive" ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="secondary" size="sm"
                                                                    onClick={() => handleEnableUser(user.id)}>
                                                                Enable
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Enable this user
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="secondary" size="sm"
                                                                    onClick={() => handleDisableUser(user.id)}>
                                                                Disable
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Disable this user
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Monitoring</CardTitle>
                        <CardDescription>Review and monitor transactions for fraud prevention.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div>
                                <label htmlFor="filterType" className="block text-sm font-medium text-gray-700">Filter by
                                    Type</label>
                                <Select onValueChange={(value) => setFilter(value)}>
                                    <SelectTrigger id="filterType">
                                        <SelectValue placeholder={filter}/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Deposit">Deposit</SelectItem>
                                        <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                                        <SelectItem value="Loan">Loan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="datePicker" className="block text-sm font-medium text-gray-700">Filter by
                                    Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[300px] justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4"/>
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="center" sideOffset={5}>
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("2020-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                                                Reset Filters
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Click to reset all filters
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>{transaction.id}</TableCell>
                                        <TableCell>{transaction.userId}</TableCell>
                                        <TableCell>{transaction.type}</TableCell>
                                        <TableCell>{transaction.amount}</TableCell>
                                        <TableCell>{transaction.date}</TableCell>
                                        <TableCell>{transaction.status}</TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="secondary" size="sm"
                                                                onClick={() => handleOpenTransactionDetails(transaction)}>
                                                            Review
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Review this transaction
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Statistics</CardTitle>
                        <CardDescription>Statistics of transactions in the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="name"/>
                                <YAxis/>
                                <ChartTooltip/>
                                <Legend/>
                                <Bar dataKey="count" fill="#8884d8"/>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Compliance Information</CardTitle>
                        <CardDescription>Information related to user compliance and activity.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            <li>Total KYC Verified Users: {userList.filter(user => user.verified).length}</li>
                            <li>Total Active Users: {userList.filter(user => user.status === 'Active').length}</li>
                            <li>Last login: {new Date().toLocaleDateString()}</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                        <DialogDescription>
                            Review and update transaction status.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="transactionId">Transaction ID</label>
                            <Input id="transactionId" value={transactionDetails.id || ''} disabled/>
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="userId">User ID</label>
                            <Input id="userId" value={transactionDetails.userId || ''} disabled/>
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="type">Type</label>
                            <Input id="type" value={transactionDetails.type || ''} disabled/>
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="amount">Amount</label>
                            <Input id="amount" value={transactionDetails.amount || ''} disabled/>
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="date">Date</label>
                            <Input id="date" value={transactionDetails.date || ''} disabled/>
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="status">Status</label>
                            <Select onValueChange={(value) => handleUpdateTransactionStatus(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={transactionDetails.status || "Select Status"}/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Failed">Failed</SelectItem>
                                    <SelectItem value="Refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Activity</CardTitle>
                        {/* Potential Fix: Try wrapping the text in curly braces */}
                        <CardDescription>{"Overview of deposits, withdrawals, and loans."}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="month"/>
                                <YAxis/>
                                <ChartTooltip/>
                                <Legend/>
                                <Bar dataKey="deposits" name="Deposits" fill="#82ca9d"/>
                                <Bar dataKey="withdrawals" name="Withdrawals" fill="#8884d8"/>
                                <Bar dataKey="loans" name="Loans" fill="#ffc658"/>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>KYC Verification Status</CardTitle>
                        <CardDescription>Overview of user verification status over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={[{month: 'Jan', verified: 50, pending: 10}, {
                                month: 'Feb',
                                verified: 60,
                                pending: 8
                            }, {month: 'Mar', verified: 70, pending: 5}]}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="month"/>
                                <YAxis/>
                                <ChartTooltip/>
                                <Legend/>
                                <Bar dataKey="verified" name="Verified" fill="#82ca9d"/>
                                <Bar dataKey="pending" name="Pending" fill="#ff7300"/>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}