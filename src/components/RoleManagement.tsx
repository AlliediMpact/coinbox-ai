'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthProvider';

export default function RoleManagement() {
  const { toast } = useToast();
  const { userClaims } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // Check if the user has admin role
  const isAdmin = userClaims?.role === 'admin';

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Filter users when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user => 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch users',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to the server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'support':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleChangeRole = (user: any) => {
    if (!isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'You need admin privileges to change user roles',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedUser(user);
    setSelectedRole(user.role || 'user');
    setChangeRoleDialogOpen(true);
  };

  const submitRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;
    
    try {
      const response = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          roleToSet: selectedRole,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Role Updated',
          description: `User role has been updated to ${selectedRole}`,
        });
        
        // Update the user in our local state
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? { ...user, role: selectedRole } 
            : user
        ));
      } else {
        toast({
          title: 'Update Failed',
          description: data.error || 'Failed to update user role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to connect to the server',
        variant: 'destructive',
      });
    } finally {
      setChangeRoleDialogOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
        <CardDescription>
          Assign roles to users to control their access and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search users by email or name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">Loading users...</div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-sm text-muted-foreground">No users found</div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.fullName || 'Unnamed User'}</div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>{user.role || 'user'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeRole(user)}
                        disabled={!isAdmin}
                      >
                        Change Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Change Role Dialog */}
        <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                {selectedUser && (
                  <span>
                    Changing role for {selectedUser.fullName || selectedUser.email}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Select Role
              </label>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h4 className="font-semibold mb-2">Role Permissions:</h4>
                {selectedRole === 'admin' && (
                  <ul className="text-sm space-y-1">
                    <li>• Full access to admin panel and all features</li>
                    <li>• Can modify user accounts and settings</li>
                    <li>• Can manage other users&apos; roles</li>
                    <li>• Full access to analytics and reports</li>
                  </ul>
                )}
                {selectedRole === 'support' && (
                  <ul className="text-sm space-y-1">
                    <li>• View-only access to admin panel</li>
                    <li>• Can view user accounts but cannot modify them</li>
                    <li>• Can view authentication logs and security events</li>
                    <li>• Read-only access to analytics and reports</li>
                  </ul>
                )}
                {selectedRole === 'user' && (
                  <ul className="text-sm space-y-1">
                    <li>• Standard user permissions only</li>
                    <li>• No access to admin or management features</li>
                    <li>• Can only manage their own account</li>
                  </ul>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setChangeRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={submitRoleChange}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
