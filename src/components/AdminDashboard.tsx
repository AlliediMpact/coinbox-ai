'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationPrevious,
  PaginationNext,
  PaginationItem,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from '@radix-ui/react-icons';
import {
  Users as UsersIcon,
  Bell as BellIcon,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

// Sample data
const initialUsers = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', status: 'Active', verified: true, membership: 'Basic' },
  // ... add other users
];
const initialTransactions = [
  { id: 1, userId: 1, type: 'Deposit', amount: 1000, date: '2024-07-15', status: 'Completed' },
  // ... add other transactions
];

type ActionLog = { id: number; timestamp: string; action: string; details: string };

export default function AdminDashboard() {
  const { user, signOutUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [users, setUsers] = useState(initialUsers);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filterType, setFilterType] = useState<'all' | 'Deposit' | 'Withdrawal' | 'Loan'>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<typeof initialTransactions[0] | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);

  // Pagination for users
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = users.slice(indexOfFirst, indexOfLast);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div>Loading...</div>;
  if (!user || user.email !== 'admin@example.com') return <h2>Access Denied</h2>;

  // Handlers
  const logAction = (action: string, details: string) => {
    setActionLogs((logs) => [
      { id: logs.length + 1, timestamp: format(new Date(), 'yyyy-MM-dd HH:mm'), action, details },
      ...logs,
    ]);
  };

  const verifyUser = (id: number) => {
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, verified: true } : x)));
    logAction('User Verified', `Verified user ID ${id}`);
    toast({ title: 'User Verified', description: `User ${id} has been verified.` });
  };

  const changeStatus = (id: number, status: 'Active' | 'Inactive') => {
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, status } : x)));
    logAction(`User ${status}`, `Changed user ${id} to ${status}`);
    toast({ title: `User ${status}`, description: `User ${id} now ${status}.` });
  };

  const openTransaction = (txn: typeof initialTransactions[0]) => {
    setSelectedTxn(txn);
    setOpenDialog(true);
  };
  const updateTxnStatus = (status: string) => {
    if (!selectedTxn) return;
    setTransactions((t) => t.map((x) => (x.id === selectedTxn.id ? { ...x, status } : x)));
    logAction('Transaction Updated', `Txn ${selectedTxn.id} to ${status}`);
    setOpenDialog(false);
  };

  // Filters
  const filteredTxns = transactions
    .filter((t) => (filterType === 'all' ? true : t.type === filterType))
    .filter((t) => (filterDate ? format(new Date(t.date), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd') : true));

  // Stats
  const last7 = transactions.filter((t) => {
    const d = new Date(t.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });
  const chartData = [
    { name: 'Deposits', count: last7.filter((t) => t.type === 'Deposit').length },
    { name: 'Withdrawals', count: last7.filter((t) => t.type === 'Withdrawal').length },
    { name: 'Loans', count: last7.filter((t) => t.type === 'Loan').length },
  ];

  return (
    <div className="space-y-10 p-6">
      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UsersIcon className="h-6 w-6" />
              <CardTitle>User Management</CardTitle>
            </div>
            <Pagination>
              <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>
                <ArrowLeft />
              </PaginationPrevious>
              {[...Array(Math.ceil(users.length / usersPerPage)).keys()].map((n) => (
                <PaginationItem key={n + 1}>
                  <PaginationLink onClick={() => setCurrentPage(n + 1)}>{n + 1}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationNext onClick={() => setCurrentPage((p) => p + 1)}>
                <ArrowRight />
              </PaginationNext>
            </Pagination>
          </div>
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
              {currentUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell>{u.verified ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{u.membership}</TableCell>
                  <TableCell className="space-x-2">
                    {!u.verified && <Button size="sm" onClick={() => verifyUser(u.id)}>Verify</Button>}
                    {u.status === 'Inactive' && <Button size="sm" onClick={() => changeStatus(u.id, 'Active')}>Enable</Button>}
                    {u.status === 'Active' && <Button size="sm" onClick={() => changeStatus(u.id, 'Inactive')}>Disable</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Monitoring</CardTitle>
          <CardDescription>Filter and review transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">            
            <Select onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={`Type: ${filterType}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Deposit">Deposit</SelectItem>
                <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                <SelectItem value="Loan">Loan</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline"><CalendarIcon className="mr-2" />{filterDate ? format(filterDate, 'yyyy-MM-dd') : 'Pick Date'}</Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} />
              </PopoverContent>
            </Popover>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" onClick={() => { setFilterType('all'); setFilterDate(undefined); toast({ title: 'Filters reset' }); }}>Reset</Button>
                </TooltipTrigger>
                <TooltipContent>Reset all filters</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              {filteredTxns.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.userId}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>R{t.amount}</TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell>
                    <Dialog open={openDialog && selectedTxn?.id === t.id} onOpenChange={setOpenDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => openTransaction(t)}>Review</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Transaction Details</DialogTitle>
                          <DialogDescription>Review and update status</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <p><strong>ID:</strong> {selectedTxn?.id}</p>
                          <p><strong>User:</strong> {selectedTxn?.userId}</p>
                          <p><strong>Type:</strong> {selectedTxn?.type}</p>
                          <p><strong>Amount:</strong> R{selectedTxn?.amount}</p>
                          <p><strong>Date:</strong> {selectedTxn?.date}</p>
                        </div>
                        <Select value={selectedTxn?.status} onValueChange={updateTxnStatus}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Failed">Failed</SelectItem>
                            <SelectItem value="Refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="mt-4 flex justify-end space-x-2">
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <Button onClick={() => selectedTxn && updateTxnStatus(selectedTxn.status)}>Update</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Statistics (Last 7 days)</n          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <ChartTooltip />
                <Bar dataKey="count" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Info */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total KYC Verified Users: {users.filter((u) => u.verified).length}</p>
          <p>Total Active Users: {users.filter((u) => u.status === 'Active').length}</p>
          <p>Report Date: {format(new Date(), 'yyyy-MM-dd')}</p>
        </CardContent>
      </Card>

      {/* Action Log */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Action Log</CardTitle>
          <CardDescription>Audit trail of admin activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
