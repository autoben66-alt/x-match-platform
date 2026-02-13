'use client';

import { useState, useEffect } from 'react';
import { MapPin, DollarSign, Camera, Hotel, Utensils, Tent, Filter, Sparkles, Flame, Zap, ArrowRight, Users, CheckCircle, X, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, Building2 } from 'lucide-react';

// --- Firebase 核心引入 ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

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

// 定義案源資料結構 (需與 Dashboard 寫入的結構一致)
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

// 備用模擬資料 (當連線失敗或資料庫為空時顯示)
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

  // Firebase 資料狀態
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 初始化 Auth (為了取得 user ID 寫入應徵紀錄)
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
          // 針對缺乏的欄位給予預設值
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

  // 開啟快速應徵
  const handleQuickApply = (job: Opportunity) => {
    setViewJob(null);
    setApplyJob(job);
    setIsSuccess(false);
  };

  // 確認應徵：寫入 Firestore (type: 'application')
  const confirmApply = async () => {
    if (!db) {
      alert("尚未連線至資料庫，請稍候再試。");
      return;
    }
    
    try {
      const newId = `app-${Date.now()}`;
      // 寫入到 invitations 集合，讓業者後台的「管理名單」可以讀取到
      const invRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', newId);
      
      await setDoc(invRef, {
        id: newId,
        type: 'application', // 標記為「應徵」
        fromName: '林小美',  // 模擬當前創作者
        toName: applyJob?.business || '廠商',
        message: '您好，我對這個案源非常有興趣，這是我的履歷資料，期待有機會合作！',
        status: '待審核',
        date: new Date().toLocaleString('zh-TW', { hour12: false }),
        projectId: applyJob?.id,
        projectTitle: applyJob?.title,
        // 附帶創作者履歷快照 (模擬)
        creatorInfo: {
          name: '林小美',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
          followers: 12000,
          engagement: 4.5,
          tags: ['旅遊', '親子']
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredOpportunities.map(job => (
            <div 
              key={job.id} 
              onClick={() => {
                setViewJob(job);
                setActiveImage(job.image || ''); 
              }} 
              className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group cursor-pointer h-full relative"
            >
              
              {job.matchScore && job.matchScore >= 90 && (
                <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-in fade-in zoom-in">
                  <Sparkles size={12} fill="currentColor" />
                  {job.matchScore}% 適合你
                </div>
              )}

              <div className="sm:w-2/5 relative h-56 sm:h-auto overflow-hidden">
                 <img 
                    src={job.image}
                    alt={job.title || job.business}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                 />
                 <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur-md ${
                      job.type === '付費推廣' ? 'bg-amber-100/90 text-amber-800' : 'bg-white/90 text-indigo-800'
                    }`}>
                      {job.type}
                    </span>
                 </div>
                 
                 {job.spotsLeft !== undefined && job.spotsLeft <= 3 && (
                   <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                      <div className="flex items-center gap-1 text-red-400 text-xs font-bold animate-pulse">
                        <Flame size={14} fill="currentColor" />
                        只剩 {job.spotsLeft} 個名額
                      </div>
                   </div>
                 )}
              </div>

              <div className="sm:w-3/5 p-5 flex flex-col">
                 <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <MapPin size={14} />
                      {job.location}
                    </div>
                    <div className="text-slate-300">
                      {job.category === '住宿' && <Hotel size={16} />}
                      {job.category === '餐飲' && <Utensils size={16} />}
                      {job.category === '體驗' && <Tent size={16} />}
                    </div>
                 </div>

                 <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                   {job.title}
                 </h3>
                 <p className="text-xs text-slate-400 mb-3 font-medium flex items-center gap-1">
                   <Building2 size={12} /> {job.business}
                 </p>
                 
                 <div className="mb-4 space-y-3 flex-grow">
                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <div className="flex items-center justify-between mb-1">
                       <p className="text-xs text-slate-500 font-medium">總價值</p>
                       <p className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 rounded">{job.totalValue}</p>
                     </div>
                     <p className="text-xs text-slate-500 line-clamp-1 border-t border-slate-200 pt-1 mt-1">
                       {job.valueBreakdown}
                     </p>
                   </div>

                   <div className="flex items-start gap-2.5 px-1">
                     <div className="text-slate-400 mt-0.5">
                       <Camera className="w-3.5 h-3.5" />
                     </div>
                     <div>
                        <p className="text-xs text-slate-500 mb-0.5">合作需求</p>
                        <p className="text-sm font-medium text-slate-700 line-clamp-2">{job.requirements}</p>
                     </div>
                   </div>
                 </div>

                 <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users size={14} />
                      已應徵 {job.applicants || 0} 人
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // 避免觸發卡片點擊
                        handleQuickApply(job);
                      }}
                      className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all hover:shadow-md hover:scale-105 active:scale-95 group/btn"
                    >
                      <Zap size={14} className="fill-yellow-400 text-yellow-400 group-hover/btn:animate-pulse" />
                      快速應徵
                    </button>
                 </div>
              </div>
            </div>
          ))}
          
          {filteredOpportunities.length === 0 && (
            <div className="col-span-1 lg:col-span-2 text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Filter className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">目前暫無案源或正在更新中</p>
              <button 
                onClick={() => setCategoryFilter('全部')}
                className="mt-2 text-sm text-indigo-600 font-bold hover:underline"
              >
                查看所有分類
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- 詳情頁面視窗 (Job Details Modal) --- */}
      {viewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-bottom-5 duration-300 relative">
            
            {/* Header Image / Gallery */}
            <div className="relative h-64 sm:h-72 shrink-0 bg-slate-200">
               <img 
                 src={activeImage} 
                 className="w-full h-full object-cover transition-opacity duration-300" 
                 alt={viewJob.business} 
               />
               <button 
                 onClick={() => setViewJob(null)}
                 className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"
               >
                 <X size={20} />
               </button>
               {viewJob.gallery && viewJob.gallery.length > 0 && (
                 <div className="absolute bottom-4 left-4 flex gap-2 overflow-x-auto max-w-[calc(100%-2rem)]">
                   {[viewJob.image, ...viewJob.gallery].filter(Boolean).slice(0, 4).map((img, i) => (
                     <img 
                      key={i} 
                      src={img as string} 
                      onClick={() => setActiveImage(img as string)}
                      className={`w-16 h-12 object-cover rounded-md border-2 cursor-pointer transition-colors ${
                        activeImage === img ? 'border-indigo-500' : 'border-white/50 hover:border-white'
                      }`}
                      alt="Gallery" 
                     />
                   ))}
                 </div>
               )}
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 flex-grow bg-slate-50/50">
               <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                         viewJob.type === '付費推廣' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-50 text-indigo-700'
                       }`}>
                         {viewJob.type}
                       </span>
                       <span className="flex items-center gap-1 text-xs text-slate-500">
                         <MapPin size={12} /> {viewJob.location}
                       </span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{viewJob.title}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mb-4"><Building2 size={16}/> {viewJob.business}</p>
                    <div className="flex gap-2">
                      {viewJob.tags?.map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">#{tag}</span>
                      ))}
                    </div>
                 </div>
                 <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 mb-1">合作總價值</p>
                    <p className="text-2xl font-bold text-indigo-600">{viewJob.totalValue}</p>
                 </div>
               </div>

               {/* Description */}
               <div className="mb-8">
                 <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                   <Info size={18} className="text-indigo-500"/> 關於合作與商家
                 </h3>
                 <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                   {viewJob.description}
                 </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Value Breakdown */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                     <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                       <DollarSign size={16} className="text-green-600"/> 互惠價值詳情
                     </h4>
                     <ul className="space-y-2 text-sm text-slate-600">
                       {viewJob.valueBreakdown.split('+').map((item, i) => (
                         <li key={i} className="flex items-start gap-2">
                           <CheckCircle2 size={14} className="text-green-500 mt-1 shrink-0"/>
                           <span>{item.trim()}</span>
                         </li>
                       ))}
                     </ul>
                  </div>

                  {/* Requirements */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                     <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                       <Camera size={16} className="text-blue-600"/> 內容需求
                     </h4>
                     <p className="text-sm text-slate-600 mb-3">{viewJob.requirements}</p>
                     <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-200">
                       <Users size={14}/>
                       <span>目前已有 {viewJob.applicants || 0} 人應徵 / 剩餘 {viewJob.spotsLeft !== undefined ? viewJob.spotsLeft : 5} 個名額</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 sticky bottom-0 flex justify-between items-center gap-4">
               <div className="sm:hidden">
                  <p className="text-xs text-slate-500">總價值</p>
                  <p className="text-xl font-bold text-indigo-600">{viewJob.totalValue}</p>
               </div>
               <div className="flex gap-3 w-full sm:w-auto ml-auto">
                 <button 
                   onClick={() => setViewJob(null)}
                   className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50"
                 >
                   再看看
                 </button>
                 <button 
                   onClick={() => handleQuickApply(viewJob)}
                   className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                 >
                   <Zap size={16} className="fill-yellow-400 text-yellow-400" />
                   立即應徵
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 快速應徵視窗 (Quick Apply Modal) --- */}
      {applyJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            {isSuccess ? (
              <div className="p-8 text-center bg-slate-50">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in spin-in-180 duration-500">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">應徵已送出！</h3>
                <p className="text-slate-500 text-sm">
                  廠商將會收到您的 Media Kit，<br/>並透過站內訊息與您聯繫。
                </p>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">確認快速應徵</h3>
                  <button onClick={() => setApplyJob(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <img src={applyJob.image} className="w-16 h-16 rounded-lg object-cover" alt={applyJob.title} />
                  <div>
                    <p className="font-bold text-slate-900 line-clamp-1">{applyJob.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                       <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">{applyJob.category}</span>
                       <span className="font-bold text-indigo-600">{applyJob.totalValue}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex gap-3 text-sm text-slate-600">
                    <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                    <p>系統將自動發送您的 <span className="font-bold text-slate-900">預設履歷 (Media Kit)</span></p>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-600">
                    <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                    <p>同意授權廠商查看您的 <span className="font-bold text-slate-900">歷史合作評價</span></p>
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