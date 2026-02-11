'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Mail, 
  Lock, 
  ArrowRight, 
  Building2, 
  User, 
  LayoutDashboard, 
  FileText, 
  Users, 
  DollarSign, 
  BarChart3, 
  TrendingUp, 
  Settings,
  LogOut,
  Bell
} from 'lucide-react';

export default function DashboardPage() {
  // 模擬登入狀態：false = 顯示登入頁, true = 顯示後台
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 模擬角色：'business' | 'creator'
  const [role, setRole] = useState<'business' | 'creator'>('business');
  
  // 處理登入動作
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 這裡未來會接 Supabase 的 auth.signInWithPassword
    setTimeout(() => {
      setIsLoggedIn(true);
    }, 800);
  };

  // --- 如果未登入，顯示登入/註冊畫面 ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        {/* 左側：品牌視覺區 (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 opacity-40">
            <img 
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
              alt="Office" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 p-12 text-white max-w-lg">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 border-2 border-sky-400 rounded-lg flex items-center justify-center">
                <span className="text-sky-400 font-bold text-xl">X</span>
              </div>
              <span className="text-3xl font-extrabold tracking-tight">X-Match</span>
            </div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              連結在地旅宿與<br/>最具影響力的創作者
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              加入全台最大的互惠媒合平台。透明的數據、高效的媒合，讓每一次的合作都轉化為真實的品牌價值。
            </p>
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex-1">
                <p className="text-3xl font-bold text-sky-400 mb-1">1,200+</p>
                <p className="text-sm text-slate-400">認證創作者</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex-1">
                <p className="text-3xl font-bold text-sky-400 mb-1">98%</p>
                <p className="text-sm text-slate-400">媒合滿意度</p>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：登入表單 */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-900">歡迎回來</h2>
              <p className="mt-2 text-slate-600">請登入您的 X-Match 帳戶以管理案件。</p>
            </div>

            {/* 角色切換 */}
            <div className="bg-slate-100 p-1 rounded-xl flex">
              <button
                onClick={() => setRole('business')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                  role === 'business' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building2 size={16} />
                我是商家
              </button>
              <button
                onClick={() => setRole('creator')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                  role === 'creator' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <User size={16} />
                我是創作者
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">電子郵件</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition-colors"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">密碼</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                    記住我
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-sky-600 hover:text-sky-500">
                    忘記密碼？
                  </a>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              >
                登入 {role === 'business' ? '商家後台' : '創作者中心'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-50 text-slate-500">或者使用社群帳號登入</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Google
                </button>
                <button type="button" className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Facebook
                </button>
              </div>
            </form>

            <p className="text-center text-sm text-slate-600">
              還沒有帳號？{' '}
              <a href="#" className="font-medium text-sky-600 hover:text-sky-500">
                免費註冊商家帳號
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- 已登入：商家後台介面 ---
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dashboard Navbar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Link href="/" className="font-extrabold text-2xl text-sky-500 tracking-tight font-sans">
                X-Match
              </Link>
              <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-medium ml-2">Business Pro</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-500 hover:text-slate-700 relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">海角七號民宿</p>
                  <p className="text-xs text-slate-500">Business Plan</p>
                </div>
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                  H
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-6">
            <nav className="space-y-1">
              {[
                { icon: LayoutDashboard, label: '總覽 Dashboard', active: true },
                { icon: FileText, label: '我的案件 (3)', active: false },
                { icon: Users, label: '已媒合網紅', active: false },
                { icon: Mail, label: '訊息中心', active: false },
                { icon: DollarSign, label: '錢包與發票', active: false },
                { icon: Settings, label: '帳號設定', active: false },
              ].map((item) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    item.active
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg mt-8"
              >
                <LogOut size={18} />
                登出
              </button>
            </nav>

            {/* Quick Action Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
              <h4 className="font-bold text-lg mb-2">需要更多曝光？</h4>
              <p className="text-indigo-100 text-sm mb-4">使用「急單加速器」將您的空房需求推播給附近的網紅。</p>
              <button className="w-full py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors">
                立即推廣
              </button>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-sky-50 p-2 rounded-lg text-sky-600">
                    <BarChart3 size={20} />
                  </div>
                  <span className="text-xs text-green-600 flex items-center bg-green-50 px-2 py-1 rounded font-medium">
                    <TrendingUp size={12} className="mr-1" /> +12%
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-1">本月總曝光數 (Reach)</p>
                <h3 className="text-2xl font-bold text-slate-900">124.5k</h3>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <FileText size={20} />
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-1">進行中案件</p>
                <h3 className="text-2xl font-bold text-slate-900">2</h3>
                <span className="text-xs text-slate-400 mt-2 block">等待創作者發布貼文</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                    <Users size={20} />
                  </div>
                  <span className="text-xs text-orange-600 font-bold hover:underline cursor-pointer">
                    前往審核 &rarr;
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-1">待審核申請</p>
                <h3 className="text-2xl font-bold text-slate-900">5</h3>
              </div>
            </div>

            {/* Active Projects List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">進行中合作</h3>
                <button className="text-sm text-slate-500 hover:text-sky-600">查看全部</button>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { id: 1, name: '林小美', project: '暑期親子專案 - 兩天一夜', status: '製作中', date: '2024/06/20', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
                  { id: 2, name: 'Jason 攝影', project: '海景房開箱影片', status: '待驗收', date: '2024/06/18', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jason' }
                ].map((item) => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={item.avatar} className="w-10 h-10 rounded-full bg-slate-100" alt="avatar" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.project}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                       <div className="text-right mr-4">
                          <p className="text-xs text-slate-400">預計發文</p>
                          <p className="text-sm font-medium text-slate-700">{item.date}</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                            item.status === '待驗收' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.status}
                          </span>
                          <button className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors">
                            <Mail size={18} />
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Trip Wishes (Reverse Bidding Opportunity) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <MapPin size={18} className="text-sky-500"/> 
                  附近的許願行程
                  <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">New</span>
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden">
                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elly" alt="Elly" />
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="font-bold text-slate-900">食尚艾莉 <span className="text-xs font-normal text-slate-500 ml-1">@elly_eats</span></p>
                           <p className="text-sm text-slate-600 mt-1">預計 6/5 - 6/7 前往 <span className="font-bold text-sky-600">恆春/墾丁</span></p>
                        </div>
                        <button className="text-xs bg-sky-500 text-white px-3 py-1.5 rounded-md font-bold hover:bg-sky-600">
                           發送邀請
                        </button>
                     </div>
                     <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-3 rounded-lg">
                       「想找一間有泳池的民宿拍夏日特輯，粉絲數 2.8w，互動率高...」
                     </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}