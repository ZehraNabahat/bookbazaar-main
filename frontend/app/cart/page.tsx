'use client';

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import SEOHead from "@/components/SEOHead";
import { FiTrash2 } from "react-icons/fi";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <>
      <SEOHead 
        title="Your Cart | BookBazaar" 
        description="Review your shopping cart before checkout."
        metaRobots="noindex,nofollow"
      />
      
      <h1 className="text-3xl font-bold text-navy-900 mb-8">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 mb-6 text-lg">Your cart is currently empty.</p>
          <Link href="/products" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm uppercase">
                  <th className="pb-4 font-semibold">Product</th>
                  <th className="pb-4 font-semibold">Price</th>
                  <th className="pb-4 font-semibold text-center">Quantity</th>
                  <th className="pb-4 font-semibold text-right">Total</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.productId} className="border-b border-gray-100 last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 relative bg-gray-100 rounded overflow-hidden">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                        <Link href={`/products/${item.productId}`} className="font-semibold text-navy-900 hover:text-teal-600">
                          {item.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-4 text-gray-600">Rs. {item.price.toFixed(2)}</td>
                    <td className="py-4">
                      <div className="flex justify-center">
                        <select 
                          className="input-field py-1 px-2 text-sm w-16 text-center"
                          value={item.qty}
                          onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="py-4 text-right font-bold text-navy-900">
                      Rs. {(item.price * item.qty).toFixed(2)}
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
              <h2 className="text-xl font-bold text-navy-900 mb-6">Order Summary</h2>
              
              <div className="flex justify-between mb-4 text-gray-600">
                <span>Subtotal</span>
                <span>Rs. {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4 text-gray-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              
              <hr className="my-4 border-gray-200" />
              
              <div className="flex justify-between mb-8 font-bold text-xl text-navy-900">
                <span>Total</span>
                <span>Rs. {cartTotal.toFixed(2)}</span>
              </div>

              <Link href="/checkout" className="btn-primary w-full block text-center py-3 text-lg">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
