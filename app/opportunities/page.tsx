'use client';

import { useState } from 'react';
import { MapPin, DollarSign, Camera, Hotel, Utensils, Tent, Filter, Sparkles, Flame, Zap, ArrowRight, Users, CheckCircle, X, CheckCircle2 } from 'lucide-react';

// 定義案源資料結構
interface Opportunity {
  id: number;
  business: string;
  location: string;
  type: '互惠體驗' | '付費推廣';
  category: '住宿' | '餐飲' | '體驗';
  totalValue: string;        // 總價值 (顯性化)
  valueBreakdown: string;    // 價值拆解 (住宿+餐飲...)
  requirements: string;
  image: string;
  tags: string[];
  matchScore: number;        // 智能契合度
  spotsLeft?: number;        // 剩餘名額 (稀缺感)
  applicants: number;        // 已應徵人數
}

// 模擬案源資料
const OPPORTUNITIES_DATA: Opportunity[] = [
  {
    id: 1,
    business: "海角七號民宿",
    location: "屏東恆春",
    type: "互惠體驗",
    category: "住宿",
    totalValue: "NT$ 8,800",
    valueBreakdown: "海景房住宿($6800) + 早餐($800) + 接送($1200)",
    requirements: "IG 貼文 1 則 + 限動 3 則 (需標記地點)",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tags: ["海景", "早餐", "寵物友善"],
    matchScore: 98,
    spotsLeft: 1, // 只剩 1 個名額！
    applicants: 12
  },
  {
    id: 2,
    business: "山林秘境露營區",
    location: "南投埔里",
    type: "付費推廣",
    category: "體驗",
    totalValue: "NT$ 5,000+",
    valueBreakdown: "稿酬($3000) + 免費營位($1200) + 烤肉組($800)",
    requirements: "Reels 短影音 1 支 (30-60秒) + 授權廣告",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tags: ["露營", "雲海", "營火"],
    matchScore: 85,
    applicants: 24
  },
  {
    id: 3,
    business: "老宅咖啡·午後",
    location: "台南中西區",
    type: "互惠體驗",
    category: "餐飲",
    totalValue: "NT$ 1,500",
    valueBreakdown: "雙人下午茶套餐($1200) + 伴手禮($300)",
    requirements: "Google 地圖評論 (附圖) + IG 限動打卡",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tags: ["咖啡", "甜點", "老宅"],
    matchScore: 92,
    spotsLeft: 3,
    applicants: 5
  },
   {
    id: 4,
    business: "Ocean Blue 衝浪店",
    location: "宜蘭外澳",
    type: "付費推廣",
    category: "體驗",
    totalValue: "NT$ 4,500",
    valueBreakdown: "稿酬($2000) + 一對一教學($2500)",
    requirements: "YouTube 影片 (5-10分鐘) / Blog 文章",
    image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tags: ["衝浪", "海邊", "教學"],
    matchScore: 78,
    applicants: 8
  }
];

export default function OpportunitiesPage() {
  const [selectedJob, setSelectedJob] = useState<Opportunity | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('全部'); // 新增分類篩選狀態

  const handleQuickApply = (job: Opportunity) => {
    setSelectedJob(job);
    setIsSuccess(false);
  };

  const confirmApply = () => {
    // 模擬送出申請的 API 延遲
    setTimeout(() => {
      setIsSuccess(true);
      // 2秒後自動關閉視窗
      setTimeout(() => {
        setSelectedJob(null);
        setIsSuccess(false);
      }, 2000);
    }, 800);
  };

  // 篩選邏輯
  const filteredOpportunities = OPPORTUNITIES_DATA.filter(job => {
    if (categoryFilter === '全部') return true;
    if (categoryFilter === '美食') return job.category === '餐飲'; // 將「美食」按鈕對應到資料中的「餐飲」
    return job.category === categoryFilter;
  });

  const categories = [
    { id: '全部', label: '全部' },
    { id: '住宿', label: '住宿' },
    { id: '美食', label: '美食' },
    { id: '體驗', label: '體驗' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">最新廠商合作案源</h1>
          <p className="text-slate-600">
            精選全台優質旅宿、餐廳與體驗活動，尋找最適合你的合作機會。
          </p>
        </div>
        
        {/* Category Filters */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredOpportunities.map(job => (
          <div key={job.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group cursor-pointer h-full relative">
            
            {/* Smart Match Score Badge (智能契合度) */}
            {job.matchScore >= 90 && (
              <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-in fade-in zoom-in">
                <Sparkles size={12} fill="currentColor" />
                {job.matchScore}% 適合你
              </div>
            )}

            {/* Image Section */}
            <div className="sm:w-2/5 relative h-56 sm:h-auto overflow-hidden">
               <img 
                  src={job.image}
                  alt={job.business}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
               />
               <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur-md ${
                    job.type === '付費推廣' ? 'bg-amber-100/90 text-amber-800' : 'bg-white/90 text-indigo-800'
                  }`}>
                    {job.type}
                  </span>
               </div>
               
               {/* Spots Left Overlay (剩餘名額倒數) */}
               {job.spotsLeft && job.spotsLeft <= 3 && (
                 <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                    <div className="flex items-center gap-1 text-red-400 text-xs font-bold animate-pulse">
                      <Flame size={14} fill="currentColor" />
                      只剩 {job.spotsLeft} 個名額
                    </div>
                 </div>
               )}
            </div>

            {/* Content Section */}
            <div className="sm:w-3/5 p-5 flex flex-col">
               <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <MapPin size={14} />
                    {job.location}
                  </div>
                  {/* Category Icon */}
                  <div className="text-slate-300">
                    {job.category === '住宿' && <Hotel size={16} />}
                    {job.category === '餐飲' && <Utensils size={16} />}
                    {job.category === '體驗' && <Tent size={16} />}
                  </div>
               </div>

               <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                 {job.business}
               </h3>
               
               <div className="mb-4 space-y-3 flex-grow">
                 {/* Value Breakdown (互惠價值顯性化) */}
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
                    已應徵 {job.applicants} 人
                  </div>
                  
                  {/* Quick Apply Button (快速應徵) */}
                  <button 
                    onClick={() => handleQuickApply(job)}
                    className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all hover:shadow-md hover:scale-105 active:scale-95 group/btn"
                  >
                    <Zap size={14} className="fill-yellow-400 text-yellow-400 group-hover/btn:animate-pulse" />
                    快速應徵
                  </button>
               </div>
            </div>
          </div>
        ))}
        
        {/* Empty State */}
        {filteredOpportunities.length === 0 && (
          <div className="col-span-1 lg:col-span-2 text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Filter className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">暫無「{categoryFilter}」類別的合作機會</p>
            <button 
              onClick={() => setCategoryFilter('全部')}
              className="mt-2 text-sm text-indigo-600 font-bold hover:underline"
            >
              查看所有案源
            </button>
          </div>
        )}
      </div>

      {/* Quick Apply Modal (彈出式應徵確認視窗) */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            {isSuccess ? (
              // 成功狀態
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
              // 確認狀態
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">確認快速應徵</h3>
                  <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                {/* Job Summary */}
                <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <img src={selectedJob.image} className="w-16 h-16 rounded-lg object-cover" alt={selectedJob.business} />
                  <div>
                    <p className="font-bold text-slate-900 line-clamp-1">{selectedJob.business}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                       <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">{selectedJob.category}</span>
                       <span className="font-bold text-indigo-600">{selectedJob.totalValue}</span>
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
                    onClick={() => setSelectedJob(null)}
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