'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Camera, Heart, Search, Filter, Users, Flame, Zap, Bed, Utensils, Ticket, Clock, ArrowRight, X, CheckCircle, Send, Loader2 } from 'lucide-react';

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

// 定義行程資料結構
interface Trip {
  id: string;
  creatorName: string;
  creatorAvatar: string;
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

// 備用模擬行程資料 (當連線失敗或資料庫為空時顯示)
const FALLBACK_TRIPS: Trip[] = [
  {
    id: '1',
    creatorName: "Jason 攝影",
    creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jason",
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
  },
  {
    id: '4',
    creatorName: "林小美",
    creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    destination: "宜蘭礁溪",
    dates: "2024/05/20 - 05/22",
    daysLeft: 0,
    category: "住宿",
    partySize: "2大2小",
    offers: 15,
    purpose: "家庭週末小旅行，拍攝親子穿搭與飯店設施。",
    needs: "親子友善飯店，希望能有溫泉設施與兒童遊戲室。",
    status: "Matched",
    tags: ["親子", "溫泉", "飯店"]
  }
];

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null); // 控制邀請視窗
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');

  // Firebase 資料狀態
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 監聽 Firestore 資料
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
          // 針對 Dashboard 新增時缺乏的欄位給予預設值
          return {
            ...rawData,
            creatorAvatar: rawData.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawData.creatorName}`,
            daysLeft: rawData.daysLeft !== undefined ? rawData.daysLeft : Math.floor(Math.random() * 14) + 1, // 隨機生成倒數天數
            tags: rawData.tags || ["熱門許願", "求合作"],
            category: rawData.category || "住宿",
            status: rawData.status || "Open"
          };
        });
        // 依據 ID 降序排列，確保最新的行程在最上面
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

  // 篩選邏輯
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.destination.includes(searchTerm) || trip.tags.some(tag => tag.includes(searchTerm));
    const matchesCategory = categoryFilter === '全部' || trip.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // 開啟邀請視窗
  const handleOpenInvite = (trip: Trip) => {
    setSelectedTrip(trip);
    // 自動帶入預設文案
    setMessage(`哈囉 ${trip.creatorName}！\n\n我們是[您的店家名稱]，看到您預計前往${trip.destination}，誠摯邀請您來體驗我們的服務！\n\n我們可以提供：\n1. 免費體驗...\n2. 特別招待...\n\n期待您的回覆！`);
    setIsSuccess(false);
  };

  // 確認發送
  const confirmInvite = () => {
    // 模擬發送延遲
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
            {/* 連線狀態指示燈 */}
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync
            </span>
          </h1>
          <p className="text-slate-600">
            網紅公佈行程，在地商家主動提供體驗機會。發現誰正要來你的城市？
          </p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 shadow-md flex items-center gap-2 transition-transform active:scale-95">
          <Calendar size={18} />
          發布新行程
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between sticky top-20 z-40">
        
        {/* Category Filters (需求精準分類) */}
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

        {/* Search Bar */}
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
              
              {/* 急單倒數背景效果 (Urgency Effect) */}
              {trip.daysLeft !== undefined && trip.daysLeft <= 3 && (trip.status === 'Open' || trip.status === '招募中') && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/10 to-transparent -mr-10 -mt-10 rounded-bl-full pointer-events-none"></div>
              )}

              {/* Left: Creator Info */}
              <div className="flex-shrink-0 flex flex-col items-center min-w-[120px] md:border-r md:border-slate-100 md:pr-6">
                <div className="relative">
                  <img 
                    src={trip.creatorAvatar} 
                    className="w-16 h-16 rounded-full mb-3 border-2 border-white shadow-sm" 
                    alt={trip.creatorName} 
                  />
                  {/* Status Badge */}
                  <div className="absolute -bottom-1 -right-2">
                     {trip.status === 'Matched' ? (
                       <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold border-2 border-white">已媒合</span>
                     ) : (
                       <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold border-2 border-white">招募中</span>
                     )}
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-900 mb-1">{trip.creatorName}</p>
                
                {/* Party Size (許願細節展開 - 人數) */}
                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full mt-1 border border-slate-100">
                  <Users size={12} />
                  {trip.partySize}
                </div>
              </div>
              
              {/* Middle: Trip Details */}
              <div className="flex-grow space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* Category Badge (分類標籤) */}
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

                  {/* Urgency Countdown (急單倒數機制) */}
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

              {/* Right: Action & Social Proof */}
              <div className="flex-shrink-0 flex flex-col justify-between md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0 min-w-[160px]">
                 {/* Offer Counter (競爭熱度顯示) */}
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

          {/* Empty State */}
          {filteredTrips.length === 0 && (
              <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">找不到符合條件的行程或正在同步中</p>
                  <button 
                    onClick={() => {setSearchTerm(''); setCategoryFilter('全部');}}
                    className="mt-2 text-sm text-indigo-600 font-bold hover:underline"
                  >
                    清除篩選條件
                  </button>
              </div>
          )}
        </div>
      )}

      {/* --- Send Invitation Modal (發送邀請視窗) --- */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            {isSuccess ? (
              <div className="p-8 text-center bg-slate-50">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in spin-in-180 duration-500">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">邀請已發送！</h3>
                <p className="text-slate-500 text-sm">
                  {selectedTrip.creatorName} 將會收到您的邀請通知，<br/>祝您媒合成功！
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">發送合作邀請</h3>
                    <p className="text-xs text-slate-500">給 {selectedTrip.creatorName}</p>
                  </div>
                  <button onClick={() => setSelectedTrip(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6">
                  {/* Trip Summary */}
                  <div className="flex items-center gap-3 mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <img src={selectedTrip.creatorAvatar} className="w-10 h-10 rounded-full" alt="avatar" />
                    <div className="flex-1">
                       <p className="text-sm font-bold text-indigo-900">{selectedTrip.destination} 行程</p>
                       <p className="text-xs text-indigo-600">{selectedTrip.dates}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        邀請訊息
                      </label>
                      <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full h-40 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        placeholder="請撰寫您的邀請內容..."
                      ></textarea>
                      <p className="text-xs text-slate-400 mt-1 text-right">建議包含互惠內容與您的店家優勢</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                  <button 
                    onClick={() => setSelectedTrip(null)}
                    className="flex-1 py-2.5 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-white transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={confirmInvite}
                    className="flex-1 py-2.5 bg-indigo-600 rounded-lg font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    確認發送
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}