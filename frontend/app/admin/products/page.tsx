'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/products?all=true&limit=50');
      setProducts(data.products);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${id}`);
        fetchProducts();
      } catch (error) {
        alert('Failed to delete product');
        console.error(error);
      }
    }
  };

  const calculateSeoScore = (product: any) => {
    let score = 0;
    if (product.seoTitle && product.seoTitle.trim() !== '') score += 33;
    if (product.seoDescription && product.seoDescription.trim() !== '') score += 33;
    if (product.seoKeywords && product.seoKeywords.length > 0) score += 34;
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'badge-success';
    if (score >= 50) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          + Add Product
        </Link>
      </div>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Product</th>
              <th className="p-4 font-semibold text-gray-600">Price</th>
              <th className="p-4 font-semibold text-gray-600">Stock</th>
              <th className="p-4 font-semibold text-gray-600">SEO Score</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product: any) => {
              const score = calculateSeoScore(product);
              return (
                <tr key={product._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-navy-900">{product.name}</td>
                  <td className="p-4 text-gray-600">Rs. {product.price.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={product.stock > 10 ? 'badge-success' : 'badge-danger'}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={getScoreColor(score)}>{score}/100</span>
                  </td>
                  <td className="p-4">
                    {product.isPublished ? (
                      <span className="badge-success">Published</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">Draft</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <Link href={`/products/${product.slug}`} target="_blank" className="text-blue-600 hover:underline font-medium">View</Link>
                    <Link href={`/admin/products/${product._id}/edit`} className="text-teal-600 hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
