'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [revenuePercentage, setRevenuePercentage] = useState<number>(5);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: statsData } = await axios.get('/api/admin/stats');
        setStats(statsData);
        
        const { data: sales } = await axios.get('/api/admin/analytics/sales');
        setSalesData(sales);

        const { data: settings } = await axios.get('/api/admin/settings');
        setRevenuePercentage(settings.revenuePercentage || 5);
      } catch (error) {
        console.error("Failed to load admin stats", error);
      }
    };
    fetchStats();
  }, []);

  const handleUpdatePercentage = async () => {
    setIsUpdating(true);
    try {
      await axios.post('/api/admin/settings', { revenuePercentage });
      // Refresh stats
      const { data: statsData } = await axios.get('/api/admin/stats');
      setStats(statsData);
      const { data: sales } = await axios.get('/api/admin/analytics/sales');
      setSalesData(sales);
      alert('Revenue percentage updated successfully!');
    } catch (error) {
      console.error('Failed to update settings', error);
      alert('Failed to update revenue percentage');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!stats) return <div>Loading dashboard...</div>;

  const formatDayLabel = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const lineChartData = {
    labels: salesData.map((item) => formatDayLabel(item._id)),
    datasets: [
      {
        label: 'Revenue (Rs.)',
        data: salesData.map(item => item.revenue),
        borderColor: '#5BC0BE',
        backgroundColor: 'rgba(91, 192, 190, 0.5)',
        tension: 0.3,
      }
    ],
  };

  const lineChartOptions = {
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 15,
        },
      },
    },
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Dashboard Overview</h1>
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-sm font-medium mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-navy-900">Rs. {stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-sm font-medium mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-navy-900">{stats.totalOrders}</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-sm font-medium mb-1">Total Users</p>
          <p className="text-3xl font-bold text-navy-900">{stats.totalUsers}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <p className="text-red-500 text-sm font-medium mb-1">Low Stock Alerts</p>
          <p className="text-3xl font-bold text-red-700">{stats.lowStockCount}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-gray-200 p-6 rounded-lg">
          <h2 className="text-lg font-bold text-navy-900 mb-1">Revenue Over Time</h2>
          <p className="text-sm text-gray-500 mb-4">Daily revenue for the last 30 days</p>
          <div className="h-72">
            <Line 
              data={lineChartData} 
              options={lineChartOptions} 
            />
          </div>
        </div>

        {/* Settings Card */}
        <div className="border border-gray-200 p-6 rounded-lg bg-white shadow-sm">
          <h2 className="text-lg font-bold text-navy-900 mb-4">Platform Settings</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Percentage (%)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="input-field flex-1"
                value={revenuePercentage}
                onChange={(e) => setRevenuePercentage(parseFloat(e.target.value))}
              />
              <button
                onClick={handleUpdatePercentage}
                disabled={isUpdating}
                className="btn-primary whitespace-nowrap px-4 py-2"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Adjust the percentage of total sales calculated as platform revenue. Changes apply to the overview display immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
