'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from '@/lib/axios';
import SEOHead from '@/components/SEOHead';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });

      if (redirect.startsWith('/admin') && data.role !== 'admin') {
        await axios.post('/api/auth/logout').catch(() => {});
        setError(
          'This account is not an admin. Use admin@bookbazaar.com / admin123 after running: cd backend && npm run seed:admin'
        );
        return;
      }

      login(data);
      if (data.role === 'admin' && (redirect === '/' || redirect.startsWith('/admin'))) {
        router.push('/admin');
      } else {
        router.push(redirect);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold text-navy-900 mb-6 text-center">Welcome Back</h1>
      
      {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input 
            type="email" 
            required 
            className="input-field" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            required 
            className="input-field" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full py-3">Log In</button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account? <Link href={`/register?redirect=${redirect}`} className="text-teal-600 font-bold hover:underline">Sign up</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-12">
      <SEOHead title="Log In | BookBazaar" description="Log in to your account" />
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
