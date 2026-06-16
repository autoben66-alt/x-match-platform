'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Trophy, Flame, ChevronDown, Award, X, MapPin, Instagram, Youtube, BarChart3, Users, User, DollarSign, Camera, Mail, CheckCircle2, Filter, Crown, Sparkles, Loader2, MessageCircle, Send, Briefcase, Eye, Star, Lock, AlertCircle, LogIn, Link as LinkIcon 
} from 'lucide-react';

// --- 自定義 Link 元件 (解決預覽環境問題) ---
const Link = ({ href, children, className, ...props }: any) => {
  return (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
};

// --- 模擬 useRouter (解決預覽環境問題) ---
const useRouter = () => {
  return {
    push: (path: string) => console.log(`Navigating to ${path}`)
  };
};

// --- Firebase 核心引入 ---
import { initializeApp, getApps, getApp } from 'firebase/app';
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

// --- 內嵌 CreatorCard 元件與介面 ---

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
  tier?: string; // ✨ 新增分級
}

interface CreatorDetail extends Creator {
  completedJobs: number;
  rating: number;
  badges?: string[];
  rates: { post: string; story: string; reels: string; };
  audience: { gender: string; age: string; topCity: string; };
  portfolio: string[];     
  lineId?: string;
  socialLinks?: { ig?: string; yt?: string; tiktok?: string; other?: string; }; // ✨ 新增社群連結
}

// ✨ 網紅評級顯示標籤組件
const TierBadge = ({ tier }: { tier?: string }) => {
  if (!tier || tier === '未評級') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200">未評級</span>;
  }
  const colors: Record<string, string> = {
    'S': 'bg-gradient-to-r from-yellow-300 to-amber-500 text-slate-900 border-amber-300 shadow-sm',
    'A': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'B': 'bg-sky-100 text-sky-700 border-sky-200',
    'C': 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 w-fit ${colors[tier] || colors['C']}`}>
      {tier === 'S' && <Crown size={12} />} {tier} 級
    </span>
  );
};

const CreatorCard = ({ creator }: { creator: CreatorDetail }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full flex flex-col">
      {/* 封面圖區域 */}
      <div className="h-40 bg-slate-100 relative overflow-hidden">
        {creator.coverImage && (
          <img 
            src={creator.coverImage} 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
            alt="cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
        {/* ✨ 右上角顯示評級 */}
        <div className="absolute top-3 right-3">
          <TierBadge tier={creator.tier} />
        </div>
      </div>
      
      <div className="px-6 pb-6 pt-0 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
           <div className="-mt-10 relative">
             <img 
               src={creator.avatar} 
               alt={creator.name} 
               className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-white object-cover" 
             />
           </div>
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

interface ProjectMinimal {
  id: string;
  title: string;
  totalValue: string;
  requiredTier?: string; // ✨ 新增案源綁定的限制等級
}

// 模擬豐富資料 (含評級與社群連結)
const ENRICH_DATA = [
  {
    name: "林小美", handle: "@may_travel", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", lineId: "may_travel",
    tags: ["旅遊", "美食", "親子"], followers: 45000, engagement: 3.2, location: "台北市", tier: "A",
    bio: "專注於親子友善飯店與在地美食推廣，擁有高黏著度的社群。", 
    completedJobs: 42, rating: 5.0,
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 5,000", story: "NT$ 1,500", reels: "NT$ 8,000" },
    audience: { gender: "女性 85%", age: "25-34歲", topCity: "台北/新北" },
    portfolio: [ "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3" ],
    averageViews: 12500, completionScore: 5.0,
    socialLinks: { ig: 'https://instagram.com', yt: '', tiktok: '', other: '' }
  },
  {
    name: "Jason 攝影", handle: "@jason_shot", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jason", lineId: "jason_shot",
    tags: ["攝影", "戶外", "衝浪"], followers: 120000, engagement: 4.5, location: "墾丁", tier: "S",
    bio: "專業戶外攝影師，擅長用影像說故事，曾與多個國際戶外品牌合作。", 
    completedJobs: 85, rating: 5.0,
    coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 12,000", story: "NT$ 3,000", reels: "NT$ 25,000" },
    audience: { gender: "男性 60%", age: "18-34歲", topCity: "台中/高雄" },
    portfolio: [ "https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3" ],
    averageViews: 45000, completionScore: 5.0,
    socialLinks: { ig: 'https://instagram.com', yt: 'https://youtube.com', tiktok: '', other: 'https://behance.net' }
  },
  {
    name: "食尚艾莉", handle: "@elly_eats", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elly", lineId: "elly_eats",
    tags: ["咖啡廳", "生活風格"], followers: 28000, engagement: 5.1, location: "台南市", tier: "B",
    bio: "喜歡挖掘巷弄裡的小店，照片風格清新明亮，粉絲以年輕女性為主。", 
    completedJobs: 63, rating: 5.0,
    coverImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 3,500", story: "NT$ 1,000", reels: "NT$ 5,000" },
    audience: { gender: "女性 90%", age: "18-24歲", topCity: "台南/高雄" },
    portfolio: [ "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3" ],
    averageViews: 8500, completionScore: 5.0,
    socialLinks: { ig: 'https://instagram.com', yt: '', tiktok: 'https://tiktok.com', other: '' }
  }
];

export default function CreatorsPage() {
  const router = useRouter(); 
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [locationFilter, setLocationFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'followers' | 'views' | 'score'>('relevance');
  
  const [selectedCreator, setSelectedCreator] = useState<CreatorDetail | null>(null); 
  const [creators, setCreators] = useState<CreatorDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 業者會員狀態與權限控管 (Provider State) ---
  const [providerPlan, setProviderPlan] = useState<'guest' | 'free' | 'pro'>('guest');
  const [isProviderLoggedIn, setIsProviderLoggedIn] = useState(false); // 登入狀態
  const [isVerifying, setIsVerifying] = useState(false); // 登入驗證中

  // Modal 狀態
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // 登入提示
  const [showUpgradeModal, setShowUpgradeModal] = useState(false); // 升級提示 (Pro Only)
  
  const [inviteMessage, setInviteMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // 廠商案源清單
  const [projects, setProjects] = useState<ProjectMinimal[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    // ✨ 建立預設展示資料 (Fallback Data)
    const fallbackCreators: CreatorDetail[] = ENRICH_DATA.map((enrich, index) => ({
      id: 'fallback-' + index,
      name: enrich.name,
      handle: enrich.handle,
      lineId: enrich.lineId,
      avatar: enrich.avatar,
      location: enrich.location,
      bio: enrich.bio,
      followers: enrich.followers,
      engagement: enrich.engagement,
      completedJobs: enrich.completedJobs,
      rating: enrich.rating,
      coverImage: enrich.coverImage,
      portfolio: enrich.portfolio,
      audience: enrich.audience,
      rates: enrich.rates,
      tier: enrich.tier, // ✨ 寫入假資料的評級
      socialLinks: enrich.socialLinks, // ✨ 寫入社群連結
      tags: ['👑 創始會員', ...enrich.tags],
      badges: ['創始會員', '官方認證'],
      averageViews: enrich.averageViews,
      completionScore: enrich.completionScore
    }));

    if (!db) { 
      setCreators(fallbackCreators); // 填入展示資料
      setIsLoading(false); 
      return; 
    }

    // 監聽創作者
    const usersCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'users');
    const unsubscribeUsers = onSnapshot(usersCol, (snapshot) => {
      if (!snapshot.empty) {
        const creatorUsers = snapshot.docs.map(doc => doc.data()).filter(u => u.role === '創作者');
        
        if (creatorUsers.length > 0) {
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
                tier: u.tier || enrich.tier || '未評級', // ✨ 抓取資料庫評級
                socialLinks: u.socialLinks || enrich.socialLinks, // ✨ 抓取社群連結
                tags: isFounder ? ['👑 創始會員', ...(u.tags || enrich.tags)] : (u.tags || enrich.tags),
                badges: isFounder ? ['創始會員', '官方認證'] : ['官方認證'],
                averageViews: u.averageViews || enrich.averageViews || 5000,
                completionScore: u.completionScore || enrich.completionScore || 5.0
              };
            });
            setCreators(mappedCreators);
        } else {
            setCreators(fallbackCreators);
        }
      } else {
        setCreators(fallbackCreators);
      }
      setIsLoading(false); 
    }, (error) => {
      console.error("Firebase 讀取錯誤:", error);
      setCreators(fallbackCreators);
      setIsLoading(false);
    });

    // 監聽廠商自己的案源
    const projectsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'projects');
    const unsubscribeProjects = onSnapshot(projectsCol, (snapshot) => {
      if (!snapshot.empty) {
        setProjects(snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.id,
            title: data.title,
            totalValue: data.totalValue,
            requiredTier: data.requiredTier || '無限制' // ✨ 抓取該案源是否為 S 級
          } as ProjectMinimal;
        }));
      }
    }, (error) => {
      console.error("Firebase 專案讀取錯誤:", error);
    });

    return () => { unsubscribeUsers(); unsubscribeProjects(); };
  }, []);

  const topCreators = [...creators].sort((a, b) => b.completedJobs - a.completedJobs).slice(0, 3);
  
  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) || creator.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '全部' || creator.tags.some(tag => tag.includes(categoryFilter));
    const matchesLocation = locationFilter === '全部' || creator.location.includes(locationFilter);
    return matchesSearch && matchesCategory && matchesLocation;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'followers': return b.followers - a.followers;
      case 'views': return (b.averageViews || 0) - (a.averageViews || 0);
      case 'score': return (b.completionScore || 0) - (a.completionScore || 0);
      default: return 0;
    }
  });

  const categories = [ { id: '全部', label: '全部' }, { id: '旅遊', label: '旅遊 Travel' }, { id: '美食', label: '美食 Foodie' }, { id: '親子', label: '親子 Family' }, { id: '攝影', label: '攝影 Photography' } ];
  const availableLocations = ['全部', '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '墾丁', '宜蘭縣', '花蓮縣']; 
  
  const founderCount = creators.length;
  const founderMax = 50;
  const founderPercentage = Math.min((founderCount / founderMax) * 100, 100);

  // --- 執行登入 (模擬後台驗證) ---
  const handleLogin = () => {
    setIsVerifying(true);
    
    setTimeout(() => {
        setIsVerifying(false);
        setIsProviderLoggedIn(true);
        setShowAuthModal(false);
        // 隨機模擬：50% 機率是付費版，50% 是免費版
        const isPaidMember = Math.random() > 0.5; 
        setProviderPlan(isPaidMember ? 'pro' : 'free');
    }, 1200);
  };

  // --- 處理「LINE 聯繫」點擊 (權限檢查: 必須登入且為 Pro) ---
  const handleLineContact = (e: React.MouseEvent) => {
    e.preventDefault(); 

    if (!isProviderLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    if (providerPlan !== 'pro') {
      setShowUpgradeModal(true); // 跳出升級提示
      return;
    }

    if (selectedCreator) {
      const lineUrl = `https://line.me/ti/p/~${selectedCreator.lineId || selectedCreator.handle.replace('@', '')}`;
      window.open(lineUrl, '_blank');
    }
  };

  const handleOpenInvite = () => {
    if (!isProviderLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    
    setInviteMessage(`哈囉 ${selectedCreator?.name}！\n\n我們是 [您的店家名稱]，非常喜歡您的創作風格！\n\n在此誠摯邀請您參與我們的合作案源，希望能有互惠合作的機會。\n\n詳細合作內容可以再一起討論，期待您的回覆！`);
    setSelectedProjectId('');
    setShowInviteModal(true);
    setSendSuccess(false);
  };

  const confirmSendInvite = async () => {
    if (!db) { alert("尚未連線至資料庫，請稍候再試。"); return; }
    setIsSending(true);

    try {
      const newId = `inv-${Date.now()}`;
      const invRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', newId);
      const proj = projects.find(p => p.id === selectedProjectId);
      
      await setDoc(invRef, {
        id: newId,
        fromName: '海角七號民宿', 
        toName: selectedCreator?.name || '創作者',
        toHandle: selectedCreator?.handle || '',
        toAvatar: selectedCreator?.avatar || '',
        message: inviteMessage,
        status: '待回覆',
        date: new Date().toLocaleString('zh-TW', { hour12: false }),
        projectId: proj?.id || '',
        projectTitle: proj?.title || '',
        projectValue: proj?.totalValue || '',
        type: 'invite',
        creatorInfo: { 
          name: selectedCreator?.name,
          avatar: selectedCreator?.avatar,
          followers: selectedCreator?.followers,
          averageViews: selectedCreator?.averageViews,
          completionScore: selectedCreator?.completionScore,
          tags: selectedCreator?.tags,
          lineId: selectedCreator?.lineId,
          tier: selectedCreator?.tier // 夾帶評級資訊
        }
      });

      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => setShowInviteModal(false), 2000);
    } catch (error) {
      console.error("發送邀請失敗:", error);
      alert("發送失敗，請確認網路連線與資料庫權限。");
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      
      {/* 🚀 Growth Hacking Banner */}
      <div className="bg-slate-900 pt-8 pb-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 rounded-2xl p-1 shadow-2xl relative overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] animate-[shimmer_3s_infinite]"></div>
            <div className="bg-slate-900/40 backdrop-blur-md rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 justify-between relative z-10">
              <div className="flex items-center gap-5 text-center md:text-left">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                  <Crown className="w-8 h-8 text-yellow-300 fill-yellow-300 drop-shadow-md" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-1 tracking-wide flex items-center justify-center md:justify-start gap-2">
                    前 50 名駐站創作者 限量招募中！ <Sparkles className="text-yellow-300 w-5 h-5 animate-pulse" />
                  </h3>
                  <p className="text-amber-50 text-sm font-medium leading-relaxed">
                    現在加入即獲「<span className="text-yellow-300 font-bold">創始會員徽章</span>」，解鎖<span className="text-yellow-300 font-bold border-b border-yellow-300/50 pb-0.5 mx-1">終身免平台手續費</span>及首頁專屬推薦版位！
                  </p>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-72 text-center md:text-right">
                <div className="inline-flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full text-white mb-3 border border-white/10">
                   <Users size={16} className="text-amber-300"/>
                   <span className="text-sm font-bold tracking-widest">目前加入：{founderCount} / {founderMax}</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2.5 shadow-inner border border-white/5 mb-2">
                  <div className="bg-gradient-to-r from-yellow-300 to-amber-400 h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(252,211,77,0.8)]" style={{ width: `${founderPercentage}%` }}></div>
                </div>
                <p className="text-[10px] text-white/60 mt-2 tracking-widest uppercase mb-4 md:mb-1">名額倒數，額滿即止</p>
                <Link href="/dashboard" className="block w-full py-3 bg-gradient-to-r from-yellow-300 to-amber-400 text-slate-900 font-black text-sm rounded-xl shadow-[0_0_15px_rgba(252,211,77,0.4)] hover:shadow-[0_0_25px_rgba(252,211,77,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Sparkles size={16} className="fill-slate-900" /> 立即卡位加入創作者
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Provider Status Display (僅在登入後顯示) */}
        {isProviderLoggedIn && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex justify-end">
                <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-right-5">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">會員身份</span>
                        <span className={`font-bold text-sm flex items-center gap-1 ${providerPlan === 'pro' ? 'text-amber-400' : 'text-slate-200'}`}>
                            {providerPlan === 'pro' ? <><Crown size={14} fill="currentColor"/> 專業版 Pro</> : '免費版 Starter'}
                        </span>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* 🏆 Leaderboard Section */}
      {topCreators.length > 0 && (
        <div className="bg-white border-b border-slate-200 pt-12 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Trophy className="text-amber-500 fill-amber-500" />
                <h2 className="text-2xl font-bold text-slate-900">本月熱門接單王</h2>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Live Sync
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topCreators.map((creator, index) => (
                <div key={`top-${creator.id}`} onClick={() => setSelectedCreator(creator)} className={`relative bg-white rounded-xl p-6 border transition-transform hover:-translate-y-1 cursor-pointer ${index === 0 ? 'border-amber-400 shadow-amber-100 shadow-lg ring-1 ring-amber-100' : index === 1 ? 'border-slate-300 shadow-sm' : 'border-orange-200 shadow-sm'}`}>
                  <div className={`absolute -top-4 left-6 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-600'}`}>{index + 1}</div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={creator.avatar} alt={creator.name} className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover" />
                      {index === 0 && <div className="absolute -bottom-1 -right-1 bg-amber-100 text-amber-700 p-1 rounded-full"><Trophy size={12} fill="currentColor"/></div>}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-bold text-slate-900">{creator.name}</h3>
                        {/* ✨ 排行榜顯示評級 */}
                        <TierBadge tier={creator.tier} />
                      </div>
                      <p className="text-xs text-slate-500 mb-1">已完成 {creator.completedJobs} 筆合作</p>
                      <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                        <Star size={10} className="fill-current text-green-600" /> {creator.completionScore} 信用評分
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div><h1 className="text-3xl font-bold text-slate-900 mb-2">尋找優質創作者</h1><p className="text-slate-600">透過精準篩選，找到最適合您品牌風格的合作夥伴。</p></div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 sticky top-20 z-40">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              
              {/* 關鍵字搜尋 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="搜尋網紅名稱或關鍵字..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all hover:bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              
              {/* 地區篩選下拉 */}
              <div className="relative min-w-[140px]">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-9 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer hover:bg-white transition-colors" 
                  value={locationFilter} 
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  {availableLocations.map(loc => (
                    <option key={loc} value={loc}>{loc === '全部' ? '所有地區' : loc}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>

              {/* 分類按鈕 */}
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar items-center">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setCategoryFilter(cat.id)} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${categoryFilter === cat.id ? 'bg-sky-500 text-white shadow-md shadow-sky-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{cat.label}</button>
                ))}
              </div>
            </div>
            
            {/* 排序 */}
            <div className="flex items-center gap-2 lg:border-l border-slate-200 lg:pl-4 pt-4 lg:pt-0 border-t lg:border-t-0">
              <span className="text-sm text-slate-500 whitespace-nowrap">排序：</span>
              <div className="relative w-full lg:w-auto">
                <select 
                  className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer hover:bg-slate-50" 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="relevance">綜合推薦</option>
                  <option value="followers">粉絲數 (高到低)</option>
                  <option value="views">平均觀看數 (高到低)</option>
                  <option value="score">完案信用評分 (高到低)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400"><Loader2 className="w-10 h-10 animate-spin mb-4 text-sky-500" /><p className="font-medium tracking-widest uppercase text-xs">正在同步創作者資料...</p></div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Filter className="text-slate-400 w-8 h-8" /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">沒有找到符合條件的創作者</h3>
            <p className="text-slate-500 text-sm mb-6">嘗試更換關鍵字、放寬地區或是選擇其他分類。</p>
            <button 
              onClick={() => {
                setSearchTerm(''); 
                setCategoryFilter('全部');
                setLocationFilter('全部'); // 重置地區
              }} 
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md active:scale-95"
            >
              清除所有篩選
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
            {filteredCreators.map(creator => (
              <div key={creator.id} onClick={() => setSelectedCreator(creator)}>
                <CreatorCard creator={{
                  ...creator, 
                  averageViews: creator.averageViews, 
                  completionScore: creator.completionScore
                }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Creator Details Modal (創作者詳情視窗) --- */}
      {selectedCreator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-bottom-5 duration-300 relative">
            
            {/* Close Button */}
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
                     <TierBadge tier={selectedCreator.tier} />
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
                  <TierBadge tier={selectedCreator.tier} />
                </h2>
                <p className="font-medium text-slate-500">{selectedCreator.handle}</p>
              </div>

              {/* Profile Basic Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-6">
                <div className="w-full sm:w-auto">
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1 font-medium"><MapPin size={14}/> {selectedCreator.location}</span>
                    <span className="text-slate-300">|</span>
                    {selectedCreator.tags.filter(t => !t.includes('創始會員')).map(tag => (
                      <span key={tag} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">#{tag}</span>
                    ))}
                  </div>
                  
                  {/* ✨ 社群連結展示 */}
                  {selectedCreator.socialLinks && (
                    <div className="flex items-center gap-3 mt-3">
                      {selectedCreator.socialLinks.ig && <a href={selectedCreator.socialLinks.ig} target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-700 bg-pink-50 p-1.5 rounded-lg transition-colors"><Instagram size={18}/></a>}
                      {selectedCreator.socialLinks.yt && <a href={selectedCreator.socialLinks.yt} target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition-colors"><Youtube size={18}/></a>}
                      {selectedCreator.socialLinks.other && <a href={selectedCreator.socialLinks.other} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-900 bg-slate-100 p-1.5 rounded-lg transition-colors"><LinkIcon size={18}/></a>}
                    </div>
                  )}
                </div>

                {/* 指標展示卡片 */}
                <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar mt-4 sm:mt-0">
                  <div className="flex-1 sm:flex-none text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[100px]">
                    <p className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">粉絲數</p>
                    <p className="text-2xl font-black text-slate-900">{(selectedCreator.followers/1000).toFixed(1)}k</p>
                  </div>
                  <div className="flex-1 sm:flex-none text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[100px]">
                    <p className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">平均觀看</p>
                    <p className="text-2xl font-black text-green-500">{(selectedCreator.averageViews ? (selectedCreator.averageViews/1000).toFixed(1) + 'k' : 'N/A')}</p>
                  </div>
                  <div className="flex-1 sm:flex-none text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[100px]">
                    <p className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">完案信用</p>
                    <p className="text-2xl font-black text-indigo-600 flex items-center justify-center gap-1">
                        {selectedCreator.completionScore || '5.0'} <Star size={16} className="fill-yellow-400 text-yellow-400"/>
                    </p>
                  </div>
                </div>
              </div>

              {/* Founder Badge Highlights */}
              {selectedCreator.badges?.includes('創始會員') && (
                <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-100 rounded-2xl flex items-center gap-4 shadow-inner">
                   <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2.5 rounded-xl shadow-md">
                     <Award className="text-white w-6 h-6" />
                   </div>
                   <div>
                     <h4 className="font-bold text-orange-900 text-sm">官方認證創始會員</h4>
                     <p className="text-xs text-orange-700 mt-0.5">身為平台前 50 名入駐創作者，享有信譽加成與推薦優先權。</p>
                   </div>
                </div>
              )}

              {/* Bio */}
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
                    <DollarSign size={18} className="text-green-500"/> 合作參考報價
                  </h4>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><Camera size={14} className="text-slate-400"/> 圖文貼文</span>
                      <span className="font-black text-slate-800 bg-slate-50 px-2 py-1 rounded">NT$ {selectedCreator.rates?.post?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-slate-400"></div> 限時動態</span>
                      <span className="font-black text-slate-800 bg-slate-50 px-2 py-1 rounded">NT$ {selectedCreator.rates?.story?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><div className="w-3 h-3 bg-slate-400 rounded-sm"></div> Reels 短影音</span>
                      <span className="font-black text-slate-800 bg-slate-50 px-2 py-1 rounded">NT$ {selectedCreator.rates?.reels?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-4 tracking-widest uppercase">近期作品 (Portfolio)</h3>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {selectedCreator.portfolio?.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer">
                      <img src={img} className="w-full h-full object-cover" alt="Portfolio" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 bg-white sticky bottom-0 flex justify-end items-center z-20">
               <div className="flex gap-3 w-full sm:w-auto">
                 {/* ✨ LINE 聯繫按鈕 (防跳島付費牆) */}
                 {providerPlan === 'pro' ? (
                    <button 
                      onClick={handleLineContact}
                      className="flex-1 sm:flex-none px-6 py-3.5 bg-[#06C755] text-white font-bold rounded-xl hover:bg-[#05b34c] shadow-lg shadow-green-200/50 flex items-center justify-center gap-2 active:scale-95 transition-all whitespace-nowrap"
                    >
                      <MessageCircle size={18} /> LINE 聯繫
                    </button>
                 ) : (
                    <button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all whitespace-nowrap"
                    >
                      <Lock size={16} /> 升級 Pro 解鎖聯繫方式
                    </button>
                 )}
                 
                 <button 
                   onClick={handleOpenInvite}
                   className="flex-1 sm:flex-none px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-all whitespace-nowrap"
                 >
                   <Mail size={18} /> 發送合作邀請
                 </button>
               </div>
            </div>

          </div>
        </div>
      )}

      {/* --- 發送邀請視窗 (Direct Invite Modal) --- */}
      {showInviteModal && selectedCreator && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            {sendSuccess ? (
              <div className="p-8 text-center bg-slate-50">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in spin-in-180 duration-500">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">邀請已成功送出！</h3>
                <p className="text-slate-500 text-sm">
                  {selectedCreator.name} 將會收到您的合作邀請，<br/>並透過站內訊息或 LINE 與您聯繫。
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">發送合作邀請</h3>
                    <p className="text-xs text-slate-500">給 {selectedCreator.name}</p>
                  </div>
                  <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6">
                  {/* Creator Summary */}
                  <div className="flex items-center gap-3 mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <img src={selectedCreator.avatar} className="w-12 h-12 rounded-full border border-white shadow-sm" alt="avatar" />
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-indigo-900">{selectedCreator.name}</p>
                          <TierBadge tier={selectedCreator.tier} />
                       </div>
                       <p className="text-xs text-indigo-600 font-medium">{selectedCreator.handle}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* 選擇附帶案源下拉選單 */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <Briefcase size={16} className="text-indigo-600"/> 選擇附帶案源 (選填)
                      </label>
                      <select 
                        value={selectedProjectId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedProjectId(val);
                          const proj = projects.find(p => p.id === val);
                          if (proj) {
                            setInviteMessage(`哈囉 ${selectedCreator.name}！\n\n我們是 [您的店家名稱]，非常喜歡您的創作風格！\n\n在此誠摯邀請您參與我們的合作案源「${proj.title}」，希望能有互惠合作的機會。\n\n詳細合作內容可以再一起討論，期待您的回覆！`);
                          }
                        }}
                        className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors outline-none cursor-pointer"
                      >
                        <option value="">不附帶案源，直接發送訊息</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.totalValue})</option>
                        ))}
                      </select>
                      
                      {/* ✨ 越級邀請提示 */}
                      {selectedProjectId && projects.find(p => p.id === selectedProjectId)?.requiredTier === 'S' && selectedCreator.tier !== 'S' && (
                        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-xl text-xs mt-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                          <p className="font-bold mb-1 flex items-center gap-1"><AlertCircle size={14} className="text-orange-500"/> 越級邀請提示</p>
                          您選擇的案源為 <b>S 級優先</b>，而該創作者目前為 <b>{selectedCreator.tier || '未評級'}</b>。<br/>
                          系統將提示創作者必須附上「加碼提案」才能接受此合作。
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        邀請訊息內容
                      </label>
                      <textarea 
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        className="w-full h-40 p-4 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium leading-relaxed bg-slate-50 focus:bg-white transition-colors outline-none"
                        placeholder="請撰寫您的邀請內容..."
                      ></textarea>
                      <p className="text-xs text-slate-400 mt-2 text-right font-medium">建議主動說明您能提供的互惠內容與條件</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                  <button 
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-white transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={confirmSendInvite}
                    disabled={isSending}
                    className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                    {isSending ? '發送中...' : '確認發送'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Auth/Login Modal (身分驗證) --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 relative scale-100 animate-in zoom-in-95">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                 <X size={24} />
              </button>
              
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={32} className="text-indigo-600"/>
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">請先登入業者帳號</h2>
                 <p className="text-slate-500 text-sm">登入後系統將自動驗證您的會員身份與權限。</p>
              </div>

              <button 
                onClick={handleLogin}
                disabled={isVerifying}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> 驗證身份中...
                    </>
                ) : (
                    <>
                      <LogIn size={18} /> 立即登入
                    </>
                )}
              </button>
              
              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                 <p className="text-xs text-slate-400">
                    還沒有帳號？ <a href="#" className="text-indigo-600 font-bold hover:underline">免費註冊</a>
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* --- Upgrade Alert Modal (Pro Only Feature) --- */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center scale-100 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Lock size={32} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">付費會員專屬功能</h2>
              <p className="text-slate-500 text-sm mb-6">
                 「直接查看網紅 LINE 聯繫方式」為專業版 (Pro) 專屬功能。<br/>升級後即可與所有頂尖創作者零距離洽談！
              </p>
              
              <div className="space-y-3">
                 <button 
                   onClick={() => {
                       setProviderPlan('pro'); // 模擬升級
                       setShowUpgradeModal(false);
                   }}
                   className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                 >
                   <Sparkles size={18} fill="currentColor"/> 立即升級解鎖
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