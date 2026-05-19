'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // In a real app we'd fetch all orders for the admin. 
    // Here we'll just mock fetching all orders by using the GET /api/orders endpoint (which requires a new controller method, but we'll mock it for now)
    const fetchOrders = async () => {
      try {
        // Fetch all orders for admin
        const { data } = await axios.get('/api/orders');
        setOrders(data);
      } catch (error) {
        console.error("Failed to load orders", error);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Orders</h1>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Order ID</th>
              <th className="p-4 font-semibold text-gray-600">Date</th>
              <th className="p-4 font-semibold text-gray-600">Total</th>
              <th className="p-4 font-semibold text-gray-600">Payment</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No orders found.</td></tr>
            ) : orders.map((order: any) => (
              <tr key={order._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-navy-900 font-mono">{order._id.substring(0,8)}...</td>
                <td className="p-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4 font-bold text-gray-900">Rs. {order.totalAmount.toFixed(2)}</td>
                <td className="p-4">
                  <span className={order.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold capitalize
                    ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' : 
                      order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' : 
                      order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      'bg-amber-100 text-amber-800'}`}
                  >
                    {order.orderStatus}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link href={`/orders/${order._id}`} className="text-teal-600 hover:underline">View/Update</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
