'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  AlertTriangle, 
  FileText, 
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter
} from 'lucide-react';

interface ComplianceReport {
  id: string;
  type: 'kyc' | 'transaction' | 'risk' | 'regulatory';
  title: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  findings: string[];
  recommendations: string[];
}

interface ComplianceMetrics {
  totalReports: number;
  pendingReports: number;
  completedReports: number;
  highRiskUsers: number;
  suspiciousTransactions: number;
  kycCompliance: number;
  regulatoryIssues: number;
}

export default function AdvancedComplianceTools() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    totalReports: 0,
    pendingReports: 0,
    completedReports: 0,
    highRiskUsers: 0,
    suspiciousTransactions: 0,
    kycCompliance: 95,
    regulatoryIssues: 0
  });
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setMetrics({
        totalReports: 156,
        pendingReports: 12,
        completedReports: 144,
        highRiskUsers: 8,
        suspiciousTransactions: 23,
        kycCompliance: 95.5,
        regulatoryIssues: 2
      });

      setReports([
        {
          id: '1',
          type: 'kyc',
          title: 'KYC Verification Audit',
          status: 'completed',
          createdAt: new Date('2024-06-25'),
          completedAt: new Date('2024-06-26'),
          severity: 'medium',
          description: 'Monthly KYC compliance verification audit',
          findings: ['95.5% compliance rate', '3 pending verifications', '2 rejected documents'],
          recommendations: ['Follow up on pending verifications', 'Review document quality guidelines']
        },
        {
          id: '2',
          type: 'transaction',
          title: 'Suspicious Transaction Analysis',
          status: 'pending',
          createdAt: new Date('2024-06-28'),
          severity: 'high',
          description: 'Analysis of flagged transactions for potential money laundering',
          findings: ['Large transaction patterns detected', '3 accounts flagged for review'],
          recommendations: ['Investigate flagged accounts', 'Enhanced monitoring required']
        },
        {
          id: '3',
          type: 'regulatory',
          title: 'FSCA Compliance Report',
          status: 'completed',
          createdAt: new Date('2024-06-20'),
          completedAt: new Date('2024-06-22'),
          severity: 'low',
          description: 'Quarterly regulatory compliance assessment',
          findings: ['All regulatory requirements met', 'Documentation up to date'],
          recommendations: ['Maintain current compliance practices']
        }
      ]);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string) => {
    console.log(`Generating ${type} report...`);
    // Implement report generation logic
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">{metrics.totalReports}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk Users</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.highRiskUsers}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">KYC Compliance</p>
                <p className="text-2xl font-bold text-green-600">{metrics.kycCompliance}%</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regulatory Issues</p>
                <p className="text-2xl font-bold text-red-600">{metrics.regulatoryIssues}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>View and manage compliance reports and audits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Search Reports</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="search"
                      placeholder="Search by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="kyc">KYC</SelectItem>
                      <SelectItem value="transaction">Transaction</SelectItem>
                      <SelectItem value="risk">Risk</SelectItem>
                      <SelectItem value="regulatory">Regulatory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(report.status)}
                          <h3 className="font-semibold">{report.title}</h3>
                          <Badge className={getSeverityColor(report.severity)}>
                            {report.severity}
                          </Badge>
                          <Badge variant="outline">
                            {report.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                        <div className="text-xs text-gray-500">
                          Created: {report.createdAt.toLocaleDateString()}
                          {report.completedAt && ` • Completed: ${report.completedAt.toLocaleDateString()}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Compliance Monitoring</CardTitle>
              <CardDescription>Real-time monitoring of compliance metrics and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-medium">Transaction Monitoring</span>
                  </div>
                  <p className="text-sm text-gray-600">Active monitoring for suspicious patterns</p>
                  <p className="text-lg font-bold text-green-600 mt-2">Normal</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                    <span className="font-medium">KYC Queue</span>
                  </div>
                  <p className="text-sm text-gray-600">Documents pending verification</p>
                  <p className="text-lg font-bold text-orange-600 mt-2">{metrics.pendingReports} Pending</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    <span className="font-medium">Risk Assessment</span>
                  </div>
                  <p className="text-sm text-gray-600">Automated risk scoring active</p>
                  <p className="text-lg font-bold text-blue-600 mt-2">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Compliance Reports</CardTitle>
              <CardDescription>Create new compliance reports and audits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => generateReport('kyc')}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <Shield className="h-6 w-6" />
                  KYC Compliance Report
                </Button>

                <Button
                  onClick={() => generateReport('transaction')}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <DollarSign className="h-6 w-6" />
                  Transaction Analysis
                </Button>

                <Button
                  onClick={() => generateReport('risk')}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <AlertTriangle className="h-6 w-6" />
                  Risk Assessment Report
                </Button>

                <Button
                  onClick={() => generateReport('regulatory')}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <FileText className="h-6 w-6" />
                  Regulatory Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
