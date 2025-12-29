'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiUser, FiPhone } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';

import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';
// ... existing imports

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'vendor' ? 'vendor' : 'user';

  const { register, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: defaultRole as 'user' | 'vendor',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-accent-light">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-secondary mb-2">
                Create Account
              </h1>
              <p className="text-gray-600">Join Offer Buddy today</p>
            </div>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Personal Details</h3>
                  <Input
                    type="text"
                    name="name"
                    label="Full Name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    icon={<FiUser />}
                  />

                  <Input
                    type="email"
                    name="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    icon={<FiMail />}
                  />

                  <Input
                    type="password"
                    name="password"
                    label="Password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    icon={<FiLock />}
                  />

                  <Input
                    type="password"
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    icon={<FiLock />}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Contact & Address</h3>
                  <Input
                    type="tel"
                    name="phone"
                    label="Phone Number"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    icon={<FiPhone />}
                  />

                  <Input
                    type="text"
                    name="address"
                    label="Address Line"
                    placeholder="Street, Area"
                    value={formData.address}
                    onChange={handleChange}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      name="city"
                      label="City"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                    />
                    <Input
                      type="text"
                      name="pincode"
                      label="Pincode"
                      placeholder="123456"
                      value={formData.pincode}
                      onChange={handleChange}
                    />
                  </div>
                  <Input
                    type="text"
                    name="state"
                    label="State"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="user">Customer</option>
                  <option value="vendor">Business Owner / Vendor</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
                size="lg"
              >
                Create Account
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  Login
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

