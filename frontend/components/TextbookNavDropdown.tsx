'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TEXTBOOK_SUBCATEGORIES } from '@/lib/catalog';

export default function TextbookNavDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/category/textbooks"
        className="hover:text-teal-400 whitespace-nowrap flex items-center gap-1"
      >
        Textbooks
        <span className="text-[10px] opacity-70">▼</span>
      </Link>
      {open && (
        <div className="absolute left-0 top-full pt-1 z-50">
          <div className="bg-navy-900 border border-navy-600 rounded-md shadow-xl py-2 min-w-[180px] max-h-80 overflow-y-auto">
            {TEXTBOOK_SUBCATEGORIES.map((sub) => (
              <Link
                key={sub.slug}
                href={`/category/textbooks/${sub.slug}`}
                className="block px-4 py-1.5 text-sm hover:bg-navy-700 hover:text-teal-400 whitespace-nowrap"
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
