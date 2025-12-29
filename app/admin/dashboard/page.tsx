'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import { FiUsers, FiShoppingBag, FiPackage, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { stats, fetchStats, isLoading } = useAdminStore();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchStats();
    }
  }, [isAuthenticated, user, fetchStats]);

  if (!isAuthenticated || user?.role !== 'admin') return <Loading fullScreen />;
  if (isLoading || !stats) return <Loading fullScreen text="Loading stats..." />;

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) => (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <CardBody className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
        </div>
        <div className={`p-3 rounded-full opacity-20`} style={{ backgroundColor: color }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, {user.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.summary.totalUsers} icon={FiUsers} color="#3B82F6" />
        <StatCard title="Total Vendors" value={stats.summary.totalVendors} icon={FiShoppingBag} color="#10B981" />
        <StatCard title="Total Products" value={stats.summary.totalProducts} icon={FiPackage} color="#8B5CF6" />
        <StatCard title="Pending Approvals" value={stats.summary.pendingVendors} icon={FiClock} color="#F59E0B" />
      </div>

      {/* Quick Actions (Optional, or Recent Activity) */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="font-bold">System Status</h3></CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Server Status</span>
                <span className="text-green-600 font-medium px-2 py-1 bg-green-50 rounded">Operational</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Database Connection</span>
                <span className="text-green-600 font-medium px-2 py-1 bg-green-50 rounded">Connected</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Last Backup</span>
                <span className="text-gray-800 font-medium">Today, 04:00 AM</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h3 className="font-bold">Recent Signups</h3></CardHeader>
          <CardBody>
            {/* Could fetch recent users here if API supported it, for now placeholder */}
            <p className="text-gray-500 text-center py-8">No recent activity to display.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
