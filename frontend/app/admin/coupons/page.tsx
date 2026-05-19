'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const { data } = await axios.get('/api/coupons/admin');
        setCoupons(data);
      } catch (error) {
        console.error("Failed to load coupons", error);
      }
    };
    fetchCoupons();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Coupons</h1>
        <button className="btn-primary">+ Add Coupon</button>
      </div>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Code</th>
              <th className="p-4 font-semibold text-gray-600">Discount</th>
              <th className="p-4 font-semibold text-gray-600">Usage</th>
              <th className="p-4 font-semibold text-gray-600">Expires</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon: any) => (
              <tr key={coupon._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-navy-900 uppercase font-mono">{coupon.code}</td>
                <td className="p-4 text-teal-600 font-bold">
                  {coupon.discountType === 'percent' ? `${coupon.value}%` : `$${coupon.value}`}
                </td>
                <td className="p-4 text-gray-600">
                  {coupon.usedCount} / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                </td>
                <td className="p-4 text-gray-500 text-sm">{new Date(coupon.expiresAt).toLocaleDateString()}</td>
                <td className="p-4 text-right space-x-3">
                  <button className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">No coupons found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
