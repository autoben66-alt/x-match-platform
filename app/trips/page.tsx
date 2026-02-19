'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Camera, Heart, Search, Filter, Users, Flame, Zap, Bed, Utensils, Ticket, Clock, 
  ArrowRight, X, CheckCircle, Send, Loader2, Instagram, Youtube, Globe, FileText, ChevronLeft, BarChart3, User, CheckCircle2, Lock, Crown, AlertCircle
} from 'lucide-react';

// --- 自定義 Link 元件 (解決預覽環境問題) ---
const Link = ({ href, children, className, ...props }: any) => {
  return (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
};

// --- Firebase 核心引入 ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

// --- Firebase 初始化 ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

let app: any = null;
let db: any = null;

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase 初始化失敗:", error);
  }
}

const internalAppId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'x-match-a83f0';

// --- 資料結構 ---
interface Trip {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  creatorHandle?: string;
  creatorBio?: string;
  creatorStats?: { followers: string; engagement: string; verified?: boolean };
  creatorPortfolio?: string[];
  destination: string;
  dates: string;
  daysLeft?: number; 
  category: '住宿' | '餐飲' | '體驗' | '交通' | string; 
  partySize: string; 
  offers: number; 
  purpose: string;
  needs: string;
  status: 'Open' | 'Matched' | 'Completed' | string;
  tags: string[];
}

// 模擬行程資料
const FALLBACK_TRIPS: Trip[] = [
  {
    id: '1',
    creatorName: "Jason 攝影",
    creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jason",
    creatorHandle: "@jason_visuals",
    creatorBio: "專業戶外攝影師，擅長捕捉自然光影與人像情感。曾與國家地理雜誌合作，Instagram 風格偏向冷色調電影感。",
    creatorStats: { followers: "125k", engagement: "4.8%", verified: true },
    creatorPortfolio: [
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    ],
    destination: "蘭嶼",
    dates: "2024/06/10 - 06/14",
    daysLeft: 3,
    category: "住宿",
    partySize: "1人 (攝影師)",
    offers: 12,
    purpose: "拍攝星空銀河與飛魚季紀錄片，預計產出 YouTube 4K 影片。",
    needs: "尋找特色民宿，需有頂樓或陽台可拍星空，希望含機車租借。",
    status: "Open",
    tags: ["攝影", "自然", "離島"]
  },
  {
    id: '2',
    creatorName: "食尚艾莉",
    creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elly",
    creatorHandle: "@elly_foodie",
    creatorBio: "台南在地美食部落客，喜歡挖掘巷弄裡的老宅咖啡與隱藏版甜點。照片風格明亮清新，粉絲多為年輕女性。",
    creatorStats: { followers: "45k", engagement: "5.2%", verified: false },
    creatorPortfolio: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    ],
    destination: "台南中西區",
    dates: "2024/06/05 - 06/07",
    daysLeft: 1, 
    category: "餐飲",
    partySize: "2人",
    offers: 8,
    purpose: "巷弄老宅咖啡廳與甜點店巡禮，發布 IG Reels。",
    needs: "尋找復古風格的咖啡廳或冰店，需有自然光座位。",
    status: "Open",
    tags: ["美食", "老宅", "文青"]
  },
  {
    id: '3',
    creatorName: "Outdoor 阿宏",
    creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    creatorHandle: "@outdoor_hong",
    creatorBio: "熱愛露營與野營的工程師，致力於推廣「無痕山林」理念。影片風格幽默風趣，裝備開箱影片深受新手喜愛。",
    creatorStats: { followers: "88k", engagement: "3.5%", verified: true },
    creatorPortfolio: [
      "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    ],
    destination: "苗栗南庄",
    dates: "2024/07/01 - 07/03",
    daysLeft: 20,
    category: "體驗",
    partySize: "4人 (露營團)",
    offers: 5,
    purpose: "夏季露營裝備評測影片，推廣戶外生活風格。",
    needs: "露營區營位 x2，需有插座與乾淨衛浴。",
    status: "Open",
    tags: ["露營", "戶外"]
  }
];

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  
  // 視窗狀態
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null); 
  const [inviteStep, setInviteStep] = useState<'profile' | 'form'>('profile'); 
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');

  // --- 業者會員狀態 (Provider State) ---
  const [providerPlan, setProviderPlan] = useState<'guest' | 'free' | 'pro'>('guest');
  const [usageCount, setUsageCount] = useState(0); // 已使用次數
  const FREE_LIMIT = 3; // 免費版限制次數

  const [showAuthModal, setShowAuthModal] = useState(false); // 登入/註冊視窗
  const [showUpgradeModal, setShowUpgradeModal] = useState(false); // 升級提示視窗

  // Firebase 資料狀態
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 監聽 Firestore
  useEffect(() => {
    if (!db) {
      setTrips(FALLBACK_TRIPS);
      setIsLoading(false);
      return;
    }

    const tripsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'trips');
    const unsubscribe = onSnapshot(tripsCol, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => {
          const rawData = doc.data() as Trip;
          const fallbackSource = FALLBACK_TRIPS.find(t => t.creatorName === rawData.creatorName) || FALLBACK_TRIPS[0];
          
          return {
            ...rawData,
            creatorAvatar: rawData.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawData.creatorName}`,
            daysLeft: rawData.daysLeft !== undefined ? rawData.daysLeft : Math.floor(Math.random() * 14) + 1,
            tags: rawData.tags || ["熱門許願", "求合作"],
            category: rawData.category || "住宿",
            status: rawData.status || "Open",
            creatorHandle: rawData.creatorHandle || fallbackSource.creatorHandle,
            creatorBio: rawData.creatorBio || fallbackSource.creatorBio,
            creatorStats: rawData.creatorStats || fallbackSource.creatorStats,
            creatorPortfolio: rawData.creatorPortfolio || fallbackSource.creatorPortfolio
          };
        });
        setTrips(data.sort((a, b) => b.id.localeCompare(a.id)));
      } else {
        setTrips([]);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("讀取行程失敗:", err);
      setTrips(FALLBACK_TRIPS);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 分類選項
  const categories = [
    { id: '全部', label: '全部', icon: Filter },
    { id: '住宿', label: '求住宿', icon: Bed },
    { id: '餐飲', label: '求美食', icon: Utensils },
    { id: '體驗', label: '求體驗', icon: Ticket },
  ];

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.destination.includes(searchTerm) || trip.tags.some(tag => tag.includes(searchTerm));
    const matchesCategory = categoryFilter === '全部' || trip.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // 開啟視窗 (查看履歷)
  const handleOpenInvite = (trip: Trip) => {
    setSelectedTrip(trip);
    setInviteStep('profile'); 
    setMessage(`哈囉 ${trip.creatorName}！\n\n我們是[您的店家名稱]，看到您預計前往${trip.destination}，誠摯邀請您來體驗我們的服務！\n\n我們可以提供：\n1. 免費體驗...\n2. 特別招待...\n\n期待您的回覆！`);
    setIsSuccess(false);
  };

  // 處理「前往邀請」點擊 (權限檢查核心邏輯)
  const handleGoToInvite = () => {
    // 1. 檢查是否登入
    if (providerPlan === 'guest') {
      setShowAuthModal(true);
      return;
    }

    // 2. 檢查額度 (僅針對免費版)
    if (providerPlan === 'free' && usageCount >= FREE_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }

    // 3. 通過檢查，進入填寫表單
    setInviteStep('form');
  };

  // 模擬登入
  const handleLogin = (plan: 'free' | 'pro') => {
    setProviderPlan(plan);
    setShowAuthModal(false);
    // 登入後若原本是要去邀請，檢查額度後自動跳轉
    if (plan === 'free' && usageCount >= FREE_LIMIT) {
        setShowUpgradeModal(true);
    } else {
        setInviteStep('form');
    }
  };

  // 確認發送
  const confirmInvite = () => {
    // 若為免費版，扣除額度
    if (providerPlan === 'free') {
        setUsageCount(prev => prev + 1);
    }

    setTimeout(() => {
      setIsSuccess(true);
      setTimeout(() => {
        setSelectedTrip(null);
        setIsSuccess(false);
      }, 2000);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            行程許願池 (Reverse Bidding)
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync
            </span>
          </h1>
          <p className="text-slate-600">
            網紅公佈行程，在地商家主動提供體驗機會。發現誰正要來你的城市？
          </p>
        </div>
        
        {/* Provider Status Display (Demo Only) */}
        {providerPlan !== 'guest' && (
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">目前方案</span>
                    <span className={`font-bold text-sm flex items-center gap-1 ${providerPlan === 'pro' ? 'text-amber-500' : 'text-slate-700'}`}>
                        {providerPlan === 'pro' ? <><Crown size={14} fill="currentColor"/> 專業版 Pro</> : '免費版 Starter'}
                    </span>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">剩餘額度</span>
                    <span className="font-bold text-sm text-slate-900">
                        {providerPlan === 'pro' ? '無限' : `${Math.max(0, FREE_LIMIT - usageCount)} / ${FREE_LIMIT}`}
                    </span>
                </div>
            </div>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between sticky top-20 z-40">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <cat.icon size={16} />
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="搜尋目的地 (例如：蘭嶼)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
          <p className="font-medium tracking-widest uppercase text-xs">正在從資料庫同步行程...</p>
        </div>
      ) : (
        /* Trips List */
        <div className="grid grid-cols-1 gap-6">
          {filteredTrips.map(trip => (
            <div key={trip.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group relative overflow-hidden">
              
              {trip.daysLeft !== undefined && trip.daysLeft <= 3 && (trip.status === 'Open' || trip.status === '招募中') && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/10 to-transparent -mr-10 -mt-10 rounded-bl-full pointer-events-none"></div>
              )}

              {/* Left: Creator Info */}
              <div className="flex-shrink-0 flex flex-col items-center min-w-[120px] md:border-r md:border-slate-100 md:pr-6">
                <div className="relative cursor-pointer" onClick={() => handleOpenInvite(trip)}>
                  <img 
                    src={trip.creatorAvatar} 
                    className="w-16 h-16 rounded-full mb-3 border-2 border-white shadow-sm hover:scale-105 transition-transform" 
                    alt={trip.creatorName} 
                  />
                  <div className="absolute -bottom-1 -right-2">
                     {trip.status === 'Matched' ? (
                       <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold border-2 border-white">已媒合</span>
                     ) : (
                       <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold border-2 border-white">招募中</span>
                     )}
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-900 mb-1">{trip.creatorName}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full mt-1 border border-slate-100">
                  <Users size={12} />
                  {trip.partySize}
                </div>
              </div>
              
              {/* Middle: Trip Details */}
              <div className="flex-grow space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                      trip.category === '住宿' ? 'bg-blue-100 text-blue-700' :
                      trip.category === '餐飲' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {trip.category === '住宿' && <Bed size={14} />}
                      {trip.category === '餐飲' && <Utensils size={14} />}
                      {trip.category === '體驗' && <Ticket size={14} />}
                      {trip.category}
                    </span>
                    
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      {trip.destination}
                    </h3>
                  </div>

                  {trip.daysLeft !== undefined && trip.daysLeft <= 3 && (trip.status === 'Open' || trip.status === '招募中') && (
                    <div className="flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      <Flame size={14} fill="currentColor" />
                      僅剩 {trip.daysLeft} 天出發
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <Calendar size={16} className="text-indigo-500" />
                  <span className="font-medium">{trip.dates}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="mt-0.5 bg-white text-blue-600 p-1.5 rounded-full shadow-sm border border-slate-100">
                      <Camera size={14} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">行程目的</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{trip.purpose}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="mt-0.5 bg-white text-pink-600 p-1.5 rounded-full shadow-sm border border-slate-100">
                      <Heart size={14} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">許願需求</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{trip.needs}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Action */}
              <div className="flex-shrink-0 flex flex-col justify-between md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0 min-w-[160px]">
                 <div className="mb-4">
                   <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                     <Zap size={16} className={trip.offers > 0 ? "text-amber-500 fill-amber-500" : "text-slate-300"} />
                     <span className="text-xs font-medium">競爭熱度</span>
                   </div>
                   <p className="text-sm font-bold text-slate-900">
                     已有 <span className="text-indigo-600 text-lg">{trip.offers}</span> 間報價
                   </p>
                 </div>

                 <button 
                   onClick={() => handleOpenInvite(trip)}
                   disabled={trip.status === 'Matched'}
                   className={`w-full md:w-auto px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                     trip.status !== 'Matched'
                       ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
                       : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                   }`}
                 >
                   {trip.status !== 'Matched' ? (
                     <>提供邀請 <ArrowRight size={16} /></>
                   ) : (
                     '已結束媒合'
                   )}
                 </button>
              </div>
            </div>
          ))}

          {filteredTrips.length === 0 && (
              <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">找不到符合條件的行程或正在同步中</p>
                  <button onClick={() => {setSearchTerm(''); setCategoryFilter('全部');}} className="mt-2 text-sm text-indigo-600 font-bold hover:underline">清除篩選條件</button>
              </div>
          )}
        </div>
      )}

      {/* --- Unified Modal: Profile Preview & Invitation --- */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header: Always show Creator basic info */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                 <img src={selectedTrip.creatorAvatar} className="w-10 h-10 rounded-full border border-white shadow-sm" alt="Avatar"/>
                 <div>
                    <h3 className="font-bold text-slate-900">{selectedTrip.creatorName}</h3>
                    <p className="text-xs text-slate-500">{selectedTrip.creatorHandle}</p>
                 </div>
               </div>
               <button onClick={() => setSelectedTrip(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
               </button>
            </div>

            {/* Modal Body: Switchable Content */}
            <div className="flex-grow overflow-y-auto">
              
              {isSuccess ? (
                /* Success View */
                <div className="p-12 text-center h-full flex flex-col justify-center items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in spin-in-180 duration-500">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">邀請已發送！</h3>
                  <p className="text-slate-500 text-sm">
                    {selectedTrip.creatorName} 將會收到您的邀請通知，<br/>祝您媒合成功！
                  </p>
                </div>
              ) : inviteStep === 'profile' ? (
                /* Step 1: Creator Profile & Trip Details (履歷預覽) */
                <div className="p-6 space-y-8">
                   
                   {/* Creator Stats Row */}
                   <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <p className="text-xs text-slate-400 mb-1">粉絲人數</p>
                         <p className="font-bold text-slate-900 text-lg">{selectedTrip.creatorStats?.followers}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <p className="text-xs text-slate-400 mb-1">互動率</p>
                         <p className="font-bold text-green-600 text-lg">{selectedTrip.creatorStats?.engagement}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                         <p className="text-xs text-slate-400 mb-1">官方認證</p>
                         {selectedTrip.creatorStats?.verified ? (
                           <CheckCircle2 size={24} className="text-blue-500 fill-blue-50" />
                         ) : <span className="text-slate-300">-</span>}
                      </div>
                   </div>

                   {/* Bio */}
                   <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <User size={16} className="text-indigo-500" /> 關於我 (Bio)
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-100 p-3 rounded-lg">
                        {selectedTrip.creatorBio || "這位創作者很害羞，暫時沒有自我介紹。"}
                      </p>
                      {/* Social Links */}
                      <div className="flex gap-3 mt-3">
                        <button className="p-2 bg-slate-50 rounded-full text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"><Instagram size={18}/></button>
                        <button className="p-2 bg-slate-50 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Youtube size={18}/></button>
                        <button className="p-2 bg-slate-50 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Globe size={18}/></button>
                      </div>
                   </div>

                   {/* Portfolio */}
                   <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Camera size={16} className="text-indigo-500" /> 近期作品 (Portfolio)
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                         {selectedTrip.creatorPortfolio?.map((img, i) => (
                           <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                             <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt="Portfolio" />
                           </div>
                         ))}
                      </div>
                   </div>
                   
                   {/* Trip Summary (Context) */}
                   <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                      <div className="flex justify-between items-start mb-2">
                         <h4 className="font-bold text-indigo-900 text-sm">本次許願行程</h4>
                         <span className="text-xs bg-white text-indigo-600 px-2 py-0.5 rounded font-bold">{selectedTrip.category}</span>
                      </div>
                      <p className="text-sm text-indigo-800 mb-1"><span className="font-bold">目的地：</span>{selectedTrip.destination} ({selectedTrip.dates})</p>
                      <p className="text-sm text-indigo-800"><span className="font-bold">需求：</span>{selectedTrip.needs}</p>
                   </div>
                </div>
              ) : (
                /* Step 2: Invitation Form (撰寫邀請) */
                <div className="p-6 h-full flex flex-col">
                  <button 
                    onClick={() => setInviteStep('profile')}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 self-start"
                  >
                    <ChevronLeft size={16} /> 返回履歷
                  </button>

                  <h3 className="text-xl font-bold text-slate-900 mb-6">撰寫合作邀請</h3>
                  
                  <div className="flex-grow">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      邀請訊息
                    </label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full h-48 p-4 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none leading-relaxed"
                      placeholder="請撰寫您的邀請內容..."
                    ></textarea>
                    <div className="flex justify-between mt-2">
                       <p className="text-xs text-slate-400">系統將自動帶入您的店家資訊</p>
                       <button className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                          <FileText size={12} /> 使用範本
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {!isSuccess && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                {inviteStep === 'profile' ? (
                  <>
                    <button 
                      onClick={() => setSelectedTrip(null)}
                      className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-white transition-colors"
                    >
                      再看看
                    </button>
                    <button 
                      onClick={handleGoToInvite}
                      className="flex-[2] py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      前往邀請 <ArrowRight size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setSelectedTrip(null)}
                      className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-white transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      onClick={confirmInvite}
                      className="flex-[2] py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Send size={18} />
                      確認發送
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Auth/Login Modal (身分驗證) --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative scale-100 animate-in zoom-in-95">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                 <X size={24} />
              </button>
              
              <div className="text-center mb-8">
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">請先登入業者帳號</h2>
                 <p className="text-slate-500">登入後即可向創作者發送合作邀請，媒合心儀的人選。</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {/* Free Plan Option */}
                 <div 
                   onClick={() => handleLogin('free')}
                   className="border-2 border-slate-200 hover:border-slate-400 rounded-xl p-6 cursor-pointer transition-all hover:bg-slate-50 group"
                 >
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-sm">
                       <User size={24} className="text-slate-600"/>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">免費版登入</h3>
                    <p className="text-xs text-slate-500 mb-4">每月 {FREE_LIMIT} 次邀請額度</p>
                    <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded">試用 Starter</span>
                 </div>

                 {/* Pro Plan Option */}
                 <div 
                   onClick={() => handleLogin('pro')}
                   className="border-2 border-indigo-100 hover:border-indigo-500 rounded-xl p-6 cursor-pointer transition-all bg-indigo-50/50 hover:bg-indigo-50 group relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">推薦</div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-sm">
                       <Crown size={24} className="text-indigo-600"/>
                    </div>
                    <h3 className="font-bold text-indigo-900 mb-1">付費版登入</h3>
                    <p className="text-xs text-indigo-600/80 mb-4">無限次發送邀請</p>
                    <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-1 rounded">專業版 Pro</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- Upgrade Alert Modal (額度不足提示) --- */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center scale-100 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">免費額度已用完</h2>
              <p className="text-slate-500 text-sm mb-6">
                 您本月的 {FREE_LIMIT} 次邀請額度已達上限。<br/>升級至專業版即可解鎖無限邀請！
              </p>
              
              <div className="space-y-3">
                 <button 
                   onClick={() => {
                       setProviderPlan('pro'); // 模擬升級
                       setShowUpgradeModal(false);
                       setInviteStep('form');
                   }}
                   className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                 >
                   <Zap size={18} fill="currentColor"/> 立即升級 Pro
                 </button>
                 <button 
                   onClick={() => setShowUpgradeModal(false)}
                   className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 text-sm"
                 >
                   稍後再說
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}