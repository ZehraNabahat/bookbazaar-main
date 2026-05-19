'use client';

import { useAuth } from '@/context/AuthContext';
import SEOHead from '@/components/SEOHead';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p className="text-gray-600 mb-6">You need to log in to view your profile.</p>
        <Link href="/login" className="btn-primary">Log In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <SEOHead title="My Profile | BookBazaar" description="View your profile details." />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-navy-900">My Profile</h1>
        <button onClick={logout} className="btn-outline text-red-500 border-red-500 hover:bg-red-500 hover:text-white">
          Logout
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-4xl font-bold mb-4">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-navy-900">{user.name}</h2>
            <p className="text-gray-500 mb-4">{user.email}</p>
            <span className="badge-success mb-6">{user.role === 'admin' ? 'Administrator' : 'Student'}</span>
            
            <Link href="/sell" className="btn-primary w-full">
              Sell a New Book
            </Link>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="card p-6 h-full">
            <h3 className="text-xl font-bold text-navy-900 mb-4">My Account</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">My Listings</h4>
                  <p className="text-sm text-gray-500">Manage the books you are selling</p>
                </div>
                <Link href="/products" className="text-teal-600 font-medium hover:underline">View All</Link>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">Order History</h4>
                  <p className="text-sm text-gray-500">Track your recent book purchases</p>
                </div>
                <span className="text-gray-400 text-sm italic">Coming soon</span>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">Saved Payment Methods</h4>
                  <p className="text-sm text-gray-500">Manage your cards and checkout details</p>
                </div>
                <span className="text-gray-400 text-sm italic">Coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
