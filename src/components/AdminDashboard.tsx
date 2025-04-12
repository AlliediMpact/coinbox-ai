'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {useState} from "react";

const users = [
  {id: 1, name: "John Doe", email: "john.doe@example.com", status: "Active", verified: true},
  {id: 2, name: "Jane Smith", email: "jane.smith@example.com", status: "Inactive", verified: false},
];

const transactions = [
  {id: 1, userId: 1, type: "Deposit", amount: "R1000", date: "2024-07-15"},
  {id: 2, userId: 2, type: "Withdrawal", amount: "R200", date: "2024-07-14"},
];

export default function AdminDashboard() {
  const [userList, setUserList] = useState(users);

  const handleVerifyUser = (id: number) => {
    setUserList(userList.map(user => user.id === id ? {...user, verified: true} : user));
  };

  const handleEnableUser = (id: number) => {
    setUserList(userList.map(user => user.id === id ? {...user, status: "Active"} : user));
  };

  const handleDisableUser = (id: number) => {
    setUserList(userList.map(user => user.id === id ? {...user, status: "Inactive"} : user));
  };

  return (
    <div className="container mx-auto py-10">
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.id}</TableCell>
                    <TableCell>{transaction.userId}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
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
    </div>
  );
}
