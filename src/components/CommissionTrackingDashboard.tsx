'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  Trophy,
  Download,
  Share2
} from 'lucide-react';
import { commissionAutomationService, Commission, CommissionPayout, ReferralLeaderboard } from '@/lib/commission-automation-service';
import { formatCurrency } from '@/lib/utils';

interface CommissionStats {
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  monthlyCommissions: number;
  commissionsCount: number;
}

export default function CommissionTrackingDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [recentCommissions, setRecentCommissions] = useState<Commission[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<CommissionPayout[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const loadCommissionData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const dashboard = await commissionAutomationService.getCommissionDashboard(user.uid);
      
      setStats({
        totalCommissions: dashboard.totalCommissions,
        pendingCommissions: dashboard.pendingCommissions,
        paidCommissions: dashboard.paidCommissions,
        monthlyCommissions: dashboard.monthlyCommissions,
        commissionsCount: dashboard.commissionsCount
      });

      setRecentCommissions(dashboard.recentCommissions);
      setRecentPayouts(dashboard.recentPayouts);

    } catch (error) {
      console.error('Error loading commission data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const leaderboardData = await commissionAutomationService.getReferralLeaderboard(10);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadCommissionData();
      loadLeaderboard();
    }
  }, [user, loadCommissionData, loadLeaderboard]);

  const getStatusColor = (status: Commission['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const generateReferralLink = () => {
    if (!user) return '';
    return `${window.location.origin}/auth/signup?ref=${user.uid}`;
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(generateReferralLink());
      // Show success toast
    } catch (error) {
      console.error('Failed to copy referral link:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#193281]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Tracking</h1>
          <p className="text-gray-600">Monitor your referral earnings and performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyReferralLink}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Referral Link
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.totalCommissions || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.monthlyCommissions || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.pendingCommissions || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.commissionsCount || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Commissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentCommissions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          {commission.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="capitalize">
                          {commission.transactionType.replace('_', ' ')}
                        </TableCell>
                        <TableCell>{formatCurrency(commission.amount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(commission.status)}>
                            {commission.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No commissions yet. Start referring users to earn commissions!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPayouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Commissions</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          {payout.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>{formatCurrency(payout.totalAmount)}</TableCell>
                        <TableCell>{payout.commissionCount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payout.status as any)}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No payouts yet. Payouts are processed automatically once you reach the minimum threshold.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>All Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Referral</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {commission.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>{commission.referredUserId.slice(0, 8)}...</TableCell>
                      <TableCell className="capitalize">
                        {commission.transactionType.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{commission.commissionRate}%</TableCell>
                      <TableCell>{formatCurrency(commission.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(commission.status)}>
                          {commission.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Referrers This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Monthly Commissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry) => (
                    <TableRow key={entry.userId}>
                      <TableCell>
                        <div className="flex items-center">
                          {entry.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500 mr-1" />}
                          {entry.rank === 2 && <Trophy className="h-4 w-4 text-gray-400 mr-1" />}
                          {entry.rank === 3 && <Trophy className="h-4 w-4 text-amber-600 mr-1" />}
                          #{entry.rank}
                        </div>
                      </TableCell>
                      <TableCell>{entry.userName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.membershipTier}</Badge>
                      </TableCell>
                      <TableCell>{entry.activeReferrals}</TableCell>
                      <TableCell>{formatCurrency(entry.monthlyCommissions)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
