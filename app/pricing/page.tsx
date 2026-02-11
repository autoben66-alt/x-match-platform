'use client';

import { useState } from 'react';
import { CheckCircle2, Zap, Crown, Shield, BarChart3, Rocket, X } from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* Header */}
      <div className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-base font-semibold text-indigo-400 tracking-wide uppercase mb-2">商家專屬方案</h2>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-6">
            選擇最適合您的成長方案
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            無論您是小型民宿還是連鎖飯店，X-Match 都能協助您精準媒合網紅，將空房轉化為最大聲量。
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        
        {/* 1. 訂閱制 (SaaS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col relative">
            <div className="p-8 flex-grow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">免費體驗版 (Free)</h3>
              <p className="text-slate-500 text-sm mb-6">適合剛開始嘗試網紅行銷的小型店家。</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-slate-500 ml-2">/ 月</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                  <span className="text-slate-600 text-sm">每月可發送 <strong className="text-slate-900">3 次</strong> 合作邀請</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                  <span className="text-slate-600 text-sm">查看所有公開行程許願池</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                  <span className="text-slate-600 text-sm">基礎智能合約 (每月 1 份)</span>
                </li>
                <li className="flex items-start opacity-50">
                  <X className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
                  <span className="text-slate-400 text-sm">無法查看網紅深度數據</span>
                </li>
              </ul>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 mt-auto">
              <button className="w-full py-3 px-4 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white transition-colors">
                免費開始使用
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-500 overflow-hidden flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Most Popular
            </div>
            <div className="p-8 flex-grow">
              <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                專業成長版 (Pro) <Crown size={20} className="text-yellow-500 fill-yellow-500"/>
              </h3>
              <p className="text-slate-500 text-sm mb-6">解鎖無限潛力，適合積極經營品牌的業者。</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-slate-900">$999</span>
                <span className="text-slate-500 ml-2">/ 月</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0 mr-3" />
                  <span className="text-slate-700 font-bold text-sm">無限發送</span>
                  <span className="text-slate-600 text-sm ml-1">合作邀請</span>
                </li>
                <li className="flex items-start">
                  <BarChart3 className="h-5 w-5 text-indigo-500 shrink-0 mr-3" />
                  <span className="text-slate-700 font-bold text-sm">網紅深度數據解鎖</span>
                  <span className="text-slate-600 text-sm ml-1">(真實互動率、受眾分析)</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-indigo-500 shrink-0 mr-3" />
                  <span className="text-slate-700 font-bold text-sm">無限使用</span>
                  <span className="text-slate-600 text-sm ml-1">智能合約與數位簽署</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0 mr-3" />
                  <span className="text-slate-600 text-sm">優先客服支援</span>
                </li>
                <li className="flex items-start bg-indigo-50 p-2 rounded-lg -mx-2">
                  <Zap className="h-5 w-5 text-amber-500 shrink-0 mr-3 fill-amber-500" />
                  <div>
                    <span className="text-slate-900 font-bold text-sm block">贈送每月置頂推廣</span>
                    <span className="text-slate-500 text-xs">(Featured Ad) 價值 $300</span>
                  </div>
                </li>
                <li className="flex items-start bg-indigo-50 p-2 rounded-lg -mx-2 mt-2">
                  <Rocket className="h-5 w-5 text-sky-500 shrink-0 mr-3 fill-sky-500" />
                  <div>
                    <span className="text-slate-900 font-bold text-sm block">贈送精準推播</span>
                    <span className="text-slate-500 text-xs">(Smart Push) 每月 1 次</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="p-8 bg-indigo-50 border-t border-indigo-100 mt-auto">
              <button className="w-full py-3 px-4 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                立即升級 Pro
              </button>
              <p className="text-center text-xs text-indigo-400 mt-3">
                7 天免費試用，隨時可取消
              </p>
            </div>
          </div>
        </div>

        {/* 2. 急單加速器 (Boost) */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Rocket className="text-indigo-600 h-8 w-8" />
            <h2 className="text-2xl font-bold text-slate-900">單次付費推廣 (Boost)</h2>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl shadow-xl overflow-hidden text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
              
              {/* Option A: 置頂推廣 */}
              <div className="p-8 hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-amber-500/20 text-amber-300 p-3 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <span className="text-xl font-bold">$300 <span className="text-sm font-normal text-slate-400">/ 次</span></span>
                </div>
                <h3 className="text-xl font-bold mb-2">置頂推廣 (Featured)</h3>
                <p className="text-slate-400 text-sm mb-6">
                  讓您的徵才需求在「廠商案源」列表置頂 3 天，獲得 5 倍以上的曝光量。
                </p>
                <button className="w-full py-2 border border-white/20 rounded-lg text-sm font-bold hover:bg-white hover:text-slate-900 transition-colors">
                  購買置頂
                </button>
              </div>

              {/* Option B: 主動推播 */}
              <div className="p-8 hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-sky-500/20 text-sky-300 p-3 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                    <Rocket size={24} fill="currentColor" />
                  </div>
                  <span className="text-xl font-bold">$100 <span className="text-sm font-normal text-slate-400">/ 次</span></span>
                </div>
                <h3 className="text-xl font-bold mb-2">精準推播 (Smart Push)</h3>
                <p className="text-slate-400 text-sm mb-6">
                  系統自動篩選附近 10 位「正在許願」且「符合條件」的網紅，將您的空房需求直接推送到他們的手機。
                </p>
                <button className="w-full py-2 border border-white/20 rounded-lg text-sm font-bold hover:bg-white hover:text-slate-900 transition-colors">
                  發送推播
                </button>
              </div>

            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              * 所有價格均為新台幣 (TWD) 並含稅。若有大量採購需求請聯繫我們。
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}