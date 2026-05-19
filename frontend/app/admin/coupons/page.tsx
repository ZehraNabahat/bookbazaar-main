'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percent',
    value: 0,
    minOrderAmount: 0,
    usageLimit: '',
    expiresAt: '',
  });

  const fetchCoupons = async () => {
    try {
      const { data } = await axios.get('/api/coupons/admin');
      setCoupons(data);
    } catch (error) {
      console.error("Failed to load coupons", error);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        value: Number(formData.value),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      };
      await axios.post('/api/coupons/admin', payload);
      setShowModal(false);
      setFormData({
        code: '',
        discountType: 'percent',
        value: 0,
        minOrderAmount: 0,
        usageLimit: '',
        expiresAt: '',
      });
      fetchCoupons();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await axios.delete(`/api/coupons/admin/${id}`);
      fetchCoupons();
    } catch (error) {
      alert('Failed to delete coupon');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Coupons</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Coupon</button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-navy-900 mb-4">Add New Coupon</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code</label>
                <input required name="code" value={formData.code} onChange={handleChange} className="input-field uppercase" placeholder="e.g. SAVE20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <select required name="discountType" value={formData.discountType} onChange={handleChange} className="input-field">
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value</label>
                  <input required type="number" step="0.01" name="value" value={formData.value} onChange={handleChange} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Amount (Rs.)</label>
                <input type="number" step="0.01" name="minOrderAmount" value={formData.minOrderAmount} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usage Limit (Leave blank for unlimited)</label>
                <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleChange} className="input-field" placeholder="e.g. 100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input required type="date" name="expiresAt" value={formData.expiresAt} onChange={handleChange} className="input-field" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">Create Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <button onClick={() => handleDelete(coupon._id)} className="text-red-500 hover:underline">Delete</button>
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
