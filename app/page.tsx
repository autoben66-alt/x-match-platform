'use client';

import { useState, useEffect } from 'react';
// 移除 next/link 改用自定義 Link 元件以避免預覽環境錯誤
// import Link from 'next/link';
import { 
  TrendingUp, Users, CheckCircle, ArrowRight, Search, MessageCircle, Heart, Star, BarChart, Loader2,
  X, MapPin, Instagram, Youtube, BarChart3, User, DollarSign, Camera, Mail, CheckCircle2, Award, Crown, Sparkles, Quote, Eye, Building2, Briefcase, Flame, Globe
} from 'lucide-react';

// --- 自定義 Link 元件 (解決預覽環境無法解析 next/link 的問題) ---
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

// --- 整合 CreatorCard 元件 (來自您提供的原始檔) ---

export interface Creator {
  id: number | string;
  name: string;
  handle: string;
  avatar: string;
  tags: string[];
  followers: number;
  averageViews?: number;
  completionScore?: number;
  location: string;
  bio: string;
  coverImage?: string;
}

// 擴充創作者資料結構 (包含詳情頁所需欄位)
interface CreatorDetail extends Creator {
  completedJobs: number;
  rating: number;
  badges?: string[];
  rates: { post: string; story: string; reels: string; };
  audience: { gender: string; age: string; topCity: string; };
  portfolio: string[];     
  lineId?: string;
}

const CreatorCard = ({ creator }: { creator: CreatorDetail }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full flex flex-col">
      {/* 封面圖區域：維持 h-40 高度 */}
      <div className="h-40 bg-slate-100 relative overflow-hidden">
        {creator.coverImage && (
          <img 
            src={creator.coverImage} 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
            alt="cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
      </div>
      
      <div className="px-6 pb-6 pt-0 flex-1 flex flex-col">
        {/* ✨ 版面修正重點：分離頭像與數據 */}
        <div className="flex justify-between items-start mb-2">
           {/* 左側：頭像 (向上位移，跨越封面) */}
           <div className="-mt-10 relative">
             <img 
               src={creator.avatar} 
               alt={creator.name} 
               className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-white object-cover" 
             />
           </div>
           
           {/* 右側：粉絲數 (保持在內容區，不向上位移，避免與封面重疊) */}
           <div className="flex flex-col items-end pt-3">
             <span className="text-xs text-slate-400 font-bold mb-0.5">粉絲數</span>
             <span className="font-black text-slate-900 text-lg">{(creator.followers / 1000).toFixed(1)}k</span>
           </div>
        </div>
        
        <h3 className="font-bold text-lg text-slate-900 mb-0.5 flex items-center gap-1">{creator.name}</h3>
        <p className="text-sm text-slate-400 mb-3 font-medium">{creator.handle}</p>
        
        <div className="flex items-center gap-4 mb-4 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
           <div className="flex items-center gap-1.5">
             <Eye size={14} className="text-sky-500"/>
             <span>{creator.averageViews ? (creator.averageViews/1000).toFixed(1)+'k' : 'N/A'} 觀看</span>
           </div>
           <div className="w-px h-3 bg-slate-300"></div>
           <div className="flex items-center gap-1.5">
             <Star size={14} className="text-yellow-400 fill-yellow-400"/>
             <span>{creator.completionScore || '5.0'} 信用</span>
           </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {creator.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">#{tag}</span>
          ))}
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1"><MapPin size={12}/> {creator.location}</span>
          <span className="text-indigo-600 font-bold group-hover:underline">查看履歷 &rarr;</span>
        </div>
      </div>
    </div>
  );
};

// 定義成功案例資料結構
interface Testimonial {
  id: string;
  image: string;
  quote: string;
  authorInitial?: string;
  authorName: string;
  authorLocation?: string;
  metricIcon?: string;
  metricLabel?: string;
  rating?: number;
}

// 修改：廠商資料結構 (對應真實案源 Projects)
interface ProviderDetail {
  id: string;
  name: string;         // 對應 project.business (廠商名稱)
  title: string;        // 對應 project.title (案源標題)
  location: string;
  coverImage: string;
  logo: string;
  category: string;     
  lookingFor: string[]; // 對應 tags
  budgetType: string;   // 對應 project.type
  totalValue: string;   // 對應 project.totalValue
  rating: number;
  spotsLeft: number;    // 對應 project.spotsLeft
  description?: string; // 新增：案源描述
}

// ✨ 定義豐富資料的介面，解決 TypeScript 報錯
interface EnrichData {
  name: string;
  handle: string;
  avatar: string;
  lineId: string; // 確保此欄位存在
  tags: string[];
  followers: number;
  engagement: number;
  location: string;
  bio: string;
  completedJobs: number;
  rating: number;
  coverImage: string;
  rates: { post: string; story: string; reels: string };
  audience: { gender: string; age: string; topCity: string };
  portfolio: string[];
  averageViews: number;    // 新增
  completionScore: number; // 新增
}

// 模擬豐富的履歷資料
const ENRICH_DATA: EnrichData[] = [
  {
    name: "林小美", handle: "@may_travel", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", lineId: "may_travel",
    tags: ["旅遊", "美食", "親子"], followers: 45000, engagement: 3.2, location: "台北市",
    bio: "專注於親子友善飯店與在地美食推廣，擁有高黏著度的社群。", completedJobs: 42, rating: 5.0,
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 5,000", story: "NT$ 1,500", reels: "NT$ 8,000" },
    audience: { gender: "女性 85%", age: "25-34歲", topCity: "台北/新北" },
    portfolio: [ "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" ],
    averageViews: 12500, completionScore: 5.0
  },
  {
    name: "Jason 攝影", handle: "@jason_shot", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jason", lineId: "jason_shot",
    tags: ["攝影", "戶外", "衝浪"], followers: 120000, engagement: 4.5, location: "墾丁",
    bio: "專業戶外攝影師，擅長用影像說故事，曾與多個國際戶外品牌合作。", completedJobs: 85, rating: 5.0,
    coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 12,000", story: "NT$ 3,000", reels: "NT$ 25,000" },
    audience: { gender: "男性 60%", age: "18-34歲", topCity: "台中/高雄" },
    portfolio: [ "https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3" ],
    averageViews: 45000, completionScore: 5.0
  },
  {
    name: "食尚艾莉", handle: "@elly_eats", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elly", lineId: "elly_eats",
    tags: ["咖啡廳", "生活風格"], followers: 28000, engagement: 5.1, location: "台南市",
    bio: "喜歡挖掘巷弄裡的小店，照片風格清新明亮，粉絲以年輕女性為主。", completedJobs: 63, rating: 5.0,
    coverImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 3,500", story: "NT$ 1,000", reels: "NT$ 5,000" },
    audience: { gender: "女性 90%", age: "18-24歲", topCity: "台南/高雄" },
    portfolio: [ "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3" ],
    averageViews: 8500, completionScore: 5.0
  }
];

// 新增：模擬優質廠商資料 (當 DB 無連線時使用，與案源頁面一致)
const FALLBACK_PROJECTS: ProviderDetail[] = [
    {
        id: "p1", 
        name: "海角七號民宿", 
        title: "海景房開箱體驗",
        location: "屏東恆春", 
        coverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        logo: "https://api.dicebear.com/7.x/initials/svg?seed=HL&backgroundColor=0ea5e9",
        category: "住宿", 
        lookingFor: ["海景", "寵物友善"], 
        budgetType: "互惠體驗", 
        totalValue: "NT$ 8,800",
        rating: 4.9, 
        spotsLeft: 1,
        description: "位於國境之南的隱密角落，海角七號民宿擁有絕佳的無敵海景，歡迎喜愛海邊生活的創作者。"
    },
    {
        id: "p2", 
        name: "慢活・私廚", 
        title: "春季無菜單料理試吃",
        location: "台北市", 
        coverImage: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        logo: "https://api.dicebear.com/7.x/initials/svg?seed=SK&backgroundColor=f59e0b",
        category: "餐飲", 
        lookingFor: ["美食", "探店"], 
        budgetType: "有稿酬", 
        totalValue: "NT$ 3,000+",
        rating: 4.8, 
        spotsLeft: 3,
        description: "隱身在台北巷弄的預約制私廚，每一季都會更換菜單，尋找懂吃的你來品嚐。"
    },
    {
        id: "p3", 
        name: "極光露營區", 
        title: "豪華露營一泊二食",
        location: "苗栗縣", 
        coverImage: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        logo: "https://api.dicebear.com/7.x/initials/svg?seed=AC&backgroundColor=10b981",
        category: "體驗", 
        lookingFor: ["親子", "露營"], 
        budgetType: "體驗互惠", 
        totalValue: "NT$ 6,500",
        rating: 5.0, 
        spotsLeft: 2,
        description: "免裝備豪華露營體驗，適合親子家庭或情侶，享受大自然的寧靜與星空。"
    }
];

// 預設的精美首頁評價資料
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "case-1",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    quote: "透過行程許願池，我們在淡季主動邀請到正要來墾丁的 @Jason攝影。他拍的星空照讓我們的週末訂房率提升了 30%！",
    authorInitial: "H", authorName: "海角七號民宿", authorLocation: "屏東恆春",
    metricIcon: "BarChart", metricLabel: "轉換率 +30%", rating: 5
  },
  {
    id: "case-2",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    quote: "以前都要花很多時間跟網紅議價，現在用互惠計算機，大家對交換標準有共識，溝通效率快非常多。",
    authorInitial: "R", authorName: "老宅咖啡·午後", authorLocation: "台南中西區",
    metricIcon: "TrendingUp", metricLabel: "效率提升 2x", rating: 5
  }
];

export default function Home() {
  const [creators, setCreators] = useState<CreatorDetail[]>([]);
  const [providers, setProviders] = useState<ProviderDetail[]>([]); 
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<CreatorDetail | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderDetail | null>(null); // 新增：選中的廠商案源

  // 監聽 Firebase 資料
  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      setTestimonials(FALLBACK_TESTIMONIALS);
      setProviders(FALLBACK_PROJECTS); // 若無 DB，使用 Fallback Projects
      return;
    }

    // 1. 抓取創作者清單 (維持不變，抓取 users)
    const usersCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'users');
    const unsubUsers = onSnapshot(usersCol, (snapshot) => {
      if (!snapshot.empty) {
        const allUsers = snapshot.docs.map(doc => doc.data() as any);
        
        // --- 處理創作者 ---
        const creatorUsers = allUsers.filter(u => u.role === '創作者');
        const mappedCreators: CreatorDetail[] = creatorUsers.map((u, index) => {
          const enrich = ENRICH_DATA[index % ENRICH_DATA.length];
          const isFounder = index < 50; 
          const formatRates = (rates: any) => ({
            post: rates?.post ? `NT$ ${rates.post.toLocaleString()}` : enrich.rates.post,
            story: rates?.story ? `NT$ ${rates.story.toLocaleString()}` : enrich.rates.story,
            reels: rates?.reels ? `NT$ ${rates.reels.toLocaleString()}` : enrich.rates.reels,
          });

          return {
            id: Number(u.id) || Date.now() + index,
            name: u.name || enrich.name,
            handle: u.handle || `@${u.email ? u.email.split('@')[0] : 'creator'}`,
            lineId: u.lineId || enrich.lineId || (u.handle ? u.handle.replace('@', '') : ''),
            avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
            location: u.location || enrich.location,
            bio: u.bio || enrich.bio,
            followers: u.followers || enrich.followers,
            engagement: u.engagement || enrich.engagement,
            completedJobs: u.completedJobs || enrich.completedJobs,
            rating: u.rating || enrich.rating,
            coverImage: u.coverImage || enrich.coverImage,
            portfolio: u.portfolio?.length > 0 ? u.portfolio : enrich.portfolio,
            audience: u.audience || enrich.audience,
            rates: formatRates(u.rates),
            tags: isFounder ? ['👑 創始會員', ...(u.tags || enrich.tags)] : (u.tags || enrich.tags),
            badges: isFounder ? ['創始會員', '官方認證'] : ['官方認證'],
            averageViews: u.averageViews || enrich.averageViews || 5000,
            completionScore: u.completionScore || enrich.completionScore || 5.0
          };
        });
        setCreators(mappedCreators.slice(0, 3)); 
      }
      setIsLoading(false);
    });

    // 2. 抓取真實廠商案源 (監聽 projects 集合)
    const projectsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'projects');
    const unsubProjects = onSnapshot(projectsCol, (snapshot) => {
        if (!snapshot.empty) {
            const data = snapshot.docs.map((doc, index) => {
                const raw = doc.data() as any;
                return {
                    id: doc.id,
                    name: raw.business || "優質廠商",
                    title: raw.title || "體驗招募",
                    location: raw.location || "台灣",
                    coverImage: raw.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                    logo: `https://api.dicebear.com/7.x/initials/svg?seed=${raw.business || 'P'}&backgroundColor=${['f59e0b', '0ea5e9', '10b981', 'ef4444'][index % 4]}`,
                    category: raw.category || "體驗",
                    lookingFor: raw.tags || ["熱門"],
                    budgetType: raw.type || "互惠體驗",
                    totalValue: raw.totalValue || "洽談中",
                    rating: 5.0, 
                    spotsLeft: raw.spotsLeft !== undefined ? raw.spotsLeft : 3,
                    description: raw.description || "歡迎優質創作者合作..."
                } as ProviderDetail;
            });
            // 只顯示最新的 3 個案源
            setProviders(data.slice(0, 3));
        } else {
            setProviders(FALLBACK_PROJECTS);
        }
    }, (error) => {
        console.error("Fetching projects failed:", error);
        setProviders(FALLBACK_PROJECTS);
    });

    // 3. 抓取成功案例
    const testimonialsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'testimonials');
    const unsubTestimonials = onSnapshot(testimonialsCol, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => doc.data() as Testimonial);
        setTestimonials(data);
      } else {
        setTestimonials(FALLBACK_TESTIMONIALS);
      }
    });

    return () => {
      unsubUsers();
      unsubProjects();
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
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-200 -z-10"></div>
          {[
            { step: "01", title: "探索與許願", desc: "網紅發布旅遊行程（許願池），或業者發布體驗招募。", icon: Search },
            { step: "02", title: "智能媒合", desc: "系統根據地區、風格與互惠標準，推薦最適合的合作對象。", icon: MessageCircle },
            { step: "03", title: "體驗與分享", desc: "完成體驗行程，系統自動生成數據結案報告，累積信用評價。", icon: Heart }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center bg-white p-6 rounded-xl">
              <div className="w-24 h-24 bg-white border-4 border-sky-100 rounded-full flex items-center justify-center mb-6 shadow-sm relative z-10">
                <item.icon className="w-10 h-10 text-sky-500" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">{item.step}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Creators Section */}
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
                <div 
                  key={creator.id} 
                  className="cursor-pointer transition-transform hover:-translate-y-1"
                  onClick={() => setSelectedCreator(creator)}
                >
                  <CreatorCard creator={creator} />
                </div>
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

      {/* --- Featured Providers (本週優質廠商體驗 - 更新為真實案源) --- */}
      <div className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-slate-900">本週優質廠商體驗</h2>
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 border border-amber-200 rounded-full text-[10px] font-bold text-amber-700 uppercase tracking-widest shadow-sm">
                   Featured
                </span>
              </div>
              <p className="text-slate-600">正在尋找合作夥伴的精選飯店與餐廳</p>
            </div>
            <Link href="/opportunities" className="text-slate-600 font-semibold hover:text-slate-900 flex items-center gap-1 bg-slate-50 px-4 py-2 rounded-full transition-colors border border-slate-200">
              我是網紅，查看更多招募 <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {providers.map((provider) => (
              <div 
                key={provider.id} 
                onClick={() => setSelectedProvider(provider)}
                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full relative cursor-pointer"
              >
                
                {/* Image Area */}
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={provider.coverImage} 
                    alt={provider.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur text-xs font-bold text-slate-800 rounded-full shadow-sm flex items-center gap-1">
                      <Building2 size={12} className="text-sky-500"/>
                      {provider.category}
                    </span>
                  </div>

                  {/* Logo Overlap */}
                  <div className="absolute -bottom-6 right-4">
                    <img 
                      src={provider.logo} 
                      alt={provider.name} 
                      className="w-12 h-12 rounded-lg border-4 border-white shadow-md bg-white object-cover" 
                    />
                  </div>

                  <div className="absolute bottom-3 left-4 text-white">
                    <h3 className="text-xl font-bold flex items-center gap-1">
                        {provider.name}
                        {provider.rating >= 4.8 && <Award size={16} className="text-yellow-400 fill-yellow-400"/>}
                    </h3>
                    <p className="text-sm text-slate-200 flex items-center gap-1 opacity-90">
                        <MapPin size={12}/> {provider.location}
                    </p>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5 pt-8 flex-grow flex flex-col">
                  
                  {/* Title (New) */}
                  <h4 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-sky-600 transition-colors">
                    {provider.title || provider.name}
                  </h4>

                  {/* Looking For Tags */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                        {provider.lookingFor.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded-md border border-sky-100">
                                #{tag}
                            </span>
                        ))}
                    </div>
                  </div>

                  {/* Badges/Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                     <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">合作價值</p>
                        <p className="font-bold text-slate-800 text-sm truncate px-1">{provider.totalValue || provider.budgetType}</p>
                     </div>
                     <div className="bg-green-50 p-2 rounded-lg text-center border border-green-100">
                        <p className="text-xs text-green-600 mb-1">剩餘名額</p>
                        <p className="font-bold text-green-700 text-sm flex items-center justify-center gap-1">
                            <Flame size={12}/> {provider.spotsLeft} 位
                        </p>
                     </div>
                  </div>

                  <button className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-sky-600 transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg">
                    查看合作詳情
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Stories */}
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
            加入 X-Match 的夥伴們，已經創造了無數雙贏的合作案例。
          </p>
        </div>

        {testimonials.length === 0 && isLoading ? (
           <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300"/></div>
        ) : (
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
                    {[...Array(item.rating || 5)].map((_, i) => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <blockquote className="text-lg font-medium text-slate-800 mb-6 italic leading-relaxed">
                    "{item.quote}"
                  </blockquote>
                  <div className="flex items-center gap-4 border-t border-slate-100 pt-4 mt-auto">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 shrink-0">
                      {item.authorInitial || item.authorName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{item.authorName}</p>
                      <p className="text-xs text-slate-500">{item.authorLocation || '優質合作夥伴'}</p>
                    </div>
                    {item.metricLabel && (
                      <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold shrink-0 bg-green-50 text-green-700">
                        {item.metricIcon === 'BarChart' ? <BarChart size={14} /> : <TrendingUp size={14} />} 
                        {item.metricLabel}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Creator Details Modal --- */}
      {selectedCreator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-bottom-5 duration-300 relative">
            
            <button 
              onClick={() => setSelectedCreator(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header / Cover */}
            <div className="relative h-48 sm:h-64 bg-slate-200 shrink-0">
              <img src={selectedCreator.coverImage} className="w-full h-full object-cover" alt="Cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute -bottom-10 left-6 sm:left-10 flex items-end gap-5">
                <div className="relative">
                  <img 
                    src={selectedCreator.avatar} 
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[5px] border-white bg-white shadow-xl object-cover" 
                    alt={selectedCreator.name} 
                  />
                  {selectedCreator.badges?.includes('創始會員') && (
                    <div className="absolute -bottom-2 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white p-2 rounded-full shadow-lg border-2 border-white" title="創始會員">
                      <Crown size={18} className="fill-current" />
                    </div>
                  )}
                </div>
                <div className="pb-12 text-white hidden sm:block">
                   <h2 className="text-3xl font-black mb-1 flex items-center gap-2">
                     {selectedCreator.name}
                     <CheckCircle2 size={24} className="text-sky-400 fill-sky-50" />
                   </h2>
                   <p className="font-medium text-white/80">{selectedCreator.handle}</p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="pt-16 px-6 sm:px-10 pb-8 flex-grow bg-slate-50/50">
              
              <div className="sm:hidden mb-6">
                <h2 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">
                  {selectedCreator.name}
                  <CheckCircle2 size={20} className="text-sky-500 fill-sky-50" />
                </h2>
                <p className="font-medium text-slate-500">{selectedCreator.handle}</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-6">
                <div className="w-full sm:w-auto">
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1 font-medium"><MapPin size={14}/> {selectedCreator.location}</span>
                    <span className="text-slate-300">|</span>
                    {selectedCreator.tags.filter(t => !t.includes('創始會員')).map(tag => (
                      <span key={tag} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">#{tag}</span>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <button className="p-2.5 bg-white border border-slate-200 shadow-sm rounded-full text-pink-600 hover:bg-pink-50 transition-colors"><Instagram size={20}/></button>
                    <button className="p-2.5 bg-white border border-slate-200 shadow-sm rounded-full text-red-600 hover:bg-red-50 transition-colors"><Youtube size={20}/></button>
                  </div>
                </div>

                {/* 指標展示卡片 */}
                <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                  <div className="flex-1 sm:flex-none text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[100px]">
                    <p className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">粉絲數</p>
                    <p className="text-2xl font-black text-slate-900">{(selectedCreator.followers/1000).toFixed(1)}k</p>
                  </div>
                  {/* 平均觀看數 */}
                  <div className="flex-1 sm:flex-none text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[100px]">
                    <p className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">平均觀看</p>
                    <p className="text-2xl font-black text-green-500">{(selectedCreator.averageViews ? (selectedCreator.averageViews/1000).toFixed(1) + 'k' : 'N/A')}</p>
                  </div>
                  {/* 完案信用 */}
                  <div className="flex-1 sm:flex-none text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[100px]">
                    <p className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">完案信用</p>
                    <p className="text-2xl font-black text-indigo-600 flex items-center justify-center gap-1">
                        {selectedCreator.completionScore || '5.0'} <Star size={16} className="fill-yellow-400 text-yellow-400"/>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 mb-3 tracking-widest uppercase flex items-center gap-2">
                  <User size={16} className="text-sky-500" /> 關於我
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">{selectedCreator.bio}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Audience Insight */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="font-black text-slate-900 mb-5 flex items-center gap-2 text-sm tracking-widest uppercase">
                    <BarChart3 size={18} className="text-indigo-500"/> 受眾分析
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-sm font-medium text-slate-500">性別分佈</span>
                      <span className="font-bold text-slate-800">{selectedCreator.audience.gender}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-sm font-medium text-slate-500">主力年齡</span>
                      <span className="font-bold text-slate-800">{selectedCreator.audience.age}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">熱門城市</span>
                      <span className="font-bold text-slate-800">{selectedCreator.audience.topCity}</span>
                    </div>
                  </div>
                </div>

                {/* Reference Rates */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  <h4 className="font-black text-slate-900 mb-5 flex items-center gap-2 text-sm tracking-widest uppercase relative z-10">
                    <DollarSign size={18} className="text-green-500"/> 參考報價
                  </h4>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><Camera size={14} className="text-slate-400"/> 圖文貼文</span>
                      <span className="font-black text-slate-800 bg-slate-50 px-2 py-1 rounded">{selectedCreator.rates.post}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-slate-400"></div> 限時動態</span><span className="font-black text-slate-800 bg-slate-50 px-2 py-1 rounded">{selectedCreator.rates.story}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><div className="w-3 h-3 bg-slate-400 rounded-sm"></div> Reels 短影音</span><span className="font-black text-slate-800 bg-slate-50 px-2 py-1 rounded">{selectedCreator.rates.reels}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-4 tracking-widest uppercase">近期作品 (Portfolio)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {selectedCreator.portfolio.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer border border-slate-200">
                      <img src={img} className="w-full h-full object-cover" alt="Portfolio" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 bg-white sticky bottom-0 flex flex-col sm:flex-row justify-between items-center gap-4 z-20">
               <div className="hidden sm:block">
                 <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">最近上線：2 小時前</p>
               </div>
               <div className="flex gap-3 w-full sm:w-auto">
                 <a 
                   href={`https://line.me/ti/p/~${selectedCreator.lineId || selectedCreator.handle.replace('@', '')}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex-1 sm:flex-none px-6 py-3.5 bg-[#06C755] text-white font-bold rounded-xl hover:bg-[#05b34c] shadow-lg shadow-green-200/50 flex items-center justify-center gap-2 active:scale-95 transition-all whitespace-nowrap"
                 >
                   <MessageCircle size={18} /> LINE 聯繫
                 </a>
                 <Link 
                   href="/dashboard"
                   className="flex-1 sm:flex-none px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-all whitespace-nowrap"
                 >
                   <Mail size={18} /> 發送合作邀請
                 </Link>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Provider Details Modal (優質廠商詳情視窗) --- */}
      {selectedProvider && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-bottom-5 duration-300 relative">
            
            <button 
              onClick={() => setSelectedProvider(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header / Cover */}
            <div className="relative h-56 sm:h-64 bg-slate-200 shrink-0">
              <img src={selectedProvider.coverImage} className="w-full h-full object-cover" alt="Cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute top-6 left-6">
                 <span className="px-3 py-1 bg-white/90 backdrop-blur text-xs font-bold text-slate-800 rounded-full shadow-sm flex items-center gap-1">
                    <Building2 size={12} className="text-sky-500"/>
                    {selectedProvider.category}
                 </span>
              </div>

              <div className="absolute -bottom-8 left-6 sm:left-10 flex items-end gap-5">
                <div className="relative">
                  <img 
                    src={selectedProvider.logo} 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-[4px] border-white bg-white shadow-xl object-cover" 
                    alt={selectedProvider.name} 
                  />
                </div>
                <div className="pb-10 text-white hidden sm:block">
                   <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                     {selectedProvider.name}
                     {selectedProvider.rating >= 4.8 && <Award size={20} className="text-yellow-400 fill-yellow-400"/>}
                   </h2>
                   <p className="font-medium text-white/90 flex items-center gap-1">
                      <MapPin size={14}/> {selectedProvider.location}
                   </p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="pt-14 px-6 sm:px-10 pb-8 flex-grow bg-slate-50/50">
              
              <div className="sm:hidden mb-6">
                <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                  {selectedProvider.name}
                  {selectedProvider.rating >= 4.8 && <Award size={18} className="text-yellow-400 fill-yellow-400"/>}
                </h2>
                <p className="font-medium text-slate-500 flex items-center gap-1">
                   <MapPin size={14}/> {selectedProvider.location}
                </p>
              </div>

              <div className="mb-6">
                 <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedProvider.title}</h3>
                 <div className="flex flex-wrap gap-2 mb-4">
                    {selectedProvider.lookingFor.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded-md border border-sky-100">
                            #{tag}
                        </span>
                    ))}
                 </div>
                 <p className="text-slate-600 leading-relaxed font-medium bg-white p-4 rounded-xl border border-slate-100">
                    {selectedProvider.description || "歡迎對本品牌有興趣的創作者申請合作！我們期待與您共同創造美好的體驗內容。"}
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">合作價值</p>
                    <p className="text-lg font-black text-slate-800">{selectedProvider.totalValue || selectedProvider.budgetType}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">剩餘名額</p>
                    <p className="text-lg font-black text-green-600 flex items-center gap-1">
                        <Flame size={18} className="fill-green-600"/> {selectedProvider.spotsLeft} 位
                    </p>
                 </div>
              </div>

            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 bg-white sticky bottom-0 flex gap-3 z-20">
               <button 
                 onClick={() => setSelectedProvider(null)}
                 className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
               >
                 關閉
               </button>
               <Link 
                 href="/opportunities"
                 className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-sky-600 shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
               >
                 前往應徵 <ArrowRight size={18}/>
               </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}