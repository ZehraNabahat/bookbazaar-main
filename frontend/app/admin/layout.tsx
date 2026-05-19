'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { FiHome, FiBox, FiShoppingCart, FiUsers, FiBarChart2, FiTag, FiStar, FiMessageSquare } from 'react-icons/fi';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/admin');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!user) return null;

  if (user.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto mt-16 card p-8 text-center">
        <h1 className="text-xl font-bold text-navy-900 mb-2">Admin access required</h1>
        <p className="text-gray-600 mb-4">
          You are signed in as <strong>{user.email}</strong>, which is not an admin account.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Run <code className="bg-gray-100 px-1 rounded">npm run seed:admin</code> in the backend folder,
          then log in with <strong>admin@bookbazaar.com</strong> / <strong>admin123</strong>.
        </p>
        <Link href="/login?redirect=/admin" className="btn-primary inline-block">
          Log in as admin
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 text-white rounded-l-xl p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-8 text-teal-400">Admin Panel</h2>
        <nav className="space-y-2">
          <Link href="/admin" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors">
            <FiHome /> <span>Overview</span>
          </Link>
          <Link href="/admin/products" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors">
            <FiBox /> <span>Products</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors">
            <FiShoppingCart /> <span>Orders</span>
          </Link>
          <Link href="/admin/inventory" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors">
            <FiBarChart2 /> <span>Inventory</span>
          </Link>
          <Link href="/admin/users" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors">
            <FiUsers /> <span>Users</span>
          </Link>
          <Link href="/admin/coupons" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors">
            <FiTag /> <span>Coupons</span>
          </Link>
          <Link href="/admin/reviews" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors">
            <FiStar /> <span>Reviews</span>
          </Link>
          <Link href="/admin/chatbot" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors">
            <FiMessageSquare /> <span>AI Chatbot</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white p-8 rounded-r-xl border border-l-0 border-gray-200 shadow-sm">
        {children}
      </main>
    </div>
  );
}
