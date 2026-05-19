'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';
import { io, Socket } from 'socket.io-client';
import SEOHead from '@/components/SEOHead';
import Link from 'next/link';

interface TimelineEvent {
  status: string;
  note: string;
  timestamp: string;
  _id: string;
}

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/orders/${params.id}`);
      return;
    }

    let socket: Socket;

    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`/api/orders/${params.id}`);
        setOrder(data);
        setUpdateStatus(data.orderStatus);
        setTrackingNumber(data.trackingNumber || '');
        
        // Connect to Socket.io for real-time updates
        socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
          withCredentials: true
        });

        socket.emit('join_order_room', params.id);

        socket.on('order_status_update', (update) => {
          setOrder((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              orderStatus: update.status,
              trackingTimeline: [...prev.trackingTimeline, update]
            };
          });
        });

      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user, router, params.id]);

  if (loading) return <div className="text-center py-20">Loading order details...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!order) return null;

  const statuses = ["pending", "processing", "shipped", "delivered"];
  const currentStepIndex = statuses.indexOf(order.orderStatus);

  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { data } = await axios.put(`/api/orders/${params.id}/status`, {
        status: updateStatus,
        note: updateNote,
        trackingNumber
      });
      setOrder(data);
      setUpdateNote('');
      alert('Order status updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <SEOHead title={`Order #${order._id} | BookBazaar`} description="Track your order" metaRobots="noindex,nofollow" />
      
      {isSuccess && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-navy-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600">Thank you for your purchase. We've received your order and are getting it ready.</p>
        </div>
      )}

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Order Tracking</h1>
          <p className="text-gray-500">Order #{order._id}</p>
        </div>
        <Link href={user?.role === 'admin' ? '/admin/orders' : '/profile'} className="text-teal-600 hover:underline font-medium">Back to Orders</Link>
      </div>

      {user?.role === 'admin' && (
        <div className="card p-6 mb-8 border-l-4 border-teal-500">
          <h2 className="text-xl font-bold text-navy-900 mb-4">Admin Controls: Update Order Status</h2>
          <form onSubmit={handleAdminUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)} className="input-field">
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tracking Number</label>
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. UPS 1Z999..." className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Update Note (visible to customer)</label>
              <input value={updateNote} onChange={(e) => setUpdateNote(e.target.value)} placeholder="e.g. Your order has been dispatched." className="input-field" />
            </div>
            <button type="submit" disabled={isUpdating} className="btn-primary">
              {isUpdating ? 'Updating...' : 'Update Order'}
            </button>
          </form>
        </div>
      )}

      <div className="card p-8 mb-8">
        {/* Progress Bar */}
        <div className="relative mb-12 mt-4">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div 
              style={{ width: `${(currentStepIndex / (statuses.length - 1)) * 100}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500 transition-all duration-500"
            ></div>
          </div>
          <div className="flex justify-between">
            {statuses.map((status, index) => (
              <div key={status} className={`text-xs font-bold uppercase ${index <= currentStepIndex ? 'text-teal-600' : 'text-gray-400'}`}>
                {status}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <h2 className="text-xl font-bold text-navy-900 mb-6">Tracking Timeline</h2>
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
          {order.trackingTimeline.map((event: TimelineEvent, index: number) => (
            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-teal-100 text-teal-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" fillRule="evenodd"></path>
                </svg>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-navy-900 uppercase text-sm">{event.status}</div>
                  <time className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</time>
                </div>
                <div className="text-gray-600 text-sm">{event.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="font-bold text-navy-900 mb-4 border-b pb-2">Shipping Information</h3>
          <p className="text-gray-600">{order.shippingAddress.street}</p>
          <p className="text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
          <p className="text-gray-600">{order.shippingAddress.country}</p>
          {order.trackingNumber && (
            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-sm text-gray-500 block mb-1">Carrier Tracking Number</span>
              <span className="font-mono font-bold text-navy-900">{order.trackingNumber}</span>
            </div>
          )}
        </div>
        
        <div className="card p-6">
          <h3 className="font-bold text-navy-900 mb-4 border-b pb-2">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div key={item._id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.qty}x {item.productId?.name || 'Product'}</span>
                <span className="font-medium">Rs. {(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-3 border-t mt-3 flex justify-between font-bold text-navy-900">
              <span>Total</span>
              <span>Rs. {order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
