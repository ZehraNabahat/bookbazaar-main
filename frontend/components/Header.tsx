'use client';

import Link from "next/link";
import { FiShoppingCart, FiHeart, FiUser, FiLogOut } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import TextbookNavDropdown from "@/components/TextbookNavDropdown";

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  
  const cartItemCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const wishlistCount = wishlist.length;

  return (
    <header className="bg-navy-900 text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Book<span className="text-teal-400">Bazaar</span>
        </Link>
        
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full px-4 py-2 rounded-l-md text-gray-900 focus:outline-none"
          />
          <button className="bg-teal-500 text-navy-900 px-4 rounded-r-md font-bold hover:bg-teal-400">
            Search
          </button>
        </div>

        <nav className="flex space-x-6 items-center">
          <Link href="/wishlist" className="hover:text-teal-400 transition-colors relative" title="Wishlist">
            <FiHeart size={22} />
            {user && wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-teal-500 text-navy-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="hover:text-teal-400 transition-colors relative">
            <FiShoppingCart size={22} />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-teal-500 text-navy-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link href={user.role === 'admin' ? '/admin' : '/profile'} className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                <FiUser size={22} />
                <span className="hidden sm:inline font-medium">{user.name}</span>
              </Link>
              <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors" title="Logout">
                <FiLogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 font-medium text-sm">
              <Link href="/login" className="hover:text-teal-400 transition-colors">Log In</Link>
              <Link href="/register" className="bg-teal-500 text-navy-900 px-4 py-2 rounded hover:bg-teal-400 transition-colors">Sign Up</Link>
            </div>
          )}
        </nav>
      </div>
      {/* Category Nav */}
      <div className="bg-navy-800 border-t border-navy-700">
        <div className="container mx-auto px-4 py-2 flex space-x-6 text-sm font-medium items-center">
          <TextbookNavDropdown />
          <Link href="/category/fiction" className="hover:text-teal-400 whitespace-nowrap">Fiction</Link>
          <Link href="/category/non-fiction" className="hover:text-teal-400 whitespace-nowrap">Non-Fiction</Link>
          <Link href="/category/science" className="hover:text-teal-400 whitespace-nowrap">Science</Link>
          <div className="flex-1"></div>
          <Link href="/sell" className="text-teal-400 hover:text-teal-300 font-bold whitespace-nowrap flex items-center gap-1">
            + Sell Your Book
          </Link>
        </div>
      </div>
    </header>
  );
}
