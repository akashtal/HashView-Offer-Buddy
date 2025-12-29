'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiPhone,
  FiPackage,
  FiTrendingUp,
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { formatCurrency } from '@/lib/utils';

export default function VendorDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const {
    myVendorProfile,
    myProducts,
    myAnalytics,
    isLoading,
    error,
    fetchMyProfile,
  } = useVendorStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'analytics'>('overview');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'vendor') {
      router.push('/login');
      return;
    }

    fetchMyProfile();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (error === 'Vendor profile not found' || error?.includes('not found')) {
      router.push('/vendor/onboarding');
    }
  }, [error, router]);

  if (isLoading || !myVendorProfile) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  const stats = [
    {
      label: 'Total Products',
      value: myVendorProfile.analytics.totalProducts,
      icon: FiPackage,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Total Views',
      value: myVendorProfile.analytics.totalViews,
      icon: FiEye,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Total Contacts',
      value: myVendorProfile.analytics.totalContacts,
      icon: FiPhone,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Shop Rating',
      value: myVendorProfile.rating?.toFixed(1) || 'N/A',
      icon: FiTrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="min-h-screen bg-accent-light">
      {/* Header */}
      <div className="bg-secondary text-white py-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {myVendorProfile.shopLogo ? (
                <div className="relative w-16 h-16">
                  <Image
                    src={myVendorProfile.shopLogo}
                    alt={myVendorProfile.shopName}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {myVendorProfile.shopName[0]}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{myVendorProfile.shopName}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge
                    variant={myVendorProfile.isApproved ? 'success' : 'warning'}
                  >
                    {myVendorProfile.isApproved ? 'Approved' : 'Pending Approval'}
                  </Badge>
                  <Badge variant={myVendorProfile.isActive ? 'success' : 'danger'}>
                    {myVendorProfile.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href={`/vendors/${myVendorProfile._id}`}>
                <Button variant="outline">View Public Profile</Button>
              </Link>
              <Link href="/vendor/settings">
                <Button variant="primary">
                  <FiEdit className="inline mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Approval Warning */}
        {!myVendorProfile.isApproved && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">
              ⚠️ Your vendor account is pending approval. You can add products, but they won&apos;t be visible to users until your account is approved by an admin.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
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

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-secondary'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'products'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-secondary'
                }`}
            >
              Products ({myProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'analytics'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-secondary'
                }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-secondary">Quick Actions</h2>
              </CardHeader>
              <CardBody>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Link href="/vendor/products/new">
                    <Button variant="primary" fullWidth>
                      <FiPlus className="inline mr-2" />
                      Add New Product
                    </Button>
                  </Link>
                  <Link href="/vendor/settings">
                    <Button variant="outline" fullWidth>
                      <FiEdit className="inline mr-2" />
                      Edit Shop Profile
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* Top Products */}
            {myAnalytics?.topProducts && myAnalytics.topProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-secondary">
                    Top Performing Products
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {myAnalytics.topProducts.map((product: any) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-secondary">
                            {product.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <FiEye size={14} />
                              {product.analytics.views} views
                            </span>
                            <span className="flex items-center gap-1">
                              <FiPhone size={14} />
                              {product.analytics.contacts} contacts
                            </span>
                          </div>
                        </div>
                        <Link href={`/vendor/products/${product._id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <FiEdit />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-secondary">Your Products</h2>
              <Link href="/vendor/products/new">
                <Button variant="primary">
                  <FiPlus className="inline mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>

            {myProducts.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="text-center py-12">
                    <FiPackage size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-secondary mb-2">
                      No products yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Start by adding your first product or offer
                    </p>
                    <Link href="/vendor/products/new">
                      <Button variant="primary">
                        <FiPlus className="inline mr-2" />
                        Add Your First Product
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProducts.map((product: any) => (
                  <Card key={product._id}>
                    <div className="relative h-48 bg-gray-100">
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                      {!product.isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="warning">Inactive</Badge>
                        </div>
                      )}
                    </div>
                    <CardBody>
                      <h3 className="font-semibold text-lg text-secondary mb-2 line-clamp-2">
                        {product.title}
                      </h3>
                      {product.price && (
                        <p className="text-xl font-bold text-primary mb-3">
                          {formatCurrency(product.price.discounted || product.price.original)}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <FiEye size={14} />
                          {product.analytics.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiPhone size={14} />
                          {product.analytics.contacts}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/vendor/products/${product._id}/edit`}
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" fullWidth>
                            <FiEdit className="inline mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this product?')) {
                              try {
                                await useVendorStore.getState().deleteProduct(product._id);
                              } catch (err) {
                                alert('Failed to delete product');
                              }
                            }
                          }}
                        >
                          <FiTrash2 className="text-red-600" />
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && myAnalytics && (
          <div className="space-y-6">
            {/* Views Chart */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-secondary">Views Over Time</h2>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={myAnalytics.viewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#FDB913"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Contacts Chart */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-secondary">Contacts Over Time</h2>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={myAnalytics.contactsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="contacts"
                      stroke="#000000"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

