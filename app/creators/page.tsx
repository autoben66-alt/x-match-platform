'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; 
import { useRouter } from 'next/navigation'; 
import CreatorCard, { Creator } from '@/components/CreatorCard';
import { Search, Trophy, Flame, ChevronDown, Award, X, MapPin, Instagram, Youtube, BarChart3, Users, User, DollarSign, Camera, Mail, CheckCircle2, Filter, Crown, Sparkles, Loader2, MessageCircle, Send, Briefcase } from 'lucide-react';

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

interface CreatorDetail extends Creator {
  completedJobs: number;
  rating: number;
  badges?: string[];
  coverImage: string;      
  rates: { post: string; story: string; reels: string; };
  audience: { gender: string; age: string; topCity: string; };
  portfolio: string[];     
  lineId?: string;
}

interface ProjectMinimal {
  id: string;
  title: string;
  totalValue: string;
}

const ENRICH_DATA = [
  {
    name: "林小美", handle: "@may_travel", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", lineId: "may_travel",
    tags: ["旅遊", "美食", "親子"], followers: 45000, engagement: 3.2, location: "台北市",
    bio: "專注於親子友善飯店與在地美食推廣，擁有高黏著度的社群。", completedJobs: 42, rating: 4.9,
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 5,000", story: "NT$ 1,500", reels: "NT$ 8,000" },
    audience: { gender: "女性 85%", age: "25-34歲", topCity: "台北/新北" },
    portfolio: [ "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3" ]
  },
  {
    name: "Jason 攝影", handle: "@jason_shot", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jason", lineId: "jason_shot",
    tags: ["攝影", "戶外", "衝浪"], followers: 120000, engagement: 4.5, location: "墾丁",
    bio: "專業戶外攝影師，擅長用影像說故事，曾與多個國際戶外品牌合作。", completedJobs: 85, rating: 5.0,
    coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 12,000", story: "NT$ 3,000", reels: "NT$ 25,000" },
    audience: { gender: "男性 60%", age: "18-34歲", topCity: "台中/高雄" },
    portfolio: [ "https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3" ]
  }
];

export default function CreatorsPage() {
  const router = useRouter(); 
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'followers' | 'jobs' | 'engagement'>('relevance');
  
  const [selectedCreator, setSelectedCreator] = useState<CreatorDetail | null>(null); 
  const [creators, setCreators] = useState<CreatorDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 發送邀請相關狀態
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // 廠商案源清單 (用於下拉選單)
  const [projects, setProjects] = useState<ProjectMinimal[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (!db) { 
      setIsLoading(false); 
      return; 
    }

    // 監聽創作者
    const usersCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'users');
    const unsubscribeUsers = onSnapshot(usersCol, (snapshot) => {
      if (!snapshot.empty) {
        const creatorUsers = snapshot.docs.map(doc => doc.data()).filter(u => u.role === '創作者');
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
          };
        });
        setCreators(mappedCreators);
      } else {
        setCreators([]);
      }
      setIsLoading(false);
    });

    // 監聽廠商自己的案源 (提供下拉選單選擇)
    const projectsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'projects');
    const unsubscribeProjects = onSnapshot(projectsCol, (snapshot) => {
      if (!snapshot.empty) {
        setProjects(snapshot.docs.map(doc => doc.data() as ProjectMinimal));
      }
    });

    return () => { unsubscribeUsers(); unsubscribeProjects(); };
  }, []);

  const topCreators = [...creators].sort((a, b) => b.completedJobs - a.completedJobs).slice(0, 3);
  
  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) || creator.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '全部' || creator.tags.some(tag => tag.includes(categoryFilter));
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'followers': return b.followers - a.followers;
      case 'jobs': return b.completedJobs - a.completedJobs;
      case 'engagement': return b.engagement - a.engagement;
      default: return 0;
    }
  });

  const categories = [ { id: '全部', label: '全部' }, { id: '旅遊', label: '旅遊 Travel' }, { id: '美食', label: '美食 Foodie' }, { id: '親子', label: '親子 Family' }, { id: '攝影', label: '攝影 Photography' } ];
  const founderCount = creators.length;
  const founderMax = 50;
  const founderPercentage = Math.min((founderCount / founderMax) * 100, 100);

  // 開啟發送邀請 Modal
  const handleOpenInvite = () => {
    const simulateIsLoggedIn = true; 
    if (!simulateIsLoggedIn) {
      router.push('/dashboard');
      return;
    }
    setInviteMessage(`哈囉 ${selectedCreator?.name}！\n\n我們是 [您的店家名稱]，非常喜歡您的創作風格！\n\n在此誠摯邀請您來體驗我們的服務，希望能有互惠合作的機會。\n\n詳細合作內容可以再一起討論，期待您的回覆！`);
    setSelectedProjectId('');
    setShowInviteModal(true);
    setSendSuccess(false);
  };

  // 確認發送
  const confirmSendInvite = async () => {
    if (!db) { alert("尚未連線至資料庫，請稍候再試。"); return; }
    setIsSending(true);

    try {
      const newId = `inv-${Date.now()}`;
      const invRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', newId);
      const proj = projects.find(p => p.id === selectedProjectId);
      
      await setDoc(invRef, {
        id: newId,
        fromName: '海角七號民宿', // 模擬業者名稱
        toName: selectedCreator?.name || '創作者',
        toHandle: selectedCreator?.handle || '',
        toAvatar: selectedCreator?.avatar || '',
        message: inviteMessage,
        status: '待回覆',
        date: new Date().toLocaleString('zh-TW', { hour12: false }),
        projectId: proj?.id || '',
        projectTitle: proj?.title || '',
        projectValue: proj?.totalValue || ''
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
                      <h3 className="font-bold text-slate-900">{creator.name}</h3>
                      <p className="text-xs text-slate-500 mb-1">已完成 {creator.completedJobs} 筆合作</p>
                      <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                        <Flame size={10} fill="currentColor" /> {creator.engagement}% 互動率
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
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="搜尋網紅名稱..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setCategoryFilter(cat.id)} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${categoryFilter === cat.id ? 'bg-sky-500 text-white shadow-md shadow-sky-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{cat.label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="text-sm text-slate-500 hidden md:inline">排序：</span>
              <div className="relative">
                <select className="appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer hover:bg-slate-50" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                  <option value="relevance">綜合推薦</option>
                  <option value="followers">粉絲數 (高到低)</option>
                  <option value="jobs">接單數 (多到少)</option>
                  <option value="engagement">互動率 (高到低)</option>
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
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Filter className="text-slate-400" /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">沒有找到符合條件的創作者</h3>
            <button onClick={() => {setSearchTerm(''); setCategoryFilter('全部');}} className="mt-4 text-sky-600 font-bold hover:underline">清除所有篩選</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
            {filteredCreators.map(creator => (
              <div key={creator.id} onClick={() => setSelectedCreator(creator)}>
                <CreatorCard creator={creator} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Creator Details Modal --- */}
      {selectedCreator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-bottom-5 duration-300 relative">
            <button onClick={() => setSelectedCreator(null)} className="absolute top-4 right-4 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"><X size={20} /></button>
            
            <div className="relative h-48 sm:h-72 bg-slate-200 shrink-0">
              <img src={selectedCreator.coverImage} className="w-full h-full object-cover" alt="Cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute -bottom-10 left-6 sm:left-10 flex items-end gap-5">
                <div className="relative">
                  <img src={selectedCreator.avatar} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[5px] border-white bg-white shadow-xl object-cover" alt={selectedCreator.name} />
                  {selectedCreator.badges?.includes('創始會員') && (<div className="absolute -bottom-2 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white p-2 rounded-full shadow-lg border-2 border-white" title="創始會員"><Crown size={18} className="fill-current" /></div>)}
                </div>
                <div className="pb-12 text-white hidden sm:block">
                   <h2 className="text-3xl sm:text-4xl font-black mb-1 flex items-center gap-2">{selectedCreator.name} <CheckCircle2 size={28} className="text-sky-400 fill-sky-50" /></h2>
                   <p className="font-medium text-white/80 text-lg">{selectedCreator.handle}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-16 px-6 sm:px-10 pb-8 flex-grow bg-slate-50/50">
              <div className="sm:hidden mb-6">
                <h2 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">{selectedCreator.name} <CheckCircle2 size={20} className="text-sky-500 fill-sky-50" /></h2>
                <p className="font-medium text-slate-500">{selectedCreator.handle}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-6">
                <div className="w-full sm:w-auto">
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1 font-medium"><MapPin size={14}/> {selectedCreator.location}</span><span className="text-slate-300">|</span>
                    {selectedCreator.tags.filter(t => !t.includes('創始會員')).map(tag => (<span key={tag} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">#{tag}</span>))}
                  </div>
                  <div className="flex gap-3">
                    <button className="p-2.5 bg-white border border-slate-200 shadow-sm rounded-full text-pink-600 hover:bg-pink-50 transition-colors"><Instagram size={20}/></button>
                    <button className="p-2.5 bg-white border border-slate-200 shadow-sm rounded-full text-red-600 hover:bg-red-50 transition-colors"><Youtube size={20}/></button>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                  <div className="flex-1 sm:flex-none text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[100px]"><p className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">粉絲數</p><p className="text-2xl font-black text-slate-900">{(selectedCreator.followers/1000).toFixed(1)}k</p></div>
                  <div className="flex-1 sm:flex-none text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[100px]"><p className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">互動率</p><p className="text-2xl font-black text-green-500">{selectedCreator.engagement}%</p></div>
                  <div className="flex-1 sm:flex-none text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[100px]"><p className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">完成案件</p><p className="text-2xl font-black text-indigo-600">{selectedCreator.completedJobs}</p></div>
                </div>
              </div>
              
              <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 mb-3 tracking-widest uppercase flex items-center gap-2"><User size={16} className="text-sky-500" /> 關於我</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{selectedCreator.bio}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="font-black text-slate-900 mb-5 flex items-center gap-2 text-sm tracking-widest uppercase"><BarChart3 size={18} className="text-indigo-500"/> 受眾分析</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50"><span className="text-sm font-medium text-slate-500">性別分佈</span><span className="font-bold text-slate-800">{selectedCreator.audience.gender}</span></div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50"><span className="text-sm font-medium text-slate-500">主力年齡</span><span className="font-bold text-slate-800">{selectedCreator.audience.age}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-500">熱門城市</span><span className="font-bold text-slate-800">{selectedCreator.audience.topCity}</span></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <h4 className="font-black text-slate-900 mb-5 flex items-center gap-2 text-sm tracking-widest uppercase relative z-10"><DollarSign size={18} className="text-green-500"/> 參考報價</h4>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-600 flex items-center gap-2"><Camera size={14} className="text-slate-400"/> 圖文貼文</span><span className="font-black text-slate-800 bg-slate-50 px-2 py-1 rounded">{selectedCreator.rates.post}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-600 flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-slate-400"></div> 限時動態</span><span className="font-black text-slate-800 bg-slate-50 px-2 py-1 rounded">{selectedCreator.rates.story}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-600 flex items-center gap-2"><div className="w-3 h-3 bg-slate-400 rounded-sm"></div> Reels 短影音</span><span className="font-black text-slate-800 bg-slate-50 px-2 py-1 rounded">{selectedCreator.rates.reels}</span></div>
                  </div>
                </div>
              </div>
              
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
               <div className="hidden sm:block shrink-0">
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
                       <p className="font-bold text-indigo-900">{selectedCreator.name}</p>
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
                            // 動態修改邀請訊息
                            setInviteMessage(`哈囉 ${selectedCreator.name}！\n\n我們是 [您的店家名稱]，非常喜歡您的創作風格！\n\n在此誠摯邀請您參與我們的合作案源「${proj.title}」，希望能有互惠合作的機會。\n\n詳細合作內容可以再一起討論，期待您的回覆！`);
                          }
                        }}
                        className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors outline-none"
                      >
                        <option value="">不附帶案源，直接發送訊息</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.totalValue})</option>
                        ))}
                      </select>
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
    </div>
  );
}