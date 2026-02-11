'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname(); // 取得目前路徑

  const navItems = [
    { href: '/', label: '首頁' },
    { href: '/creators', label: '找網紅' },
    { href: '/trips', label: '行程許願池' },
    { href: '/opportunities', label: '廠商案源' },
    { href: '/calculator', label: '智能合約' }, // 已更新為「智能合約」
  ];

  // 判斷連結是否為當前頁面
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo - Updated to X-Match with X-ISLANDS Style */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            {/* Custom SVG Logo mimicking the X-ISLANDS brand mark */}
            <div className="relative flex items-center justify-center w-8 h-8 group-hover:scale-105 transition-transform duration-300">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Cyan/Teal Stroke (Top-Left to Bottom-Right) */}
                <path 
                  d="M6 6L18 18" 
                  stroke="#22d3ee" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  className="group-hover:opacity-90 transition-opacity"
                />
                {/* Blue Stroke (Top-Right to Bottom-Left) */}
                <path 
                  d="M18 6L6 18" 
                  stroke="#0ea5e9" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  className="group-hover:opacity-90 transition-opacity" 
                />
              </svg>
            </div>
            {/* Brand Text */}
            <span className="font-extrabold text-2xl text-sky-500 tracking-tight font-sans">
              X-Match
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-sky-500 border-b-2 border-sky-500 pb-1'
                    : 'text-slate-600 hover:text-sky-500'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/dashboard"
              className="text-slate-600 hover:text-sky-500 font-medium text-sm"
            >
              登入
            </Link>
            <Link 
              href="/dashboard"
              className="bg-sky-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-sky-600 transition-colors shadow-lg shadow-sky-200"
            >
              商家免費註冊
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-slate-600 p-2 hover:bg-slate-100 rounded-md"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-lg absolute w-full left-0 animate-in slide-in-from-top-5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`block w-full text-left py-2 px-2 text-base font-medium rounded-md ${
                isActive(item.href)
                  ? 'bg-sky-50 text-sky-600'
                  : 'text-slate-700 hover:text-sky-500 hover:bg-sky-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 mt-2 space-y-2">
            <Link 
              href="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-center py-2 text-slate-600 hover:bg-slate-50 rounded-md"
            >
              登入
            </Link>
            <Link 
              href="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-center py-2 bg-sky-500 text-white rounded-md font-medium"
            >
              商家免費註冊
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}