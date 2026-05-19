'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

export default function InventoryAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: analyticsData } = await axios.get('/api/admin/analytics/inventory');
        setData(analyticsData);
        // Automatically run AI prediction
        if (!prediction && !loadingAI) {
          handleAIPrediction(analyticsData);
        }
      } catch (error) {
        console.error("Failed to load analytics", error);
      }
    };
    fetchAnalytics();
  }, []);

  const handleAIPrediction = async (inventoryData = data) => {
    setLoadingAI(true);
    try {
      const { data: salesData } = await axios.get('/api/admin/analytics/sales');
      
      const { data: predictionData } = await axios.post('/api/ai/admin/ai/predict-demand', {
        salesData,
        inventoryData: inventoryData
      });
      setPrediction(predictionData);
    } catch (error) {
      console.error("AI prediction failed", error);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleRestock = async (productId: string, amount: number) => {
    try {
      await axios.post('/api/admin/inventory/restock', { productId, amount });
      alert(`Successfully queued automated restock for ${amount} units.`);
      // Refresh inventory data
      const { data: analyticsData } = await axios.get('/api/admin/analytics/inventory');
      setData(analyticsData);
    } catch (err) {
      console.error(err);
      alert('Failed to execute automated restock.');
    }
  };

  if (!data) return <div>Loading...</div>;

  const barChartData = {
    labels: data.categoryStats.map((c: any) => c._id),
    datasets: [
      {
        label: 'Total Stock',
        data: data.categoryStats.map((c: any) => c.totalStock),
        backgroundColor: '#3A506B',
      },
      {
        label: 'Total Sold',
        data: data.categoryStats.map((c: any) => c.totalSold),
        backgroundColor: '#5BC0BE',
      }
    ],
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Inventory Analytics</h1>

      {/* AI Demand Prediction Card */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 p-8 rounded-xl text-white mb-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <span className="text-teal-400">✧</span> AI Demand Prediction
              </h2>
              <p className="text-gray-300">Analyze the last 6 months of sales to forecast demand and suggest restocks.</p>
            </div>
            {!prediction && (
              <button 
                onClick={handleAIPrediction}
                disabled={loadingAI}
                className="btn-secondary whitespace-nowrap shadow-lg"
              >
                {loadingAI ? 'Analyzing Data...' : 'Run Analysis'}
              </button>
            )}
          </div>

          {prediction && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
              <p className="text-lg leading-relaxed mb-6 font-medium text-teal-50">{prediction.summary}</p>
              
              <h3 className="text-sm uppercase tracking-wider font-bold text-teal-400 mb-2 mt-4">Predicted Demand</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {prediction.predictions?.map((pred: any, idx: number) => (
                  <div key={idx} className="bg-navy-900/50 p-4 rounded border border-navy-700">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-white text-lg">{pred.expectedTrending}</p>
                      <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded border border-teal-500/30 whitespace-nowrap ml-2">{pred.timeframe}</span>
                    </div>
                    {pred.trendExplanation && <p className="text-sm text-gray-400 mt-2">{pred.trendExplanation}</p>}
                  </div>
                ))}
              </div>

              <h3 className="text-sm uppercase tracking-wider font-bold text-teal-400 mb-2">Suggested Restocks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prediction.suggestions?.map((sug: any, idx: number) => (
                  <div key={idx} className="bg-navy-900/50 p-4 rounded border border-navy-700 flex flex-col justify-between">
                    <div>
                      <p className="text-lg font-bold text-white mb-1">{sug.productName}</p>
                      <p className="text-sm text-gray-300 mb-2">{sug.reason}</p>
                    </div>
                    <p className="text-xl font-bold text-teal-300 mt-2">+{sug.suggestedRestock} <span className="text-sm font-normal text-gray-500">units</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stock vs Sold Chart & Projections */}
        <div className="lg:col-span-2 border border-gray-200 p-6 rounded-lg bg-white shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-navy-900 mb-4">Stock vs. Sold by Category</h2>
          <div className="h-80 flex-shrink-0">
            <Bar 
              data={barChartData} 
              options={{ maintainAspectRatio: false }} 
            />
          </div>
          
          {data.projections && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              {data.projections.map((proj: any) => (
                <div key={proj.category} className="bg-gray-50 border border-gray-100 p-3 rounded text-center shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">{proj.category}</p>
                  <p className="text-sm font-medium text-navy-900 mt-1">Projected next month: <br/><span className="text-teal-600 font-bold">{proj.projectedNeed} units</span></p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Health */}
        <div className="border border-gray-200 p-6 rounded-lg bg-white shadow-sm">
          <h2 className="text-lg font-bold text-navy-900 mb-6">Inventory Health</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-green-700">Healthy Stock (&gt;10)</span>
                <span className="font-bold text-gray-900">{data.health.inStock} items</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-amber-600">Low Stock (&lt;10)</span>
                <span className="font-bold text-gray-900">{data.health.lowStock} items</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-amber-400 h-3 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-red-600">Out of Stock (0)</span>
                <span className="font-bold text-gray-900">{data.health.outOfStock} items</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div className="bg-red-500 h-3 rounded-full" style={{ width: '10%' }}></div>
              </div>

              {data.health.outOfStockItems && data.health.outOfStockItems.length > 0 && (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {data.health.outOfStockItems.map((item: any) => (
                    <div key={item._id} className="flex items-center gap-3 p-2 bg-red-50 border border-red-100 rounded-lg">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">No Img</div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                        <p className="text-xs font-bold text-red-600 bg-red-100/50 inline-block px-1 mt-1 rounded">Auto-restock suggested: 15 units</p>
                      </div>
                      <button onClick={() => handleRestock(item._id, 15)} className="px-3 py-1 bg-navy-600 hover:bg-navy-700 text-white text-xs font-bold rounded shrink-0 shadow transition-colors">
                        Restock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Price Trend Chart */}
        <div className="lg:col-span-3 border border-gray-200 p-6 rounded-lg bg-white shadow-sm mt-8">
          <h2 className="text-lg font-bold text-navy-900 mb-4">Category Price Trends (6 Months)</h2>
          <div className="h-80">
            {data.priceTrends ? (
              <Line 
                data={data.priceTrends} 
                options={{ maintainAspectRatio: false }} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Loading price trends...</div>
            )}
          </div>
        </div>
        
        {/* Product Performance Custom Chart */}
        <div className="lg:col-span-3 border border-gray-200 p-6 rounded-lg bg-white shadow-sm mt-2">
          <h2 className="text-lg font-bold text-navy-900 mb-6">Product Performance (Stock vs Sold)</h2>
          <div className="space-y-6">
            {data.products?.slice(0, 8).map((product: any) => {
              const maxVal = Math.max(product.stock, product.sold, 1);
              const stockWidth = `${(product.stock / maxVal) * 100}%`;
              const soldWidth = `${(product.sold / maxVal) * 100}%`;
              
              return (
                <div key={product._id} className="flex items-center gap-4">
                  <div className="w-48 shrink-0 flex items-center gap-3">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 border border-gray-200 shadow-sm">N/A</div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-navy-900 truncate" title={product.name}>{product.name}</p>
                      <p className="text-xs text-gray-500 font-medium">Rs. {product.price.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center gap-2 border-l pl-4 border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-16 text-xs text-right text-gray-500 uppercase tracking-wider font-semibold">Stock</div>
                      <div className="flex-1 h-4 bg-gray-100 rounded-r-md overflow-hidden flex items-center">
                        <div className="h-full bg-navy-600 rounded-r-md transition-all duration-1000" style={{ width: stockWidth }}></div>
                        <span className="text-[10px] font-bold text-gray-600 ml-2">{product.stock}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 text-xs text-right text-teal-600 uppercase tracking-wider font-semibold">Sold</div>
                      <div className="flex-1 h-4 bg-teal-50 rounded-r-md overflow-hidden flex items-center">
                        <div className="h-full bg-teal-500 rounded-r-md transition-all duration-1000" style={{ width: soldWidth }}></div>
                        <span className="text-[10px] font-bold text-teal-700 ml-2">{product.sold}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
