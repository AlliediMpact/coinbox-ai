'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {useState} from "react";
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

const users = [
  {id: 1, name: "John Doe", email: "john.doe@example.com", status: "Active", verified: true, membership: "Basic"},
  {id: 2, name: "Jane Smith", email: "jane.smith@example.com", status: "Inactive", verified: false, membership: "Ambassador"},
];

const transactions = [
  {id: 1, userId: 1, type: "Deposit", amount: "R1000", date: "2024-07-15", status: "Completed"},
  {id: 2, userId: 2, type: "Withdrawal", amount: "R200", date: "2024-07-14", status: "Pending"},
];

export default function AdminDashboard() {
  const [userList, setUserList] = useState(users);
  const [transactionList, setTransactionList] = useState(transactions);
	const [open, setOpen] = useState(false);
	const [transactionDetails, setTransactionDetails] = useState({
		id: null,
		userId: null,
		type: '',
		amount: '',
		date: '',
		status: ''
	});

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
      transaction.id === transactionDetails.id ? { ...transaction, status: status } : transaction
    ));
    setTransactionDetails({ ...transactionDetails, status: status });
    setOpen(false);
  };

  return (
    <div className="container mx-auto py-10 admin">
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
                        <Button variant="secondary" size="sm" onClick={() => handleVerifyUser(user.id)}>
                          Verify
                        </Button>
                      )}
                      {user.status === "Inactive" ? (
                        <Button variant="ghost" size="sm" onClick={() => handleEnableUser(user.id)}>
                          Enable
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleDisableUser(user.id)}>
                          Disable
                        </Button>
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
                {transactionList.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.id}</TableCell>
                    <TableCell>{transaction.userId}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.status}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleOpenTransactionDetails(transaction)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
						<Input id="transactionId" value={transactionDetails.id || ''} readOnly />
					</div>
					<div className="grid gap-2">
						<label htmlFor="userId">User ID</label>
						<Input id="userId" value={transactionDetails.userId || ''} readOnly />
					</div>
					<div className="grid gap-2">
						<label htmlFor="type">Type</label>
						<Input id="type" value={transactionDetails.type || ''} readOnly />
					</div>
					<div className="grid gap-2">
						<label htmlFor="amount">Amount</label>
						<Input id="amount" value={transactionDetails.amount || ''} readOnly />
					</div>
					<div className="grid gap-2">
						<label htmlFor="date">Date</label>
						<Input id="date" value={transactionDetails.date || ''} readOnly />
					</div>
					<div className="grid gap-2">
						<label htmlFor="status">Status</label>
						<Select onValueChange={handleUpdateTransactionStatus} defaultValue={transactionDetails.status}>
							<SelectTrigger id="status">
								<SelectValue placeholder={transactionDetails.status || "Select Status"} />
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
    </div>
  );
}


