'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useRouter } from 'next/navigation';
import { FiHeart } from 'react-icons/fi';

export default function AddToCartSection({ product }: { product: { _id: string; slug: string; name: string; price: number; stock?: number; seller?: string; images?: string[] } }) {
  const [qty, setQty] = useState(1);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const router = useRouter();
  const saved = isInWishlist(product._id);

  const handleAddToCart = () => {
    if (!user) {
      alert('You must be logged in to add items to your cart.');
      router.push('/login?redirect=/products/' + product.slug);
      return;
    }

    if (user._id === product.seller) {
      alert('You cannot buy your own product.');
      return;
    }

    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
      qty: qty,
    });
    alert('Added to cart!');
  };

  const handleWishlist = async () => {
    if (!user) {
      router.push('/login?redirect=/products/' + product.slug);
      return;
    }
    setWishlistBusy(true);
    try {
      await toggleWishlist(product._id);
    } catch {
      alert('Could not update wishlist. Please try again.');
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="w-24">
        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Qty</label>
        <select
          className="input-field py-3"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        >
          {[...Array(Math.min(10, product.stock || 5))].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleAddToCart}
        className="btn-primary flex-1 text-lg"
        disabled={product.stock === 0 || user?._id === product.seller}
      >
        {product.stock === 0
          ? 'Out of Stock'
          : user?._id === product.seller
            ? 'Your Own Product'
            : 'Add to Cart'}
      </button>
      <button
        type="button"
        onClick={handleWishlist}
        disabled={wishlistBusy}
        className={`btn-outline px-4 flex items-center justify-center transition-colors ${
          saved ? 'text-red-500 border-red-400 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:border-red-500'
        }`}
        title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      >
        <FiHeart size={22} className={saved ? 'fill-current' : ''} />
      </button>
    </div>
  );
}
