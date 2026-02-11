import Link from 'next/link';
import { TrendingUp, Users, CheckCircle, ArrowRight, Search, MessageCircle, Heart, Star, BarChart } from 'lucide-react';
import CreatorCard, { Creator } from '@/components/CreatorCard';

// 模擬資料 (之後這部分會改從 Supabase 資料庫讀取)
const CREATORS_DATA: Creator[] = [
  {
    id: 1,
    name: "林小美",
    handle: "@may_travel",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    tags: ["旅遊", "美食", "親子"],
    followers: 45000,
    engagement: 3.2,
    location: "台北市",
    bio: "專注於親子友善飯店與在地美食推廣，擁有高黏著度的媽媽社群。"
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
    bio: "專業戶外攝影師，擅長用影像說故事，曾與多個國際戶外品牌合作。"
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
    bio: "喜歡挖掘巷弄裡的小店，照片風格清新明亮，粉絲以年輕女性為主。"
  }
];

export default function Home() {
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
          <span className="inline-block py-1 px-3 rounded-full bg-sky-500/30 text-sky-200 text-sm font-semibold mb-6 backdrop-blur-sm border border-sky-400/30">
            旅宿業 x 創作者 媒合新標準
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            連結在地業者與風格創作者<br/>讓體驗成為最有價值的貨幣
          </h1>
          <p className="max-w-2xl text-lg text-slate-300 mb-10">
            全台首創「行程逆向媒合」平台。網紅用影響力換取深度旅遊，業者用閒置空房換取精準曝光。
            智能合約保障、透明數據分析，讓合作更簡單。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link 
              href="/creators"
              className="flex-1 bg-white text-slate-900 py-3.5 px-6 rounded-lg font-bold text-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              我是業者，找網紅 <ArrowRight size={20} />
            </Link>
            <Link 
              href="/trips"
              className="flex-1 bg-sky-500 text-white py-3.5 px-6 rounded-lg font-bold text-lg hover:bg-sky-600 transition-colors border border-sky-500 text-center flex items-center justify-center"
            >
              我是網紅，許願行程
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

      {/* Featured Creators Section */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">本週熱門創作者</h2>
              <p className="text-slate-600">經演算法推薦的高互動潛力新星</p>
            </div>
            <Link href="/creators" className="text-sky-600 font-semibold hover:underline flex items-center gap-1">
              查看更多 <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CREATORS_DATA.map(creator => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </div>
      </div>

      {/* Success Stories / Case Studies */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-16">
          <span className="text-sky-600 font-bold tracking-wider uppercase text-sm mb-2 block">Success Stories</span>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">聽聽他們怎麼說</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            加入 X-Match 的夥伴們，已經創造了無數雙贏的合作案例。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Case 1 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 flex flex-col md:flex-row">
            <div className="md:w-2/5 relative min-h-[200px]">
              <img 
                src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Hotel Case" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="p-8 md:w-3/5 flex flex-col justify-center">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <blockquote className="text-lg font-medium text-slate-800 mb-6 italic">
                "透過行程許願池，我們在淡季主動邀請到正要來墾丁的 @Jason攝影。他拍的星空照讓我們的週末訂房率提升了 30%！"
              </blockquote>
              <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">H</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">海角七號民宿</p>
                  <p className="text-xs text-slate-500">屏東恆春</p>
                </div>
                <div className="ml-auto flex items-center gap-1 bg-green-50 px-2 py-1 rounded text-green-700 text-xs font-bold">
                  <BarChart size={14} /> 轉換率 +30%
                </div>
              </div>
            </div>
          </div>

          {/* Case 2 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 flex flex-col md:flex-row">
             <div className="md:w-2/5 relative min-h-[200px]">
              <img 
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Restaurant Case" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="p-8 md:w-3/5 flex flex-col justify-center">
               <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <blockquote className="text-lg font-medium text-slate-800 mb-6 italic">
                "以前都要花很多時間跟網紅議價，現在用互惠計算機，大家對交換標準有共識，溝通效率快非常多。"
              </blockquote>
              <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">R</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">老宅咖啡·午後</p>
                  <p className="text-xs text-slate-500">台南中西區</p>
                </div>
                 <div className="ml-auto flex items-center gap-1 bg-sky-50 px-2 py-1 rounded text-sky-700 text-xs font-bold">
                  <TrendingUp size={14} /> 效率提升 2x
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}