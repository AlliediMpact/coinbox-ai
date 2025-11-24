'use client';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { transactionMonitoringAPI } from "@/lib/transaction-monitoring-api";
import { TransactionAlert, MonitoringRule } from "@/lib/transaction-monitoring-service";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Clock, Eye, Filter, RefreshCw, Shield, XCircle } from "lucide-react";
import PageLoading from "@/components/PageLoading";

// Helper for severity badge
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'high': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case 'critical': return 'bg-red-100 text-red-800 hover:bg-red-200';
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

// Helper for status badge
const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'under-review': return 'bg-purple-100 text-purple-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'false-positive': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function TransactionMonitoring() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<TransactionAlert[]>([]);
  const [rules, setRules] = useState<MonitoringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<TransactionAlert | null>(null);
  const [selectedRule, setSelectedRule] = useState<MonitoringRule | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("new");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Initial data loading
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load alerts with filters
      const alertOptions: any = { limit: 100 };
      if (statusFilter !== "all") {
        alertOptions.status = statusFilter;
      }
      if (severityFilter !== "all") {
        alertOptions.severity = severityFilter;
      }
      const alerts = await transactionMonitoringAPI.getAllAlerts(alertOptions);
      setAlerts(alerts);

      // Load rules
      const rules = await transactionMonitoringAPI.getMonitoringRules();
      setRules(rules);
    } catch (error) {
      console.error('Error loading transaction monitoring data:', error);
      toast({
        title: "Error",
        description: "Failed to load monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, toast]);

  useEffect(() => {
    if (!user) return;

    loadData();
  }, [user, loadData]);

  // Function to refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Function to handle alert update
  const handleUpdateAlert = async (status: 'under-review' | 'resolved' | 'false-positive') => {
    if (!selectedAlert || !user) return;
    
    try {
      await transactionMonitoringAPI.updateAlertStatus(
        selectedAlert.id!, 
        status, 
        resolution, 
        user.uid
      );
      
      toast({
        title: "Alert Updated",
        description: `Alert status changed to ${status}`,
      });
      
      // Update local state
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === selectedAlert.id 
          ? { ...alert, status, resolution, reviewedBy: user.uid, reviewedAt: new Date() } 
          : alert
        )
      );
      
      setAlertDialogOpen(false);
      setResolution("");
    } catch (error) {
      console.error("Error updating alert:", error);
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive",
      });
    }
  };

  // Function to handle rule update
  const handleUpdateRule = async () => {
    if (!selectedRule) return;
    
    try {
      await transactionMonitoringAPI.updateMonitoringRule(
        selectedRule.id, 
        selectedRule
      );
      
      toast({
        title: "Rule Updated",
        description: "Monitoring rule has been updated",
      });
      
      // Update local state
      setRules(prevRules => 
        prevRules.map(rule => 
          rule.id === selectedRule.id 
          ? selectedRule 
          : rule
        )
      );
      
      setRuleDialogOpen(false);
    } catch (error) {
      console.error("Error updating rule:", error);
      toast({
        title: "Error",
        description: "Failed to update monitoring rule",
        variant: "destructive",
      });
    }
  };

  // Function to handle viewing alert details
  const handleViewAlert = (alert: TransactionAlert) => {
    setSelectedAlert(alert);
    setAlertDialogOpen(true);
  };

  // Function to handle editing rule
  const handleEditRule = (rule: MonitoringRule) => {
    setSelectedRule({ ...rule });
    setRuleDialogOpen(true);
  };

  // Toggle rule status (enabled/disabled)
  const toggleRuleStatus = async (rule: MonitoringRule) => {
    try {
      await transactionMonitoringAPI.updateMonitoringRule(
        rule.id,
        { enabled: !rule.enabled, updatedAt: new Date() }
      );
      
      // Update local state
      setRules(prevRules => 
        prevRules.map(r => 
          r.id === rule.id 
          ? { ...r, enabled: !r.enabled, updatedAt: new Date() } 
          : r
        )
      );
      
      toast({
        title: rule.enabled ? "Rule Disabled" : "Rule Enabled",
        description: `"${rule.name}" has been ${rule.enabled ? 'disabled' : 'enabled'}`,
      });
    } catch (error) {
      console.error("Error toggling rule status:", error);
      toast({
        title: "Error",
        description: "Failed to update rule status",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    return new Date(date instanceof Date ? date : date.toDate()).toLocaleString();
  };

  if (loading) {
    return <PageLoading message="Loading monitoring dashboard..." />;
  }

  return (
    <div className="transaction-monitoring">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">
              <Shield className="h-6 w-6 inline-block mr-2" />
              Transaction Monitoring
            </CardTitle>
            <CardDescription>
              Monitor and manage suspicious transaction activities
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="alerts">
        <TabsList className="mb-6">
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="rules">Monitoring Rules</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Transaction Alerts</CardTitle>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="under-review">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="false-positive">False Positive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No alerts found</AlertTitle>
                  <AlertDescription>
                    No transaction alerts match your current filter criteria.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alert</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Detected</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map((alert) => (
                        <TableRow
                          key={alert.id}
                          className={
                            alert.status === 'new' 
                            ? 'bg-blue-50 hover:bg-blue-100' 
                            : ''
                          }
                        >
                          <TableCell className="font-medium">{alert.ruleName}</TableCell>
                          <TableCell>{alert.userId.substring(0, 8)}...</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(alert.status)}>
                              {alert.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(alert.detectedAt)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewAlert(alert)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Rules</CardTitle>
              <CardDescription>Configure transaction monitoring rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>{rule.description}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => toggleRuleStatus(rule)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Details Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Alert Details
              {selectedAlert && (
                <Badge className={`ml-2 ${getSeverityColor(selectedAlert.severity)}`}>
                  {selectedAlert.severity}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAlert?.ruleName}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">User ID</h4>
                  <p className="text-sm">{selectedAlert.userId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <Badge className={getStatusColor(selectedAlert.status)}>
                    {selectedAlert.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Detected At</h4>
                  <p className="text-sm">{formatDate(selectedAlert.detectedAt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Related Transactions</h4>
                  <p className="text-sm">{selectedAlert.transactions.length} transactions</p>
                </div>
              </div>

              {selectedAlert.resolution && (
                <div>
                  <h4 className="text-sm font-medium">Resolution</h4>
                  <p className="text-sm">{selectedAlert.resolution}</p>
                </div>
              )}

              {selectedAlert.status === 'new' && (
                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution Notes</Label>
                  <Textarea
                    id="resolution"
                    placeholder="Add notes about the resolution of this alert"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                </div>
              )}

              <DialogFooter className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setAlertDialogOpen(false)}
                >
                  Close
                </Button>

                {selectedAlert.status === 'new' && (
                  <>
                    <Button
                      variant="default"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleUpdateAlert('under-review')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Mark Under Review
                    </Button>
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateAlert('resolved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                    <Button
                      variant="default"
                      className="bg-gray-600 hover:bg-gray-700"
                      onClick={() => handleUpdateAlert('false-positive')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      False Positive
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rule Edit Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Monitoring Rule</DialogTitle>
            <DialogDescription>
              {selectedRule?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedRule && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={selectedRule.name}
                  onChange={(e) => setSelectedRule({ 
                    ...selectedRule, 
                    name: e.target.value 
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={selectedRule.description}
                  onChange={(e) => setSelectedRule({ 
                    ...selectedRule, 
                    description: e.target.value 
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select 
                    value={selectedRule.severity}
                    onValueChange={(value) => setSelectedRule({
                      ...selectedRule,
                      severity: value as 'low' | 'medium' | 'high' | 'critical'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeWindow">Time Window (minutes)</Label>
                  <Input
                    id="timeWindow"
                    type="number"
                    min={1}
                    value={selectedRule.thresholds.timeWindow}
                    onChange={(e) => setSelectedRule({
                      ...selectedRule,
                      thresholds: {
                        ...selectedRule.thresholds,
                        timeWindow: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTransactions">Max Transactions (optional)</Label>
                  <Input
                    id="maxTransactions"
                    type="number"
                    min={1}
                    value={selectedRule.thresholds.maxTransactions || ''}
                    onChange={(e) => setSelectedRule({
                      ...selectedRule,
                      thresholds: {
                        ...selectedRule.thresholds,
                        maxTransactions: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minAmount">Min Amount (optional)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    min={0}
                    value={selectedRule.thresholds.minAmount || ''}
                    onChange={(e) => setSelectedRule({
                      ...selectedRule,
                      thresholds: {
                        ...selectedRule.thresholds,
                        minAmount: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patternType">Pattern Type (optional)</Label>
                  <Select 
                    value={selectedRule.thresholds.patternType || ''}
                    onValueChange={(value) => setSelectedRule({
                      ...selectedRule,
                      thresholds: {
                        ...selectedRule.thresholds,
                        patternType: value as any
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="rapid">Rapid Transactions</SelectItem>
                      <SelectItem value="escalating">Escalating Amounts</SelectItem>
                      <SelectItem value="unusual-hours">Unusual Hours</SelectItem>
                      <SelectItem value="multiple-counterparties">Multiple Counterparties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <span>Enabled</span>
                    <Switch
                      checked={selectedRule.enabled}
                      onCheckedChange={(checked) => setSelectedRule({
                        ...selectedRule,
                        enabled: checked
                      })}
                    />
                  </Label>
                </div>
              </div>

              <DialogFooter className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setRuleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateRule}>
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
