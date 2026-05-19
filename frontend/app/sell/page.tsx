'use client';

import { useState } from 'react';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { TEXTBOOK_SUBCATEGORIES } from '@/lib/catalog';

export default function SellBookPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Textbooks',
    subcategory: 'Grade 1',
    brand: 'Used',
    description: '',
    stock: 1,
  });

  const [imageUrl, setImageUrl] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to sell a book.");
      router.push('/login?redirect=/sell');
      return;
    }
    if (!imageUrl) {
      alert('Please wait for the image to finish uploading');
      return;
    }

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        isPublished: true, // Auto-publish for the demo
        images: [imageUrl],
        subcategory: formData.category === 'Textbooks' ? formData.subcategory : undefined,
      };
      
      const { data } = await axios.post('/api/products/sell', payload);
      alert('Your book has been listed successfully!');
      router.push(data.slug ? `/products/${data.slug}` : '/products');
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          'Failed to list book. Please make sure you are logged in.'
      );
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Log in to start selling</h2>
        <p className="text-gray-600 mb-6">You need an account to list your books on BookBazaar.</p>
        <Link href="/login?redirect=/sell" className="btn-primary">
          Log In or Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <SEOHead title="Sell a Book | BookBazaar" description="List your used textbooks and fiction books for sale." />
      
      <div className="card p-8">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Sell Your Book</h1>
        <p className="text-gray-600 mb-8">Fill out the details below to list your book on the marketplace. It will be available for other students to purchase instantly.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-navy-900 mb-1">Book Title</label>
            <input 
              required 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="input-field" 
              placeholder="e.g. Introduction to Algorithms, 3rd Edition"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-navy-900 mb-1">Selling Price (Rs.)</label>
              <input 
                type="number" 
                step="0.01" 
                required 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                className="input-field" 
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-navy-900 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="input-field">
                <option value="Textbooks">Textbooks</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Science">Science</option>
              </select>
            </div>
          </div>

          {formData.category === 'Textbooks' && (
            <div>
              <label className="block text-sm font-bold text-navy-900 mb-1">Textbook Level</label>
              <select name="subcategory" value={formData.subcategory} onChange={handleChange} className="input-field">
                {TEXTBOOK_SUBCATEGORIES.map((sub) => (
                  <option key={sub.slug} value={sub.label}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-navy-900 mb-1">Condition</label>
              <select name="brand" value={formData.brand} onChange={handleChange} className="input-field">
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Acceptable">Acceptable</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-navy-900 mb-1">Quantity</label>
              <input 
                type="number" 
                min="1"
                required 
                name="stock" 
                value={formData.stock} 
                onChange={handleChange} 
                className="input-field" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-navy-900 mb-1">Book Picture</label>
            <input 
              type="file" 
              accept="image/*"
              required
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const formData = new FormData();
                  formData.append('image', file);
                  
                  try {
                    const { data } = await axios.post('/api/upload', formData);
                    setImageUrl(data.url);
                  } catch (err: any) {
                    const message =
                      err.response?.data?.message ||
                      (err.response?.status === 401
                        ? 'Please log out and log in again, then retry the upload.'
                        : 'Image upload failed');
                    alert(message);
                  }
                }
              }} 
              className="input-field" 
            />
            {imageUrl && <img src={imageUrl} alt="Preview" className="h-32 mt-2 rounded object-cover" />}
          </div>

          <div>
            <label className="block text-sm font-bold text-navy-900 mb-1">Description & Condition Notes</label>
            <textarea 
              required 
              rows={5} 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              className="input-field" 
              placeholder="Describe any highlights, wear and tear, or included access codes..."
            />
          </div>

          <button type="submit" className="btn-primary w-full py-4 text-lg">
            List Book for Sale
          </button>
        </form>
      </div>
    </div>
  );
}
