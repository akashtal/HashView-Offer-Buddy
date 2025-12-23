'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiShoppingBag, FiPackage, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      const [statsRes, vendorsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/vendors?status=pending'),
      ]);

      setStats(statsRes.data.data);
      setPendingVendors(vendorsRes.data.data.vendors);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveVendor = async (vendorId: string) => {
    try {
      await axios.post(`/api/admin/vendors/${vendorId}/approve`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to approve vendor:', error);
    }
  };

  const handleBlockVendor = async (vendorId: string, isActive: boolean) => {
    try {
      await axios.post(`/api/admin/vendors/${vendorId}/block`, { isActive });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to block vendor:', error);
    }
  };

  if (isLoading || !stats) {
    return <Loading fullScreen text="Loading admin dashboard..." />;
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.summary.totalUsers,
      icon: FiUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Total Vendors',
      value: stats.summary.totalVendors,
      icon: FiShoppingBag,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Total Products',
      value: stats.summary.totalProducts,
      icon: FiPackage,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Pending Approvals',
      value: stats.summary.pendingVendors,
      icon: FiClock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="min-h-screen bg-accent-light">
      {/* Header */}
      <div className="bg-secondary text-white py-8">
        <div className="container-custom">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-300 mt-2">
            Manage users, vendors, and platform settings
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-secondary">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`${stat.color}`} size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Pending Vendor Approvals */}
        {pendingVendors.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-bold text-secondary">
                Pending Vendor Approvals ({pendingVendors.length})
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {pendingVendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold text-lg text-secondary">
                        {vendor.shopName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {vendor.location.city}, {vendor.location.state}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted {formatRelativeTime(vendor.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveVendor(vendor._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleBlockVendor(vendor._id, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Recent Users */}
        {stats.recentUsers && stats.recentUsers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-bold text-secondary">Recent Users</h2>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-secondary">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-secondary">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-secondary">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-secondary">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((user: any) => (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              user.role === 'admin'
                                ? 'danger'
                                : user.role === 'vendor'
                                ? 'primary'
                                : 'info'
                            }
                            size="sm"
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatRelativeTime(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Top Vendors */}
        {stats.topVendors && stats.topVendors.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-secondary">
                Top Performing Vendors
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {stats.topVendors.slice(0, 10).map((vendor: any, index: number) => (
                  <div
                    key={vendor._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-secondary">
                          {vendor.shopName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {vendor.analytics.totalViews} views •{' '}
                          {vendor.analytics.totalContacts} contacts
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

