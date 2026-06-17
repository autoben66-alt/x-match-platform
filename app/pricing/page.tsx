'use client';

import { useState } from 'react';
import { 
  CheckCircle2, Zap, Crown, Shield, BarChart3, Rocket, X, 
  TrendingUp, Building2, HeartHandshake, Star, Lock
} from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      
      {/* --- Hero Section --- */}
      <div className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-slate-900 z-0"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 z-0"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-sm font-black text-indigo-400 tracking-widest uppercase mb-3 flex items-center justify-center gap-2">
            <SparklesIcon /> 打造雙贏互惠生態圈
          </h2>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6">
            將閒置空房，化為<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">高轉換流量</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            把平日的空房、空桌等閒置資源，投資在優質創作者身上。不需高昂的廣告費，用體驗換取真實口碑，讓流量與業績翻倍成長。
          </p>
        </div>
      </div>

      {/* --- Value Proposition (價值主張) --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 mb-24">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-12">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center md:text-left flex flex-col items-center md:items-start">
                 <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 shadow-sm border border-indigo-100">
                    <Building2 size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">閒置資產零成本變現</h3>
                 <p className="text-slate-600 text-sm leading-relaxed">將平日賣不出去的空房或空桌，轉化為行銷籌碼。零現金支出即可換取高品質的社群圖文與影音授權素材。</p>
              </div>
              <div className="text-center md:text-left flex flex-col items-center md:items-start">
                 <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4 text-green-600 shadow-sm border border-green-100">
                    <TrendingUp size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">精準導流與真實口碑</h3>
                 <p className="text-slate-600 text-sm leading-relaxed">透過系統數據篩選，精準媒合符合您受眾輪廓的創作者。真實的體驗心得，能帶來比傳統廣告高 3 倍的轉換率。</p>
              </div>
              <div className="text-center md:text-left flex flex-col items-center md:items-start">
                 <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-600 shadow-sm border border-amber-100">
                    <HeartHandshake size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">智能合約保障雙贏</h3>
                 <p className="text-slate-600 text-sm leading-relaxed">內建標準化互惠合約與數位簽署機制，確保創作者如期交付約定內容，讓每一次合作都安心有保障。</p>
              </div>
           </div>
        </div>
      </div>
      
      {/* --- Pricing Plans --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">選擇適合您的招募方案</h2>
          
          {/* 月繳 / 年繳 切換開關 */}
          <div className="flex items-center justify-center mt-6">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>月繳方案</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="mx-4 relative inline-flex h-7 w-14 items-center rounded-full bg-indigo-600 transition-colors focus:outline-none"
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-bold flex items-center gap-1.5 ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
              年繳方案 <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest">省最多</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Free Plan */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col relative transition-transform hover:-translate-y-2">
            <div className="p-8 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 mb-2">免費體驗版 (Free)</h3>
              <p className="text-slate-500 text-sm h-10">適合剛開始嘗試網紅行銷，想先探索平台生態的店家。</p>
            </div>
            <div className="p-8 flex-grow">
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-black text-slate-900">$0</span>
                <span className="text-slate-500 font-bold ml-2">/ 永久免費</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
                  <span className="text-slate-600 text-sm">每月可發送 <strong className="text-slate-900">3 次</strong> 合作邀請</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
                  <span className="text-slate-600 text-sm">無限制查看所有公開許願池</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
                  <span className="text-slate-600 text-sm">基礎智能合約 (每月 1 份)</span>
                </li>
                <li className="flex items-start opacity-50 pt-2 border-t border-slate-100">
                  <Lock className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
                  <span className="text-slate-500 text-sm">無法觀看及邀請 S/A 級高流量網紅</span>
                </li>
                <li className="flex items-start opacity-50">
                  <Lock className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
                  <span className="text-slate-500 text-sm">無法直接查看網紅 LINE 聯繫方式</span>
                </li>
                <li className="flex items-start opacity-50">
                  <Lock className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
                  <span className="text-slate-500 text-sm">無法查看網紅深度受眾數據</span>
                </li>
              </ul>
            </div>
            <div className="p-8 pt-0 mt-auto">
              <button className="w-full py-3.5 px-4 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                免費註冊體驗
              </button>
            </div>
          </div>

          {/* Pro Monthly Plan */}
          <div className={`bg-white rounded-3xl shadow-2xl border-2 overflow-hidden flex flex-col relative transition-transform hover:-translate-y-2 ${!isAnnual ? 'border-indigo-500 scale-105 z-10' : 'border-slate-200 opacity-90 scale-95'}`}>
            {!isAnnual && (
              <div className="absolute top-0 inset-x-0 bg-indigo-500 text-white text-[10px] font-black py-1.5 text-center uppercase tracking-widest">
                彈性首選
              </div>
            )}
            <div className="p-8 border-b border-slate-100 bg-indigo-50/50 mt-4">
              <h3 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
                專業版 (Pro) <span className="text-sm font-medium text-indigo-500">(月繳)</span>
              </h3>
              <p className="text-slate-600 text-sm h-10">適合穩定經營品牌，每月都有行銷曝光需求的業者。</p>
            </div>
            <div className="p-8 flex-grow">
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-black text-slate-900">$1,200</span>
                <span className="text-slate-500 font-bold ml-2">/ 月</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500 shrink-0 mr-3" />
                  <span className="text-slate-900 font-bold text-sm">解鎖觀看及邀請 S/A 級高流量網紅</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0 mr-3" />
                  <span className="text-slate-700 font-bold text-sm">解鎖直接查看網紅 LINE ID</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0 mr-3" />
                  <span className="text-slate-700 text-sm">無限發送合作邀請</span>
                </li>
                <li className="flex items-start">
                  <BarChart3 className="h-5 w-5 text-indigo-500 shrink-0 mr-3" />
                  <span className="text-slate-700 text-sm">網紅深度受眾分析解鎖</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-indigo-500 shrink-0 mr-3" />
                  <span className="text-slate-700 text-sm">無限使用智能合約與數位簽署</span>
                </li>
              </ul>
            </div>
            <div className="p-8 pt-0 mt-auto">
              <button className={`w-full py-3.5 px-4 rounded-xl font-black transition-all shadow-lg ${!isAnnual ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                訂閱月方案
              </button>
            </div>
          </div>

          {/* Pro Annual Plan (BEST VALUE) */}
          <div className={`rounded-3xl shadow-2xl overflow-hidden flex flex-col relative transition-transform ${isAnnual ? 'scale-105 z-10 bg-slate-900 border-2 border-yellow-400' : 'bg-slate-800 border-2 border-slate-700 scale-95 opacity-90'}`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl -mr-20 -mt-20 z-0 pointer-events-none"></div>
            
            {isAnnual && (
              <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 text-[10px] font-black py-1.5 text-center uppercase tracking-widest z-10">
                Best Value • 最高 CP 值
              </div>
            )}
            
            <div className="p-8 border-b border-white/10 mt-4 relative z-10">
              <h3 className="text-xl font-bold text-yellow-400 mb-2 flex items-center gap-2">
                尊榮年約 (Pro Annual) <Crown size={20} className="fill-yellow-400"/>
              </h3>
              <p className="text-slate-300 text-sm h-10">承諾長期效益，用最划算的價格享受最高規格的權限與流量。</p>
            </div>
            
            <div className="p-8 flex-grow relative z-10">
              <div className="flex flex-col mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-black text-white">$10,000</span>
                  <span className="text-slate-400 font-bold ml-2">/ 年</span>
                </div>
                <div className="mt-2 text-sm text-green-400 font-bold">
                  (現省 $4,400，平均每月僅 $833)
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white shrink-0 mr-3" />
                  <span className="text-white font-bold text-sm">包含月訂閱所有 Pro 權限</span>
                </li>
                <li className="flex items-start">
                  <Crown className="h-5 w-5 text-yellow-400 fill-yellow-400 shrink-0 mr-3" />
                  <span className="text-white font-bold text-sm">解鎖觀看及邀請 S/A 高流量網紅</span>
                </li>
                <li className="flex items-start bg-white/10 p-2.5 rounded-xl -mx-2.5 border border-white/10">
                  <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400 shrink-0 mr-3" />
                  <div>
                    <span className="text-white font-bold text-sm block">每月免費送置頂推廣 1 次</span>
                    <span className="text-slate-400 text-xs">價值 $300/月，全年現賺 $3,600</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <Rocket className="h-5 w-5 text-sky-400 fill-sky-400 shrink-0 mr-3" />
                  <span className="text-slate-200 text-sm">案源優先曝光與尊榮標章</span>
                </li>
                <li className="flex items-start">
                  <Star className="h-5 w-5 text-yellow-400 shrink-0 mr-3" />
                  <span className="text-slate-200 text-sm">專屬 1 對 1 優先客服</span>
                </li>
              </ul>
            </div>
            
            <div className="p-8 pt-0 mt-auto relative z-10">
              <button className={`w-full py-3.5 px-4 rounded-xl font-black transition-all shadow-lg active:scale-95 ${isAnnual ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 hover:scale-105 shadow-amber-500/20' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                立即解鎖年約
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* --- Single Boost Purchases (單次付費解鎖) --- */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Rocket className="text-indigo-600 h-8 w-8" />
          <h2 className="text-2xl font-bold text-slate-900">單次付費推廣與解鎖 (免綁約)</h2>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            
            {/* Option A: 置頂推廣 */}
            <div className="p-8 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-100 text-amber-600 p-3 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <Zap size={24} fill="currentColor" />
                </div>
                <span className="text-xl font-black text-slate-900">$300 <span className="text-sm font-bold text-slate-400">/ 次</span></span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">案源置頂推廣 (Featured)</h3>
              <p className="text-slate-500 text-sm mb-6 flex-grow">
                讓您的徵才需求在「廠商案源」列表強制置頂 3 天，獲得 5 倍以上的創作者曝光與應徵數量。
              </p>
              <button className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-md mt-auto">
                購買置頂點數
              </button>
            </div>

            {/* Option B: 單次解鎖 S/A 級網紅 */}
            <div className="p-8 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <Lock size={24} />
                </div>
                <span className="text-xl font-black text-slate-900">$150 <span className="text-sm font-bold text-slate-400">/ 張</span></span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">單次高流量網紅解鎖券</h3>
              <p className="text-slate-500 text-sm mb-6 flex-grow">
                不需綁定月費，單次解鎖查看並邀請 1 位 S 級或 A 級的高流量創作者。獲得他們的完整聯絡方式。
              </p>
              <button className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 mt-auto flex items-center justify-center gap-2">
                <Crown size={16} /> 購買單次解鎖券
              </button>
            </div>

          </div>
        </div>
      </div>
      
    </div>
  );
}

// Sparkles Icon Helper
function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}