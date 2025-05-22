'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import AdminAuthPanel from '@/components/AdminAuthPanel';
import ComplianceReporting from '@/components/compliance/ComplianceReporting';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Pagination,
  PaginationPrevious,
  PaginationNext,
  PaginationItem,
  PaginationLink,
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
import { Users as UsersIcon, ArrowLeft, ArrowRight } from 'lucide-react';

type User = {
  id: number;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  verified: boolean;
  membership: string;
};

type Transaction = {
  id: number;
  userId: number;
  type: 'Deposit' | 'Withdrawal' | 'Loan';
  amount: number;
  date: string;
  status: string;
};

type ActionLog = {
  id: number;
  timestamp: string;
  action: string;
  details: string;
};

const initialUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', status: 'Active', verified: true, membership: 'Basic' },
  /* ... */
];

const initialTransactions: Transaction[] = [
  { id: 1, userId: 1, type: 'Deposit', amount: 1000, date: '2024-07-15', status: 'Completed' },
  /* ... */
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [filterType, setFilterType] = useState<'all' | Transaction['type']>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);

  // Pagination
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

  const logAction = (action: string, details: string) => {
    setActionLogs(logs => [
      { id: logs.length + 1, timestamp: format(new Date(), 'yyyy-MM-dd HH:mm'), action, details },
      ...logs,
    ]);
  };

  const verifyUser = (id: number) => {
    setUsers(u => u.map(x => x.id === id ? { ...x, verified: true } : x));
    logAction('User Verified', `Verified user ID ${id}`);
    toast({ title: 'User Verified', description: `User ${id} has been verified.` });
  };

  const changeStatus = (id: number, status: User['status']) => {
    setUsers(u => u.map(x => x.id === id ? { ...x, status } : x));
    logAction(`User ${status}`, `Changed user ${id} to ${status}`);
    toast({ title: `User ${status}`, description: `User ${id} is now ${status}.` });
  };

  const openTransaction = (txn: Transaction) => {
    setSelectedTxn(txn);
    setOpenDialog(true);
  };

  const updateTxnStatus = (status: string) => {
    if (!selectedTxn) return;
    setTransactions(t => t.map(x => x.id === selectedTxn.id ? { ...x, status } : x));
    logAction('Transaction Updated', `Txn ${selectedTxn.id} to ${status}`);
    setOpenDialog(false);
  };

  const filteredTxns = transactions
    .filter(t => filterType === 'all' ? true : t.type === filterType)
    .filter(t => filterDate
      ? format(new Date(t.date), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd')
      : true
    );

  const last7 = transactions.filter(t => {
    const d = new Date(t.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });
  const chartData = [
    { name: 'Deposits', count: last7.filter(t => t.type === 'Deposit').length },
    { name: 'Withdrawals', count: last7.filter(t => t.type === 'Withdrawal').length },
    { name: 'Loans', count: last7.filter(t => t.type === 'Loan').length },
  ];

  return (
    <div className="space-y-10 p-6">
      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage and monitor user accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UsersIcon className="h-6 w-6" />
              <CardTitle>User Management</CardTitle>
            </div>
            <Pagination>
              <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>
                <ArrowLeft />
              </PaginationPrevious>
              {[...Array(Math.ceil(users.length / usersPerPage)).keys()].map(n => (
                <PaginationItem key={n + 1}>
                  <PaginationLink onClick={() => setCurrentPage(n + 1)}>{n + 1}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationNext onClick={() => setCurrentPage(p => setCurrentPage(p + 1))}>
                <ArrowRight />
              </PaginationNext>
            </Pagination>
          </div>
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
              {currentUsers.map(u => (
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
            <Select onValueChange={v => setFilterType(v as any)}>
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
                <Button variant="outline">
                  <CalendarIcon className="mr-2" />
                  {filterDate ? format(filterDate, 'yyyy-MM-dd') : 'Pick Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} />
              </PopoverContent>
            </Popover>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" onClick={() => { setFilterType('all'); setFilterDate(undefined); toast({ title: 'Filters reset' }); }}>
                    Reset
                  </Button>
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
              {filteredTxns.map(t => (
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

      {/* Transaction Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Statistics (Last 7 days)</CardTitle>
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
          <p>Total KYC Verified Users: {users.filter(u => u.verified).length}</p>
          <p>Total Active Users: {users.filter(u => u.status === 'Active').length}</p>
          <p>Report Date: {format(new Date(), 'yyyy-MM-dd')}</p>
        </CardContent>
      </Card>
      
      {/* Compliance Reporting */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Reporting</CardTitle>
          <CardDescription>Generate and manage regulatory compliance reports</CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceReporting />
        </CardContent>
      </Card>

      {/* System Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>System Monitoring & Reliability</CardTitle>
          <CardDescription>Monitor system health and manage backups</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Monitor system performance, review logs, manage alerts, and control backup operations.</p>
          <Button onClick={() => window.location.href = '/admin/monitoring'}>
            Open Monitoring Dashboard
          </Button>
        </CardContent>
      </Card>

      {/* Admin Action Log */}
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
              {actionLogs.map(log => (
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

      {/* Authentication Management Panel */}
      {/* Import and use the newly created AdminAuthPanel component */}
      <AdminAuthPanel />
    </div>
  );
}
