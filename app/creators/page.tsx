'use client';

import { useState } from 'react';
import CreatorCard, { Creator } from '@/components/CreatorCard';
import { Search, Trophy, Flame, Filter, ChevronDown, Award } from 'lucide-react';

// 擴充模擬資料，加入 `completedJobs` (接單數) 與 `rating` (評分)
const ALL_CREATORS: (Creator & { completedJobs: number; rating: number; badges?: string[] })[] = [
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
    badges: ['熱門']
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
    completedJobs: 85, // 接單王 No.1
    rating: 5.0,
    badges: ['金牌合作']
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
    completedJobs: 63, // 接單王 No.2
    rating: 4.8
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
    badges: ['潛力新星']
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
    completedJobs: 56, // 接單王 No.3
    rating: 4.9
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
    badges: ['高互動']
  }
];

export default function CreatorsPage() {
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'followers' | 'jobs' | 'engagement'>('relevance');

  // --- 排行榜邏輯 (取接單數前 3 名) ---
  const topCreators = [...ALL_CREATORS]
    .sort((a, b) => b.completedJobs - a.completedJobs)
    .slice(0, 3);

  // --- 篩選與排序邏輯 ---
  const filteredCreators = ALL_CREATORS.filter(creator => {
    // 1. 關鍵字搜尋 (名稱或 Handle)
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          creator.handle.toLowerCase().includes(searchTerm.toLowerCase());
    // 2. 類別篩選
    const matchesCategory = categoryFilter === '全部' || creator.tags.includes(categoryFilter);
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    // 3. 排序
    switch (sortBy) {
      case 'followers': return b.followers - a.followers;
      case 'jobs': return b.completedJobs - a.completedJobs;
      case 'engagement': return b.engagement - a.engagement;
      default: return 0; // 預設排序
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
      
      {/* 🏆 Leaderboard Section (排行榜) */}
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
                className={`relative bg-white rounded-xl p-6 border transition-transform hover:-translate-y-1 ${
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

        {/* Toolbar: Search & Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 sticky top-20 z-40">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Left: Search & Categories */}
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

            {/* Right: Sort Dropdown */}
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
            <CreatorCard key={creator.id} creator={creator} />
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
    </div>
  );
}