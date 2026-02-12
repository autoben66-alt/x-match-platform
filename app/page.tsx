'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, CheckCircle, ArrowRight, Search, MessageCircle, Heart, Star, BarChart, Loader2 } from 'lucide-react';
import CreatorCard, { Creator } from '@/components/CreatorCard';

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

// 定義成功案例資料結構
interface Testimonial {
  id: string;
  image: string;
  quote: string;
  authorInitial: string;
  authorName: string;
  authorLocation: string;
  metricIcon: 'BarChart' | 'TrendingUp';
  metricLabel: string;
  rating: number;
}

// 預設的精美首頁評價資料 (當資料庫沒有設定時的備用方案)
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "case-1",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    quote: "透過行程許願池，我們在淡季主動邀請到正要來墾丁的 @Jason攝影。他拍的星空照讓我們的週末訂房率提升了 30%！",
    authorInitial: "H",
    authorName: "海角七號民宿",
    authorLocation: "屏東恆春",
    metricIcon: "BarChart",
    metricLabel: "轉換率 +30%",
    rating: 5
  },
  {
    id: "case-2",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    quote: "以前都要花很多時間跟網紅議價，現在用互惠計算機，大家對交換標準有共識，溝通效率快非常多。",
    authorInitial: "R",
    authorName: "老宅咖啡·午後",
    authorLocation: "台南中西區",
    metricIcon: "TrendingUp",
    metricLabel: "效率提升 2x",
    rating: 5
  }
];

export default function Home() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 監聽 Firebase 資料
  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    // 1. 抓取創作者清單 (動態顯示在首頁)
    const usersCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'users');
    const unsubUsers = onSnapshot(usersCol, (snapshot) => {
      if (!snapshot.empty) {
        const creatorData = snapshot.docs
          .map(doc => doc.data())
          .filter(u => u.role === '創作者')
          .map((u, idx) => ({
            id: Number(u.id) || Date.now() + idx,
            name: u.name,
            handle: `@${u.email ? u.email.split('@')[0] : 'creator'}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
            tags: idx === 0 ? ["旅遊", "攝影"] : idx === 1 ? ["美食", "探店"] : ["親子", "生活"], // 暫時給予隨機標籤
            followers: 10000 + (Math.floor(Math.random() * 50000)), // 模擬粉絲數
            engagement: 3 + (Math.random() * 3), // 模擬互動率 3% ~ 6%
            location: idx % 2 === 0 ? "台北市" : "台中市",
            bio: u.status === '活躍' ? "專注於高質感圖文創作，歡迎來信洽談互惠合作！" : "即將更新更多精彩作品..."
          }));
        
        // 隨機打亂並取前三名作為「本週熱門」
        const shuffled = creatorData.sort(() => 0.5 - Math.random());
        setCreators(shuffled.slice(0, 3));
      }
      setIsLoading(false);
    });

    // 2. 抓取成功案例 (聽聽他們怎麼說)
    const testimonialsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'testimonials');
    const unsubTestimonials = onSnapshot(testimonialsCol, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => doc.data() as Testimonial);
        setTestimonials(data);
      } else {
        // 若資料庫尚未建立評價，使用預設美觀資料
        setTestimonials(FALLBACK_TESTIMONIALS);
      }
    });

    return () => {
      unsubUsers();
      unsubTestimonials();
    };
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <div className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Luxury Resort" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col items-center text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-sky-500/30 text-sky-200 text-sm font-semibold mb-6 backdrop-blur-sm border border-sky-400/30 shadow-lg">
            餐旅業 x 創作者 媒合新標準
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight drop-shadow-lg">
            體驗，即是價值。<br/>開啟業者與創作者的互惠新局
          </h1>
          <p className="max-w-xl text-lg text-slate-200 mb-10 drop-shadow-md font-medium">
            首創「行程逆向媒合」。網紅以影響力換宿，業者以空房換曝光。
            智能合約保障，讓每一次合作簡單、透明。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link 
              href="/creators"
              className="flex-1 bg-white text-slate-900 py-3.5 px-6 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2"
            >
              我是業者，找網紅 <ArrowRight size={20} />
            </Link>
            <Link 
              href="/dashboard"
              className="flex-1 bg-sky-500 text-white py-3.5 px-6 rounded-xl font-bold text-lg hover:bg-sky-600 transition-all hover:scale-105 shadow-[0_0_20px_rgba(14,165,233,0.4)] border border-sky-400 text-center flex items-center justify-center"
            >
              我是網紅，免費駐站
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: TrendingUp, label: "平均媒合效率", value: "3 天", sub: "傳統模式需 2 週" },
            { icon: Users, label: "活躍創作者", value: "1,200+", sub: "經實名認證與數據審核" },
            { icon: CheckCircle, label: "專案完成率", value: "98%", sub: "獨家履約保證機制" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex items-start space-x-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="bg-sky-50 p-3 rounded-xl">
                <stat.icon className="w-8 h-8 text-sky-600" />
              </div>
              <div>
                <p className="text-slate-500 font-medium mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-slate-400">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">簡單三步驟，開啟互惠旅程</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            我們簡化了繁瑣的溝通流程，讓您專注於創作與體驗。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-200 -z-10"></div>

          {[
            { 
              step: "01", 
              title: "探索與許願", 
              desc: "網紅發布旅遊行程（許願池），或業者發布體驗招募。",
              icon: Search
            },
            { 
              step: "02", 
              title: "智能媒合", 
              desc: "系統根據地區、風格與互惠標準，推薦最適合的合作對象。",
              icon: MessageCircle 
            },
            { 
              step: "03", 
              title: "體驗與分享", 
              desc: "完成體驗行程，系統自動生成數據結案報告，累積信用評價。",
              icon: Heart
            }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center bg-white p-6 rounded-xl">
              <div className="w-24 h-24 bg-white border-4 border-sky-100 rounded-full flex items-center justify-center mb-6 shadow-sm relative z-10">
                <item.icon className="w-10 h-10 text-sky-500" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">
                  {item.step}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Creators Section (Cloud Sync) */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-slate-900">本週駐站熱門創作者</h2>
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 border border-green-200 rounded-full text-[10px] font-bold text-green-700 uppercase tracking-widest shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <p className="text-slate-600">最新加入且經系統認證的高互動潛力新星</p>
            </div>
            <Link href="/creators" className="text-sky-600 font-semibold hover:underline flex items-center gap-1 bg-sky-50 px-4 py-2 rounded-full transition-colors">
              查看全部創作者 <ArrowRight size={16} />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-sky-500" />
              <p className="font-bold text-sm tracking-widest uppercase">資料庫同步中...</p>
            </div>
          ) : creators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creators.map(creator => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
               <p className="text-slate-500 font-medium">尚未有創作者加入平台，搶先成為第一位！</p>
               <Link href="/dashboard" className="mt-4 inline-block text-sky-600 font-bold hover:underline">立即註冊入駐</Link>
            </div>
          )}
        </div>
      </div>

      {/* Success Stories / Case Studies (Ready for Admin CMS) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-16">
          <span className="text-sky-600 font-bold tracking-wider uppercase text-sm mb-2 block">Success Stories</span>
          <h2 className="text-3xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
            聽聽他們怎麼說
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Cloud CMS Ready
            </span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            加入 X-Match 的夥伴們，已經創造了無數雙贏的合作案例。<br/>
          
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((item, index) => (
            <div key={item.id || index} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 flex flex-col md:flex-row hover:shadow-xl transition-shadow duration-300">
              <div className="md:w-2/5 relative min-h-[200px] md:min-h-full">
                <img 
                  src={item.image} 
                  alt={item.authorName} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-8 md:w-3/5 flex flex-col justify-center bg-white relative z-10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(item.rating)].map((_, i) => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <blockquote className="text-lg font-medium text-slate-800 mb-6 italic leading-relaxed">
                  "{item.quote}"
                </blockquote>
                <div className="flex items-center gap-4 border-t border-slate-100 pt-4 mt-auto">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 shrink-0">
                    {item.authorInitial}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.authorName}</p>
                    <p className="text-xs text-slate-500">{item.authorLocation}</p>
                  </div>
                  <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold shrink-0 ${
                    item.metricIcon === 'BarChart' ? 'bg-green-50 text-green-700' : 'bg-sky-50 text-sky-700'
                  }`}>
                    {item.metricIcon === 'BarChart' ? <BarChart size={14} /> : <TrendingUp size={14} />} 
                    {item.metricLabel}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}