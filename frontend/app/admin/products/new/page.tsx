'use client';

import { useState } from 'react';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TEXTBOOK_SUBCATEGORIES } from '@/lib/catalog';

export default function NewProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    compareAtPrice: 0,
    category: 'Textbooks',
    subcategory: 'Grade 1',
    brand: '',
    description: '',
    stock: 0,
    isPublished: false,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    metaRobots: 'index,follow',
    images: [] as string[],
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGenerateSEO = async () => {
    if (!formData.name || !formData.description) {
      alert("Please fill in the product name and description first.");
      return;
    }
    
    setLoadingAI(true);
    try {
      const { data } = await axios.post('/api/ai/admin/ai/generate-seo', {
        name: formData.name,
        description: formData.description
      });
      
      setFormData(prev => ({
        ...prev,
        seoTitle: data.seoTitle || prev.seoTitle,
        seoDescription: data.seoDescription || prev.seoDescription,
        seoKeywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : prev.seoKeywords,
        isPublished: false
      }));
      setAiGenerated(true);
    } catch (error) {
      alert('AI Generation failed. Check console.');
      console.error(error);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataObj = new FormData();
    formDataObj.append('image', file);

    try {
      const { data } = await axios.post('/api/upload', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, data.url]
      }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  
  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        subcategory: formData.category === 'Textbooks' ? formData.subcategory : undefined,
        seoKeywords: typeof formData.seoKeywords === 'string' ? formData.seoKeywords.split(',').map(k => k.trim()).filter(k => k) : formData.seoKeywords
      };
      await axios.post('/api/products', payload);
      router.push('/admin/products');
    } catch (error: any) {
      console.error(error);
      alert('Failed to save product: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Add New Product</h1>

      <div className="flex space-x-1 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('basic')} 
          className={`py-3 px-6 font-semibold border-b-2 ${activeTab === 'basic' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Basic Info
        </button>
        <button 
          onClick={() => setActiveTab('seo')} 
          className={`py-3 px-6 font-semibold border-b-2 ${activeTab === 'seo' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          SEO
        </button>
        <button 
          onClick={() => setActiveTab('preview')} 
          className={`py-3 px-6 font-semibold border-b-2 ${activeTab === 'preview' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          type="button"
        >
          SERP Preview
        </button>
        <button 
          onClick={() => setActiveTab('images')} 
          className={`py-3 px-6 font-semibold border-b-2 ${activeTab === 'images' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          type="button"
        >
          Images
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* TAB: BASIC */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input required name="brand" value={formData.brand} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select required name="category" value={formData.category} onChange={handleChange} className="input-field">
                  <option value="" disabled>Select category</option>
                  <option value="Textbooks">Textbooks</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Science">Science</option>
                </select>
              </div>
              {formData.category === 'Textbooks' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategory</label>
                  <select name="subcategory" value={formData.subcategory} onChange={handleChange} className="input-field">
                    {TEXTBOOK_SUBCATEGORIES.map((sub) => (
                      <option key={sub.slug} value={sub.label}>{sub.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input type="number" required name="stock" value={formData.stock} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (Rs.)</label>
                <input type="number" step="0.01" required name="price" value={formData.price} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Compare At Price (Rs.)</label>
                <input type="number" step="0.01" name="compareAtPrice" value={formData.compareAtPrice} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea required rows={6} name="description" value={formData.description} onChange={handleChange} className="input-field" />
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} id="pub" />
              <label htmlFor="pub" className="font-medium text-navy-900">Publish immediately</label>
            </div>
          </div>
        )}

        {/* TAB: SEO */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="bg-teal-50 p-6 rounded-lg border border-teal-100 flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-teal-800 mb-1">AI SEO Assistant</h3>
                <p className="text-teal-700 text-sm">Generate optimized titles, descriptions, and keywords based on the basic info.</p>
              </div>
              <button 
                type="button" 
                onClick={handleGenerateSEO} 
                disabled={loadingAI}
                className="btn-secondary whitespace-nowrap"
              >
                {loadingAI ? 'Generating...' : 'Generate with Gemini AI'}
              </button>
            </div>

            {aiGenerated && (
              <div className="bg-amber-50 text-amber-800 p-3 rounded border border-amber-200 text-sm font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                AI Generated - Pending Review
              </div>
            )}

            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium">SEO Title</label>
                <span className={`text-xs ${formData.seoTitle.length > 60 ? 'text-red-500' : 'text-gray-500'}`}>
                  {formData.seoTitle.length} / 60
                </span>
              </div>
              <input name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium">SEO Description</label>
                <span className={`text-xs ${formData.seoDescription.length > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                  {formData.seoDescription.length} / 160
                </span>
              </div>
              <textarea rows={3} name="seoDescription" value={formData.seoDescription} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Keywords (comma separated)</label>
              <input name="seoKeywords" value={formData.seoKeywords} onChange={handleChange} placeholder="e.g. textbook, mathematics, grade 5" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Meta Robots</label>
              <select name="metaRobots" value={formData.metaRobots} onChange={handleChange} className="input-field">
                <option value="index,follow">index, follow (Default)</option>
                <option value="noindex,nofollow">noindex, nofollow</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB: IMAGES */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Upload Product Image</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                disabled={uploading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-50 file:text-teal-700
                  hover:file:bg-teal-100"
              />
              {uploading && <p className="text-sm mt-2 text-teal-600">Uploading...</p>}
            </div>

            {formData.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Uploaded Images</h3>
                <div className="flex flex-wrap gap-4">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative w-32 h-32 border rounded-md overflow-hidden bg-gray-50">
                      <img src={url} alt={`Product ${index + 1}`} className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 focus:outline-none"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PREVIEW */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold mb-4">Google Search Preview</h2>
            <div className="max-w-2xl bg-white p-6 rounded-lg border border-gray-200 shadow-sm font-sans">
              <div className="text-sm text-[#202124] mb-1 flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs">🌐</div>
                <div>
                  <span className="block">BookBazaar</span>
                  <span className="text-[#4d5156] text-xs">https://example.com/products/view</span>
                </div>
              </div>
              <div className="text-[#1a0dab] text-xl font-medium hover:underline cursor-pointer mb-1">
                {formData.seoTitle || formData.name || 'Your SEO Title Here'}
              </div>
              <div className="text-[#4d5156] text-sm leading-snug">
                {formData.seoDescription || formData.description.substring(0, 160) || 'Your SEO meta description will appear here. Keep it compelling and under 160 characters.'}
                {(formData.seoDescription.length > 160 || (!formData.seoDescription && formData.description.length > 160)) && '...'}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
          <Link href="/admin/products" className="btn-outline">Cancel</Link>
          <button type="submit" className="btn-primary">Save Product</button>
        </div>
      </form>
    </div>
  );
}
