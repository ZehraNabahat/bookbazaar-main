'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';
import { useAuth } from './AuthContext';

export interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[];
  category?: string;
  brand?: string;
  stock?: number;
}

interface WishlistContextType {
  wishlist: WishlistProduct[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get<WishlistProduct[]>('/api/users/wishlist');
      setWishlist(Array.isArray(data) ? data : []);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = (productId: string) =>
    wishlist.some((p) => p._id === productId);

  const addToWishlist = async (productId: string) => {
    if (!user) throw new Error('LOGIN_REQUIRED');
    const { data } = await axios.post('/api/users/wishlist', { productId });
    setWishlist(Array.isArray(data) ? data : wishlist);
    await refreshWishlist();
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    await axios.delete(`/api/users/wishlist/${productId}`);
    setWishlist((prev) => prev.filter((p) => p._id !== productId));
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
