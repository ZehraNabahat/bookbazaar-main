'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  slug?: string;
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  discountType?: string;
  value?: number;
}

interface CartContextType {
  cart: CartItem[];
  cartTotal: number;
  cartUpdatedAt: string | null;
  appliedCoupon: AppliedCoupon | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  clearAppliedCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'cart';
const CART_TIME_KEY = 'cartUpdatedAt';
const COUPON_KEY = 'appliedCoupon';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartUpdatedAt, setCartUpdatedAt] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCouponState] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_KEY);
    const storedTime = localStorage.getItem(CART_TIME_KEY);
    const storedCoupon = localStorage.getItem(COUPON_KEY);

    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        const migratedCart = parsedCart.map((item: CartItem & { _id?: string }) => ({
          ...item,
          productId: item.productId || item._id || '',
        }));
        setCart(migratedCart);
      } catch {
        setCart([]);
      }
    }
    if (storedTime) setCartUpdatedAt(storedTime);
    if (storedCoupon) {
      try {
        setAppliedCouponState(JSON.parse(storedCoupon));
      } catch {
        localStorage.removeItem(COUPON_KEY);
      }
    }
  }, []);

  const touchCart = useCallback(() => {
    const now = new Date().toISOString();
    setCartUpdatedAt(now);
    localStorage.setItem(CART_TIME_KEY, now);
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    if (cart.length > 0 && !cartUpdatedAt) {
      touchCart();
    }
    if (cart.length === 0) {
      setCartUpdatedAt(null);
      localStorage.removeItem(CART_TIME_KEY);
    }
  }, [cart, cartUpdatedAt, touchCart]);

  const addToCart = (item: CartItem) => {
    touchCart();
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, qty: i.qty + item.qty } : i
        );
      }
      return [...prev, { ...item, slug: item.slug || item.productId }];
    });
  };

  const removeFromCart = (productId: string) => {
    touchCart();
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    touchCart();
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
    setCartUpdatedAt(null);
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CART_TIME_KEY);
  };

  const setAppliedCoupon = (coupon: AppliedCoupon | null) => {
    setAppliedCouponState(coupon);
    if (coupon) {
      localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
    } else {
      localStorage.removeItem(COUPON_KEY);
    }
  };

  const clearAppliedCoupon = () => setAppliedCoupon(null);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartTotal,
        cartUpdatedAt,
        appliedCoupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setAppliedCoupon,
        clearAppliedCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
