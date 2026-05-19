'use client';

import Link from 'next/link';
import Image from 'next/image';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { FiHeart, FiTrash2, FiShoppingCart } from 'react-icons/fi';

export default function WishlistPage() {
  const { user } = useAuth();
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item: (typeof wishlist)[0]) => {
    addToCart({
      productId: item._id,
      name: item.name,
      price: item.price,
      image: item.images?.[0] || '',
      qty: 1,
    });
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <SEOHead title="Wishlist | BookBazaar" description="Sign in to view your saved books." metaRobots="noindex,nofollow" />
        <FiHeart className="mx-auto text-teal-500 mb-4" size={40} />
        <h1 className="text-2xl font-bold text-navy-900 mb-4">Your wishlist</h1>
        <p className="text-gray-600 mb-6">Sign in to save books you love and view them here.</p>
        <Link href="/login?redirect=/wishlist" className="btn-primary">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="My Wishlist | BookBazaar"
        description="Books you saved on BookBazaar."
        metaRobots="noindex,nofollow"
      />

      <h1 className="text-3xl font-bold text-navy-900 mb-2">My Wishlist</h1>
      <p className="text-gray-600 mb-8">
        {wishlist.length} saved {wishlist.length === 1 ? 'book' : 'books'}
      </p>

      {loading ? (
        <p className="text-gray-500">Loading your wishlist...</p>
      ) : wishlist.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <FiHeart className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 mb-6 text-lg">You have not saved any books yet.</p>
          <Link href="/products" className="btn-primary">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div
              key={item._id}
              className="card flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/products/${item.slug}`} className="relative h-48 bg-gray-100 block">
                <Image
                  src={
                    item.images?.[0] ||
                    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
                  }
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </Link>
              <div className="p-4 flex flex-col flex-grow">
                <p className="text-xs text-gray-500 mb-1">
                  {item.category}
                  {item.brand ? ` · ${item.brand}` : ''}
                </p>
                <Link href={`/products/${item.slug}`}>
                  <h2 className="font-bold text-navy-900 line-clamp-2 hover:text-teal-600 mb-2">
                    {item.name}
                  </h2>
                </Link>
                <p className="text-lg font-bold text-navy-900 mb-4">Rs. {item.price?.toFixed(2)}</p>
                <div className="mt-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    disabled={item.stock === 0}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2 disabled:opacity-50"
                  >
                    <FiShoppingCart size={16} />
                    {item.stock === 0 ? 'Out of stock' : 'Add to cart'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item._id)}
                    className="btn-outline px-3 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400"
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
