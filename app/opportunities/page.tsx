'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, DollarSign, Camera, Hotel, Utensils, Tent, Filter, Sparkles, Flame, Zap, 
  ArrowRight, Users, CheckCircle, X, CheckCircle2, ChevronLeft, ChevronRight, Info, 
  Loader2, Building2, Briefcase, Award, Link as LinkIcon, AtSign, MessageSquare, LogIn, UserCircle2, Edit3
} from 'lucide-react';

// --- Firebase 核心引入 ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

// --- Firebase 初始化 ---
const getFirebaseConfig = () => {
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    try { return JSON.parse((window as any).__firebase_config); } catch (e) {}
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
  };
};

const firebaseConfig = getFirebaseConfig();

let app: any = null;
let auth: any = null;
let db: any = null;

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase 初始化失敗:", error);
  }
}

const internalAppId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'x-match-a83f0';

// 定義案源資料結構
interface Opportunity {
  id: string;
  title: string;           
  business?: string;       
  location: string;
  type: '互惠體驗' | '付費推廣' | string;
  category: '住宿' | '餐飲' | '體驗' | string;
  totalValue: string;        
  valueBreakdown: string;    
  requirements: string;
  image?: string;
  gallery?: string[];         
  description?: string;       
  tags?: string[];
  matchScore?: number;        
  spotsLeft?: number;        
  applicants: number;        
  date?: string;
}

// 模擬會員資料 (Demo User)
const DEMO_USER = {
  name: '林小美',
  handle: '@may_travel',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  contact: 'may_travel@example.com',
  socialLink: 'instagram.com/may_travel',
  followers: '45k',
  engagement: '3.2%'
};

// 備用模擬資料
const FALLBACK_DATA: Opportunity[] = [
  {
    id: 'fallback-1',
    title: '海景房開箱體驗招募',
    business: "海角七號民宿",
    location: "屏東恆春",
    type: "互惠體驗",
    category: "住宿",
    totalValue: "NT$ 8,800",
    valueBreakdown: "海景房住宿($6800) + 早餐($800) + 接送($1200)",
    requirements: "IG 貼文 1 則 + 限動 3 則 (需標記地點)",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    description: "位於國境之南的隱密角落，海角七號民宿擁有絕佳的無敵海景。",
    tags: ["海景", "早餐", "寵物友善"],
    matchScore: 98,
    spotsLeft: 1, 
    applicants: 12
  }
];

export default function OpportunitiesPage() {
  const [applyJob, setApplyJob] = useState<Opportunity | null>(null); 
  const [viewJob, setViewJob] = useState<Opportunity | null>(null);   
  const [activeImage, setActiveImage] = useState<string>('');         
  const [isSuccess, setIsSuccess] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  // --- 新增：狀態管理 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 模擬登入狀態
  const [showLoginModal, setShowLoginModal] = useState(false); // 登入提示視窗
  const [isEditing, setIsEditing] = useState(false); // 是否正在編輯會員資料

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    socialLink: '',
    message: '您好，我對這個案源非常有興趣，這是我的相關作品，希望能有機會合作！'
  });

  // Firebase 資料狀態
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 初始化 Auth
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) setFbUser(user);
      else { try { await signInAnonymously(auth); } catch (e) { console.error(e); } }
    });
    return () => unsubscribe();
  }, []);

  // 2. 監聽 Firestore 資料
  useEffect(() => {
    if (!db) {
      setOpportunities(FALLBACK_DATA);
      setIsLoading(false);
      return;
    }

    const projectsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'projects');
    const unsubscribe = onSnapshot(projectsCol, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => {
          const rawData = doc.data() as Opportunity;
          return {
            ...rawData,
            business: rawData.business || "優質合作廠商",
            image: rawData.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            gallery: rawData.gallery && rawData.gallery.length > 0 ? rawData.gallery : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
            description: rawData.description || "歡迎熱愛分享的創作者一起合作，詳細內容請參考互惠需求。",
            tags: rawData.tags || ["熱門案源", "最新發布"],
            matchScore: rawData.matchScore || Math.floor(Math.random() * (99 - 80 + 1)) + 80, 
            spotsLeft: rawData.spotsLeft !== undefined ? rawData.spotsLeft : 3,
            applicants: rawData.applicants || 0
          };
        });
        setOpportunities(data.sort((a, b) => Number(b.id) - Number(a.id)));
      } else {
        setOpportunities([]);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("讀取案源失敗:", err);
      setOpportunities(FALLBACK_DATA);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 處理點擊快速應徵
  const handleQuickApply = (job: Opportunity) => {
    setViewJob(null);
    setApplyJob(job);
    setIsSuccess(false);

    // 每次開啟都重置為未編輯狀態
    setIsEditing(false);

    // 檢查登入狀態
    if (!isLoggedIn) {
        setShowLoginModal(true);
    } else {
        // 若已登入，載入會員資料
        setFormData({
            name: DEMO_USER.name,
            contact: DEMO_USER.contact,
            socialLink: DEMO_USER.socialLink,
            message: '您好，我對這個案源非常有興趣，這是我的相關作品，希望能有機會合作！'
        });
    }
  };

  // 執行模擬登入
  const handleLogin = () => {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      // 登入後自動填入 Demo 資料
      setFormData({
        name: DEMO_USER.name,
        contact: DEMO_USER.contact,
        socialLink: DEMO_USER.socialLink,
        message: '您好，我對這個案源非常有興趣，這是我的相關作品，希望能有機會合作！'
      });
  };

  // 執行訪客應徵
  const handleGuestApply = () => {
      setIsLoggedIn(false);
      setShowLoginModal(false);
      // 訪客需手動填寫，清空資料
      setFormData({
        name: '',
        contact: '',
        socialLink: '',
        message: '您好，我對這個案源非常有興趣，這是我的相關作品，希望能有機會合作！'
      });
      // 強制進入編輯模式
      setIsEditing(true); 
  };

  // 確認應徵：寫入 Firestore
  const confirmApply = async () => {
    if (!db) {
      alert("尚未連線至資料庫，請稍候再試。");
      return;
    }

    if (!formData.name || !formData.contact || !formData.socialLink) {
        alert("請填寫完整的聯絡資訊，以便廠商聯繫您。");
        return;
    }
    
    try {
      const newId = `app-${Date.now()}`;
      const invRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', newId);
      
      await setDoc(invRef, {
        id: newId,
        type: 'application',
        fromName: formData.name,
        toName: applyJob?.business || '廠商',
        message: formData.message,
        status: '待審核',
        date: new Date().toLocaleString('zh-TW', { hour12: false }),
        projectId: applyJob?.id,
        projectTitle: applyJob?.title,
        creatorInfo: {
          name: formData.name,
          // 如果是會員，使用預設頭像，否則生成頭像
          avatar: isLoggedIn ? DEMO_USER.avatar : `https://api.dicebear.com/7.x/initials/svg?seed=${formData.name}&backgroundColor=0ea5e9`,
          link: formData.socialLink,
          contact: formData.contact,
          followers: isLoggedIn ? DEMO_USER.followers : 'N/A',
          engagement: isLoggedIn ? DEMO_USER.engagement : 'N/A',
          tags: isLoggedIn ? ['會員應徵'] : ['主動應徵']
        }
      });

      setIsSuccess(true);
      setTimeout(() => {
        setApplyJob(null);
        setIsSuccess(false);
      }, 2000);
    } catch (e) {
      console.error("應徵失敗", e);
      alert("應徵失敗，請稍後再試");
    }
  };

  const filteredOpportunities = opportunities.filter(job => {
    if (categoryFilter === '全部') return true;
    return job.category === categoryFilter;
  });

  const categories = [ { id: '全部', label: '全部' }, { id: '住宿', label: '住宿' }, { id: '餐飲', label: '餐飲' }, { id: '體驗', label: '體驗' } ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            最新廠商合作案源
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync
            </span>
          </h1>
          <p className="text-slate-600">
            精選全台優質旅宿、餐廳與體驗活動，尋找最適合你的合作機會。
          </p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
           {categories.map(cat => (
             <button
               key={cat.id}
               onClick={() => setCategoryFilter(cat.id)}
               className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-sm transition-colors ${
                 categoryFilter === cat.id
                   ? 'bg-slate-900 text-white'
                   : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600'
               }`}
             >
               {cat.label}
             </button>
           ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
          <p className="font-medium tracking-widest uppercase text-xs">正在從資料庫同步案源...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredOpportunities.map((job, index) => {
             const logoUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${job.business || 'Provider'}&backgroundColor=${['f59e0b', '0ea5e9', '10b981', 'ef4444'][index % 4]}`;
             
             return (
              <div 
                key={job.id} 
                onClick={() => {
                  setViewJob(job);
                  setActiveImage(job.image || ''); 
                }} 
                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full relative cursor-pointer"
              >
                {/* (省略卡片內容，保持不變) */}
                {job.matchScore && job.matchScore >= 90 && (
                  <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-in fade-in zoom-in">
                    <Sparkles size={12} fill="currentColor" />
                    {job.matchScore}% 推薦
                  </div>
                )}
                <div className="h-56 relative overflow-hidden">
                  <img src={job.image} alt={job.business} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm flex items-center gap-1 backdrop-blur-md ${job.type === '付費推廣' ? 'bg-amber-100/90 text-amber-800' : 'bg-white/90 text-slate-800'}`}>
                      {job.category === '住宿' && <Hotel size={12} />}{job.category === '餐飲' && <Utensils size={12} />}{job.category === '體驗' && <Tent size={12} />}{job.type}
                    </span>
                  </div>
                  <div className="absolute -bottom-6 right-4 z-20">
                    <img src={logoUrl} alt={job.business} className="w-12 h-12 rounded-lg border-4 border-white shadow-md bg-white object-cover" />
                  </div>
                  <div className="absolute bottom-3 left-4 text-white max-w-[75%]">
                    <h3 className="text-lg font-bold flex items-center gap-1 line-clamp-1">{job.business}</h3>
                    <p className="text-xs text-slate-200 flex items-center gap-1 opacity-90 font-medium"><MapPin size={12}/> {job.location}</p>
                  </div>
                </div>
                <div className="p-5 pt-8 flex-grow flex flex-col">
                  <div className="mb-4">
                     <h4 className="font-bold text-slate-900 text-lg mb-2 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[3rem]">{job.title}</h4>
                     <div className="flex flex-wrap gap-1.5">{job.tags?.slice(0, 3).map(tag => (<span key={tag} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-medium rounded border border-slate-100">#{tag}</span>))}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                     <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider">總價值</p>
                        <p className="font-bold text-indigo-600 text-sm">{job.totalValue}</p>
                     </div>
                     <div className={`p-2.5 rounded-xl text-center border ${job.spotsLeft !== undefined && job.spotsLeft <= 3 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                        <p className={`text-[10px] mb-0.5 uppercase tracking-wider ${job.spotsLeft !== undefined && job.spotsLeft <= 3 ? 'text-red-500' : 'text-green-500'}`}>{job.spotsLeft !== undefined && job.spotsLeft <= 3 ? '即將額滿' : '剩餘名額'}</p>
                        <p className={`font-bold text-sm flex items-center justify-center gap-1 ${job.spotsLeft !== undefined && job.spotsLeft <= 3 ? 'text-red-600' : 'text-green-600'}`}>{job.spotsLeft !== undefined && job.spotsLeft <= 3 && <Flame size={12} fill="currentColor"/>}{job.spotsLeft !== undefined ? job.spotsLeft : 5} 位</p>
                     </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleQuickApply(job); }} className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-all hover:shadow-lg flex items-center justify-center gap-2 group/btn active:scale-95">
                    <Zap size={16} className="text-yellow-400 fill-yellow-400 group-hover/btn:animate-pulse"/> 快速應徵
                  </button>
                </div>
              </div>
          )})}
          
          {filteredOpportunities.length === 0 && (
            <div className="col-span-1 md:col-span-3 text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Filter className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">目前暫無案源或正在更新中</p>
              <button onClick={() => setCategoryFilter('全部')} className="mt-2 text-sm text-indigo-600 font-bold hover:underline">查看所有分類</button>
            </div>
          )}
        </div>
      )}

      {/* --- Job Details Modal (詳情視窗 - 保持不變) --- */}
      {viewJob && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-bottom-5 duration-300 relative">
            <div className="relative h-64 sm:h-72 shrink-0 bg-slate-200">
               <img src={activeImage} className="w-full h-full object-cover transition-opacity duration-300" alt={viewJob.business} />
               <button onClick={() => setViewJob(null)} className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"><X size={20} /></button>
               {viewJob.gallery && viewJob.gallery.length > 0 && (
                 <div className="absolute bottom-4 left-4 flex gap-2 overflow-x-auto max-w-[calc(100%-2rem)]">
                   {[viewJob.image, ...viewJob.gallery].filter(Boolean).slice(0, 4).map((img, i) => (
                     <img key={i} src={img as string} onClick={() => setActiveImage(img as string)} className={`w-16 h-12 object-cover rounded-md border-2 cursor-pointer transition-colors ${activeImage === img ? 'border-indigo-500' : 'border-white/50 hover:border-white'}`} alt="Gallery" />
                   ))}
                 </div>
               )}
            </div>
            <div className="p-6 sm:p-8 flex-grow bg-slate-50/50">
               <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${viewJob.type === '付費推廣' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-50 text-indigo-700'}`}>{viewJob.type}</span>
                       <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /> {viewJob.location}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{viewJob.title}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mb-4"><Building2 size={16}/> {viewJob.business}</p>
                 </div>
                 <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 mb-1">合作總價值</p>
                    <p className="text-2xl font-bold text-indigo-600">{viewJob.totalValue}</p>
                 </div>
               </div>
               <div className="mb-8">
                 <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2"><Info size={18} className="text-indigo-500"/> 關於合作與商家</h3>
                 <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{viewJob.description}</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                     <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm"><DollarSign size={16} className="text-green-600"/> 互惠價值詳情</h4>
                     <ul className="space-y-2 text-sm text-slate-600">{viewJob.valueBreakdown.split('+').map((item, i) => (<li key={i} className="flex items-start gap-2"><CheckCircle2 size={14} className="text-green-500 mt-1 shrink-0"/><span>{item.trim()}</span></li>))}</ul>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                     <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm"><Camera size={16} className="text-blue-600"/> 內容需求</h4>
                     <p className="text-sm text-slate-600 mb-3">{viewJob.requirements}</p>
                  </div>
               </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 sticky bottom-0 flex justify-between items-center gap-4">
               <div className="sm:hidden">
                  <p className="text-xs text-slate-500">總價值</p>
                  <p className="text-xl font-bold text-indigo-600">{viewJob.totalValue}</p>
               </div>
               <div className="flex gap-3 w-full sm:w-auto ml-auto">
                 <button onClick={() => setViewJob(null)} className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">再看看</button>
                 <button onClick={() => handleQuickApply(viewJob)} className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"><Zap size={16} className="fill-yellow-400 text-yellow-400" /> 立即應徵</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Step 1: 登入提示視窗 (Login Gate) --- */}
      {showLoginModal && applyJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <UserCircle2 size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">請先登入會員</h3>
              <p className="text-slate-500 text-sm mb-6">
                登入後可使用 <span className="font-bold text-slate-700">一鍵應徵</span> 功能，<br/>系統將自動帶入您的 Media Kit。
              </p>
              
              <div className="space-y-3">
                 <button 
                   onClick={handleLogin}
                   className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
                 >
                   <LogIn size={18} /> 模擬會員登入 (Demo)
                 </button>
                 <button 
                   onClick={handleGuestApply}
                   className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2"
                 >
                   我是新訪客 (手動填寫)
                 </button>
              </div>
              <button 
                onClick={() => { setShowLoginModal(false); setApplyJob(null); }}
                className="mt-4 text-xs text-slate-400 hover:text-slate-600"
              >
                取消並關閉
              </button>
           </div>
        </div>
      )}

      {/* --- Step 2: 應徵確認視窗 (Apply Modal) --- */}
      {applyJob && !showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            {isSuccess ? (
              <div className="p-8 text-center bg-slate-50">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in spin-in-180 duration-500">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">應徵資料已送出！</h3>
                <p className="text-slate-500 text-sm">
                  我們已通知廠商，若您的條件符合需求，<br/>廠商將會主動聯繫您。
                </p>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {isLoggedIn ? '確認發送應徵' : '訪客快速應徵'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isLoggedIn ? '系統將自動整理您的資料傳送給廠商' : '請填寫基本資料以便廠商聯繫'}
                    </p>
                  </div>
                  <button onClick={() => setApplyJob(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                {/* 應徵項目摘要 */}
                <div className="flex items-center gap-4 mb-6 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                  <img src={applyJob.image} className="w-12 h-12 rounded-lg object-cover" alt={applyJob.title} />
                  <div>
                    <p className="font-bold text-slate-900 line-clamp-1 text-sm">{applyJob.title}</p>
                    <p className="text-xs text-slate-500">{applyJob.business}</p>
                  </div>
                </div>

                {/* 會員模式：顯示創作者卡片 (可編輯) */}
                {isLoggedIn && !isEditing ? (
                   <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 relative group">
                      <div className="flex items-center gap-4">
                         <img src={DEMO_USER.avatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm bg-slate-100" alt="Avatar"/>
                         <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1">
                               {formData.name} <CheckCircle2 size={14} className="text-blue-500 fill-blue-50"/>
                            </p>
                            <p className="text-xs text-slate-500 mb-1">{formData.socialLink}</p>
                            <div className="flex gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block">
                               <span>粉絲 {DEMO_USER.followers}</span>
                               <span className="text-slate-300">|</span>
                               <span>互動 {DEMO_USER.engagement}</span>
                            </div>
                         </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2">
                         <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0"/>
                         <p className="text-xs text-slate-500">
                            已夾帶 <span className="font-bold text-slate-700">完整 Media Kit</span> 與 <span className="font-bold text-slate-700">歷史評價紀錄</span>
                         </p>
                      </div>

                      {/* 編輯按鈕 */}
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="編輯資料"
                      >
                         <Edit3 size={16} />
                      </button>
                   </div>
                ) : (
                  /* 編輯模式 / 訪客模式：顯示表單 */
                  <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">您的稱呼 (Name) <span className="text-red-500">*</span></label>
                      <div className="relative">
                          <Users size={16} className="absolute left-3 top-3 text-slate-400"/>
                          <input 
                              type="text" 
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              placeholder="請輸入您的名字或暱稱"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">社群/作品連結 (Social Link) <span className="text-red-500">*</span></label>
                      <div className="relative">
                          <LinkIcon size={16} className="absolute left-3 top-3 text-slate-400"/>
                          <input 
                              type="text" 
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              placeholder="IG / Blog / YouTube 連結"
                              value={formData.socialLink}
                              onChange={(e) => setFormData({...formData, socialLink: e.target.value})}
                          />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">聯絡方式 (Line / Email) <span className="text-red-500">*</span></label>
                      <div className="relative">
                          <AtSign size={16} className="absolute left-3 top-3 text-slate-400"/>
                          <input 
                              type="text" 
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              placeholder="請留下方便聯繫的 Line ID 或 Email"
                              value={formData.contact}
                              onChange={(e) => setFormData({...formData, contact: e.target.value})}
                          />
                      </div>
                    </div>
                    {/* 若是會員切換到編輯模式，顯示取消編輯按鈕 */}
                    {isLoggedIn && (
                        <div className="text-right">
                            <button onClick={() => setIsEditing(false)} className="text-xs text-indigo-600 hover:underline">取消編輯，返回名片模式</button>
                        </div>
                    )}
                  </div>
                )}

                {/* 共同欄位：留言 */}
                <div className="mb-8">
                  <label className="block text-xs font-bold text-slate-700 mb-1">給廠商的話 (Message)</label>
                  <div className="relative">
                      <MessageSquare size={16} className="absolute left-3 top-3 text-slate-400"/>
                      <textarea 
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
                          placeholder="簡單自我介紹..."
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                      />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setApplyJob(null)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={confirmApply}
                    className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
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