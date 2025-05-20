'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, Shield, UserX, UserCheck, Lock, Unlock } from 'lucide-react';
import { AdminService } from '@/lib/admin-auth-service';
import { useToast } from '@/hooks/use-toast';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';

// Initialize the admin service
const adminService = new AdminService();

export default function AdminAuthPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [authLogs, setAuthLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    emailVerified: undefined as boolean | undefined,
    membershipTier: '',
    flagged: false,
    loginIssues: false,
  });
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [currentAction, setCurrentAction] = useState<{
    type: 'disable' | 'enable' | 'flag' | 'unflag';
    userId: string;
  } | null>(null);

  // Fetch users when component mounts or page/filters change
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'security') {
      fetchSecurityEvents();
    } else if (activeTab === 'logs') {
      fetchAuthLogs();
    }
  }, [activeTab, currentPage, filterOptions]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await adminService.getUsers({
        page: currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        filter: filterOptions
      });
      
      setUsers(result.users);
      setTotalPages(Math.ceil(result.total / result.pageSize));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityEvents = async () => {
    setLoading(true);
    try {
      const events = await adminService.getSecurityEventsForReview();
      setSecurityEvents(events);
    } catch (error) {
      console.error('Error fetching security events:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch security events. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthLogs = async () => {
    setLoading(true);
    try {
      const logs = await adminService.getRecentAuthEvents(100);
      setAuthLogs(logs);
    } catch (error) {
      console.error('Error fetching auth logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch authentication logs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!currentAction) return;
    
    try {
      switch (currentAction.type) {
        case 'disable':
          await adminService.disableUserAccount(currentAction.userId, actionReason);
          toast({
            title: 'User Disabled',
            description: 'The user account has been disabled successfully.',
          });
          break;
        case 'enable':
          await adminService.enableUserAccount(currentAction.userId);
          toast({
            title: 'User Enabled',
            description: 'The user account has been enabled successfully.',
          });
          break;
        case 'flag':
          await adminService.flagUserAccount(currentAction.userId, actionReason);
          toast({
            title: 'User Flagged',
            description: 'The user account has been flagged for review.',
          });
          break;
        case 'unflag':
          await adminService.unflagUserAccount(currentAction.userId);
          toast({
            title: 'User Unflagged',
            description: 'The flag has been removed from the user account.',
          });
          break;
      }
      
      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error(`Error performing ${currentAction.type} action:`, error);
      toast({
        title: 'Action Failed',
        description: `Failed to ${currentAction.type} the user account. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setActionDialogOpen(false);
      setCurrentAction(null);
      setActionReason('');
    }
  };

  const handleViewUserDetails = async (userId: string) => {
    try {
      const userInfo = await adminService.getUserSecurityInfo(userId);
      setSelectedUser(userInfo);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkSecurityEventReviewed = async (eventId: string, resolution: string) => {
    try {
      await adminService.markSecurityEventReviewed(eventId, resolution);
      toast({
        title: 'Event Reviewed',
        description: 'The security event has been marked as reviewed.',
      });
      
      // Refresh the security events list
      fetchSecurityEvents();
    } catch (error) {
      console.error('Error marking event as reviewed:', error);
      toast({
        title: 'Action Failed',
        description: 'Failed to mark the security event as reviewed. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="animate-pulse">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Management</CardTitle>
          <CardDescription>
            Manage user authentication, review security events, and monitor authentication logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="users" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="security">Security Events</TabsTrigger>
              <TabsTrigger value="logs">Authentication Logs</TabsTrigger>
            </TabsList>
            
            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Search by email or name" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Select
                  value={filterOptions.emailVerified?.toString() || 'all'}
                  onValueChange={(value) => setFilterOptions({
                    ...filterOptions,
                    emailVerified: value === 'all' ? undefined : value === 'true'
                  })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Email Verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Verified</SelectItem>
                    <SelectItem value="false">Unverified</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchUsers}>Filter</Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email Verified</TableHead>
                      <TableHead>MFA</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">Loading...</TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">No users found</TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.disabled ? (
                              <Badge variant="destructive">Disabled</Badge>
                            ) : user.flagged ? (
                              <Badge variant="warning">Flagged</Badge>
                            ) : (
                              <Badge variant="success">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.emailVerified ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            {user.mfaEnabled ? (
                              <Shield className="h-5 w-5 text-green-500" />
                            ) : (
                              <Shield className="h-5 w-5 text-gray-300" />
                            )}
                          </TableCell>
                          <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewUserDetails(user.id)}
                              >
                                Details
                              </Button>
                              {user.disabled ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentAction({
                                      type: 'enable',
                                      userId: user.id
                                    });
                                    setActionDialogOpen(true);
                                  }}
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Enable
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentAction({
                                      type: 'disable',
                                      userId: user.id
                                    });
                                    setActionDialogOpen(true);
                                  }}
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Disable
                                </Button>
                              )}
                              {user.flagged ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentAction({
                                      type: 'unflag',
                                      userId: user.id
                                    });
                                    setActionDialogOpen(true);
                                  }}
                                >
                                  <Unlock className="h-4 w-4 mr-1" />
                                  Unflag
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentAction({
                                      type: 'flag',
                                      userId: user.id
                                    });
                                    setActionDialogOpen(true);
                                  }}
                                >
                                  <Lock className="h-4 w-4 mr-1" />
                                  Flag
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </TabsContent>
            
            {/* Security Events Tab */}
            <TabsContent value="security" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
                      </TableRow>
                    ) : securityEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">No security events found</TableCell>
                      </TableRow>
                    ) : (
                      securityEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{event.eventType}</TableCell>
                          <TableCell>{event.userId || 'Unknown'}</TableCell>
                          <TableCell>{formatDate(event.timestamp)}</TableCell>
                          <TableCell>{renderSeverityBadge(event.severity)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => console.log(event.metadata)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkSecurityEventReviewed(event.id, 'Reviewed and resolved')}
                            >
                              Mark Reviewed
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            {/* Authentication Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <div className="rounded-md border max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>User Agent</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
                      </TableRow>
                    ) : authLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">No authentication logs found</TableCell>
                      </TableRow>
                    ) : (
                      authLogs.map((log, index) => (
                        <TableRow key={log.id || index}>
                          <TableCell>{log.eventType}</TableCell>
                          <TableCell>{log.userId || 'Unknown'}</TableCell>
                          <TableCell>{formatDate(log.timestamp)}</TableCell>
                          <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                          <TableCell className="truncate max-w-[200px]">
                            {log.userAgent || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => console.log(log.metadata)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>User Security Details</DialogTitle>
              <DialogDescription>
                Security information for user: {selectedUser.email}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">User Information</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email Verified:</span>
                      <span>{selectedUser.emailVerified ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">MFA Enabled:</span>
                      <span>{selectedUser.mfaEnabled ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created:</span>
                      <span>{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Login:</span>
                      <span>{formatDate(selectedUser.lastLoginAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Failed Login Attempts:</span>
                      <span>{selectedUser.failedLoginAttempts || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Account Status:</span>
                      <span>
                        {selectedUser.disabled ? 'Disabled' : selectedUser.flagged ? 'Flagged' : 'Active'}
                      </span>
                    </div>
                    {selectedUser.flagged && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Flag Reason:</span>
                        <span>{selectedUser.flagReason}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Recent Security Events</h3>
                  <div className="max-h-[200px] overflow-y-auto border rounded-md p-2">
                    {selectedUser.securityEvents && selectedUser.securityEvents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUser.securityEvents.map((event: any, i: number) => (
                          <div key={i} className="text-sm border-b pb-1 last:border-0">
                            <div className="flex justify-between">
                              <span>{event.eventType}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(event.timestamp)}
                              </span>
                            </div>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {Object.entries(event.metadata).map(([key, value]) => (
                                  <div key={key}>
                                    <span>{key}: </span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        No security events found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedUser(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentAction?.type === 'disable' && 'Disable User Account'}
              {currentAction?.type === 'enable' && 'Enable User Account'}
              {currentAction?.type === 'flag' && 'Flag User Account'}
              {currentAction?.type === 'unflag' && 'Remove Flag from User Account'}
            </DialogTitle>
            <DialogDescription>
              {currentAction?.type === 'disable' && 'This will prevent the user from accessing their account.'}
              {currentAction?.type === 'enable' && 'This will restore the user\'s access to their account.'}
              {currentAction?.type === 'flag' && 'This will mark the account for security review.'}
              {currentAction?.type === 'unflag' && 'This will remove the security flag from the account.'}
            </DialogDescription>
          </DialogHeader>
          {(currentAction?.type === 'disable' || currentAction?.type === 'flag') && (
            <div className="py-4">
              <label className="text-sm font-medium mb-1 block">
                Reason
              </label>
              <Input
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Provide a reason for this action"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setCurrentAction(null);
                setActionReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUserAction}
              disabled={
                (currentAction?.type === 'disable' || currentAction?.type === 'flag') && 
                !actionReason
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
