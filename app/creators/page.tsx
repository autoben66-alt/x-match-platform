'use client';

import { useState } from 'react';
import CreatorCard, { Creator } from '@/components/CreatorCard';
import { Search, Trophy, Flame, ChevronDown, Award, X, MapPin, Instagram, Youtube, BarChart3, Users, DollarSign, Camera, Mail, CheckCircle2, Filter } from 'lucide-react';

// 擴充創作者資料結構，加入詳情頁所需的欄位
interface CreatorDetail extends Creator {
  completedJobs: number;
  rating: number;
  badges?: string[];
  coverImage: string;      // 個人頁封面
  rates: {                 // 參考報價
    post: string;
    story: string;
    reels: string;
  };
  audience: {              // 受眾數據
    gender: string;      
    age: string;
    topCity: string;
  };
  portfolio: string[];     // 作品集縮圖
}

// 模擬更多資料
const ALL_CREATORS: CreatorDetail[] = [
  {
    id: 1,
    name: "林小美",
    handle: "@may_travel",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    tags: ["旅遊", "美食", "親子"],
    followers: 45000,
    engagement: 3.2,
    location: "台北市",
    bio: "專注於親子友善飯店與在地美食推廣，擁有高黏著度的媽媽社群。",
    completedJobs: 42,
    rating: 4.9,
    badges: ['熱門'],
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 5,000", story: "NT$ 1,500", reels: "NT$ 8,000" },
    audience: { gender: "女性 85%", age: "25-34歲 (媽媽族群)", topCity: "台北/新北" },
    portfolio: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 2,
    name: "Jason 攝影",
    handle: "@jason_shot",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jason",
    tags: ["攝影", "戶外", "衝浪"],
    followers: 120000,
    engagement: 4.5,
    location: "墾丁",
    bio: "專業戶外攝影師，擅長用影像說故事，曾與多個國際戶外品牌合作。",
    completedJobs: 85,
    rating: 5.0,
    badges: ['金牌合作'],
    coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 12,000", story: "NT$ 3,000", reels: "NT$ 25,000" },
    audience: { gender: "男性 60%", age: "18-34歲 (戶外愛好者)", topCity: "台中/高雄" },
    portfolio: [
      "https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 3,
    name: "食尚艾莉",
    handle: "@elly_eats",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elly",
    tags: ["咖啡廳", "生活風格"],
    followers: 28000,
    engagement: 5.1,
    location: "台南市",
    bio: "喜歡挖掘巷弄裡的小店，照片風格清新明亮，粉絲以年輕女性為主。",
    completedJobs: 63,
    rating: 4.8,
    coverImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 3,500", story: "NT$ 1,000", reels: "NT$ 5,000" },
    audience: { gender: "女性 90%", age: "18-24歲 (學生/新鮮人)", topCity: "台南/高雄" },
    portfolio: [
      "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 4,
    name: "Outdoor 阿宏",
    handle: "@macro_out",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    tags: ["旅遊", "露營", "登山"],
    followers: 35000,
    engagement: 6.2,
    location: "台中市",
    bio: "週末就是要在山上度過，分享最真實的野營體驗與裝備開箱。",
    completedJobs: 15,
    rating: 4.7,
    badges: ['潛力新星'],
    coverImage: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 4,000", story: "NT$ 1,200", reels: "NT$ 6,000" },
    audience: { gender: "男性 70%", age: "25-44歲", topCity: "台中/台北" },
    portfolio: [
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 5,
    name: "親子樂園探險隊",
    handle: "@family_fun",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Baby",
    tags: ["親子", "樂園", "住宿"],
    followers: 58000,
    engagement: 4.0,
    location: "新北市",
    bio: "帶著兩個皮小孩玩遍全台灣，專找高 CP 值的親子飯店。",
    completedJobs: 56,
    rating: 4.9,
    coverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 6,000", story: "NT$ 2,000", reels: "NT$ 10,000" },
    audience: { gender: "女性 80%", age: "30-45歲 (家庭客)", topCity: "新北/桃園" },
    portfolio: [
      "https://images.unsplash.com/photo-1596436889106-be35e843f974?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1571896349842-6e53ce41e887?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1560668383-17dea6d01445?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 6,
    name: "甜點地圖",
    handle: "@sweet_map",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suga",
    tags: ["美食", "甜點", "咖啡廳"],
    followers: 15000,
    engagement: 8.5,
    location: "高雄市",
    bio: "螞蟻人的口袋名單，沒有好吃的甜點我可是不出門的。",
    completedJobs: 8,
    rating: 4.6,
    badges: ['高互動'],
    coverImage: "https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    rates: { post: "NT$ 2,500", story: "NT$ 800", reels: "NT$ 4,000" },
    audience: { gender: "女性 95%", age: "18-28歲", topCity: "高雄/台南" },
    portfolio: [
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1579372786545-d24232daf584?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    ]
  }
];

export default function CreatorsPage() {
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'followers' | 'jobs' | 'engagement'>('relevance');
  const [selectedCreator, setSelectedCreator] = useState<CreatorDetail | null>(null); // 控制詳情視窗

  // --- 排行榜邏輯 (取接單數前 3 名) ---
  const topCreators = [...ALL_CREATORS]
    .sort((a, b) => b.completedJobs - a.completedJobs)
    .slice(0, 3);

  // --- 篩選與排序邏輯 ---
  const filteredCreators = ALL_CREATORS.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          creator.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '全部' || creator.tags.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'followers': return b.followers - a.followers;
      case 'jobs': return b.completedJobs - a.completedJobs;
      case 'engagement': return b.engagement - a.engagement;
      default: return 0;
    }
  });

  const categories = [
    { id: '全部', label: '全部' },
    { id: '旅遊', label: '旅遊 Travel' },
    { id: '美食', label: '美食 Foodie' },
    { id: '親子', label: '親子 Family' },
    { id: '攝影', label: '攝影 Photography' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      
      {/* 🏆 Leaderboard Section */}
      <div className="bg-white border-b border-slate-200 pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8 justify-center md:justify-start">
            <Trophy className="text-amber-500 fill-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900">本月熱門接單王</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topCreators.map((creator, index) => (
              <div 
                key={`top-${creator.id}`} 
                onClick={() => setSelectedCreator(creator)}
                className={`relative bg-white rounded-xl p-6 border transition-transform hover:-translate-y-1 cursor-pointer ${
                  index === 0 ? 'border-amber-400 shadow-amber-100 shadow-lg ring-1 ring-amber-100' : 
                  index === 1 ? 'border-slate-300 shadow-sm' : 'border-orange-200 shadow-sm'
                }`}
              >
                {/* Ranking Badge */}
                <div className={`absolute -top-4 left-6 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                  index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-600'
                }`}>
                  {index + 1}
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={creator.avatar} alt={creator.name} className="w-16 h-16 rounded-full border-2 border-white shadow-sm" />
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

      {/* 🔍 Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">尋找優質創作者</h1>
            <p className="text-slate-600">
              透過精準篩選，找到最適合您品牌風格的合作夥伴。
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 sticky top-20 z-40">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="搜尋網紅名稱 (例如：林小美)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      categoryFilter === cat.id
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-200'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="text-sm text-slate-500 hidden md:inline">排序：</span>
              <div className="relative">
                <select 
                  className="appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer hover:bg-slate-50"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
          {filteredCreators.map(creator => (
            <div key={creator.id} onClick={() => setSelectedCreator(creator)}>
              <CreatorCard creator={creator} />
            </div>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredCreators.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">沒有找到符合條件的創作者</h3>
            <p className="text-slate-500">試試看切換其他關鍵字或清除篩選條件。</p>
            <button 
              onClick={() => {setSearchTerm(''); setCategoryFilter('全部');}}
              className="mt-4 text-sky-600 font-bold hover:underline"
            >
              清除所有篩選
            </button>
          </div>
        )}
      </div>

      {/* --- Creator Details Modal (創作者詳情視窗) --- */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-bottom-5 duration-300 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedCreator(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header / Cover */}
            <div className="relative h-48 sm:h-64 bg-slate-200 shrink-0">
              <img src={selectedCreator.coverImage} className="w-full h-full object-cover" alt="Cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <div className="absolute -bottom-10 left-6 sm:left-8 flex items-end gap-4">
                <img 
                  src={selectedCreator.avatar} 
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-white shadow-md object-cover" 
                  alt={selectedCreator.name} 
                />
                <div className="pb-12 text-white hidden sm:block">
                  {/* Desktop header text inside cover */}
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="pt-12 px-6 sm:px-8 pb-8 flex-grow">
              
              {/* Profile Basic Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    {selectedCreator.name} 
                    <CheckCircle2 size={20} className="text-sky-500 fill-sky-50" />
                  </h2>
                  <p className="text-slate-500 font-medium mb-2">{selectedCreator.handle}</p>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1"><MapPin size={14}/> {selectedCreator.location}</span>
                    <span className="text-slate-300">|</span>
                    {selectedCreator.tags.map(tag => (
                      <span key={tag} className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{tag}</span>
                    ))}
                  </div>
                  
                  {/* Social Links (Mock) */}
                  <div className="flex gap-3">
                    <button className="p-2 bg-slate-100 rounded-full text-pink-600 hover:bg-pink-50"><Instagram size={20}/></button>
                    <button className="p-2 bg-slate-100 rounded-full text-red-600 hover:bg-red-50"><Youtube size={20}/></button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4 mt-6 sm:mt-0 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none text-center p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-[80px]">
                    <p className="text-xs text-slate-500 mb-1">粉絲數</p>
                    <p className="text-xl font-bold text-slate-900">{(selectedCreator.followers/1000).toFixed(1)}k</p>
                  </div>
                  <div className="flex-1 sm:flex-none text-center p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-[80px]">
                    <p className="text-xs text-slate-500 mb-1">互動率</p>
                    <p className="text-xl font-bold text-green-600">{selectedCreator.engagement}%</p>
                  </div>
                  <div className="flex-1 sm:flex-none text-center p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-[80px]">
                    <p className="text-xs text-slate-500 mb-1">完成案件</p>
                    <p className="text-xl font-bold text-slate-900">{selectedCreator.completedJobs}</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-2">關於我</h3>
                <p className="text-slate-600 leading-relaxed">{selectedCreator.bio}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Audience Insight */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-500"/> 受眾分析 (Audience)
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500">性別分佈</span>
                      <span className="font-bold text-slate-700">{selectedCreator.audience.gender}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500">主力年齡</span>
                      <span className="font-bold text-slate-700">{selectedCreator.audience.age}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">熱門城市</span>
                      <span className="font-bold text-slate-700">{selectedCreator.audience.topCity}</span>
                    </div>
                  </div>
                </div>

                {/* Reference Rates */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <DollarSign size={18} className="text-green-600"/> 參考報價
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 flex items-center gap-2"><Camera size={14}/> 圖文貼文</span>
                      <span className="font-bold text-slate-900">{selectedCreator.rates.post}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400"></div> 限時動態</span>
                      <span className="font-bold text-slate-900">{selectedCreator.rates.story}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 flex items-center gap-2"><div className="w-3.5 h-3.5 bg-slate-400 rounded"></div> Reels 短影音</span>
                      <span className="font-bold text-slate-900">{selectedCreator.rates.reels}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 text-center">* 實際報價依合作內容調整，歡迎使用「智能合約」洽談</p>
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">近期作品 (Portfolio)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {selectedCreator.portfolio.map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity cursor-pointer">
                      <img src={img} className="w-full h-full object-cover" alt="Portfolio" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer Action */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-white sticky bottom-0 flex justify-between items-center gap-4">
               <div className="hidden sm:block">
                 <p className="text-xs text-slate-500">最後上線：2 小時前</p>
               </div>
               <button 
                 className="flex-1 sm:flex-none w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                 onClick={() => alert("功能開發中：將開啟聊天室或合約發送介面")}
               >
                 <Mail size={18} /> 發送合作邀請
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}