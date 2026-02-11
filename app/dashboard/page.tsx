'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, FileText, Users, Mail, DollarSign, Settings, LogOut, Bell, 
  Briefcase, Plane, FileSignature, CheckCircle2, Search, Plus, MapPin, 
  CreditCard, TrendingUp, User
} from 'lucide-react';

// 定義後台分頁
type Tab = 'overview' | 'projects' | 'trips' | 'contracts' | 'wallet' | 'settings';

export default function DashboardPage() {
  // 狀態管理
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'business' | 'creator'>('business'); // 角色切換
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // 登入處理
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => setIsLoggedIn(true), 800);
  };

  // --- 1. 登入/註冊頁面 (保持原樣，僅做微調) ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          {/* 左側視覺 */}
          <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-indigo-900 opacity-50"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-extrabold mb-4">X-Match</h1>
              <p className="text-lg text-slate-200 mb-8">連結在地旅宿與優質創作者，<br/>開啟您的互惠旅程。</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg"><Briefcase size={20}/></div>
                  <span>超過 500+ 間合作廠商</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg"><Users size={20}/></div>
                  <span>1,200+ 位認證創作者</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右側表單 */}
          <div className="md:w-1/2 p-12 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">歡迎回來</h2>
            
            {/* 角色選擇 Tab */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
              <button 
                onClick={() => setRole('business')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'business' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Briefcase size={16}/> 我是商家
              </button>
              <button 
                onClick={() => setRole('creator')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'creator' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <User size={16}/> 我是創作者
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input type="email" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" placeholder="example@mail.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">密碼</label>
                <input type="password" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-sky-200">
                登入 {role === 'business' ? '商家後台' : '創作者中心'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. 後台主邏輯與內容渲染 ---

  // 根據角色定義側邊欄選單
  const menuItems = role === 'business' ? [
    { id: 'overview', icon: LayoutDashboard, label: '總覽 Dashboard' },
    { id: 'projects', icon: Briefcase, label: '我的徵才 (案源)' }, // 業者專屬
    { id: 'trips', icon: Plane, label: '發出的邀請' }, // 對應行程許願池
    { id: 'contracts', icon: FileSignature, label: '合約管理' },
    { id: 'wallet', icon: CreditCard, label: '訂閱與點數' },
    { id: 'settings', icon: Settings, label: '商家設定' },
  ] : [
    { id: 'overview', icon: LayoutDashboard, label: '創作者中心' },
    { id: 'trips', icon: Plane, label: '我的許願行程' }, // 創作者專屬
    { id: 'projects', icon: FileText, label: '我的應徵' }, // 對應廠商案源
    { id: 'contracts', icon: FileSignature, label: '合約管理' },
    { id: 'wallet', icon: DollarSign, label: '收益與收款' },
    { id: 'settings', icon: User, label: '履歷 (Media Kit)' },
  ];

  // 渲染內容區域
  const renderContent = () => {
    switch (activeTab) {
      
      // --- A. 總覽 Dashboard ---
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {role === 'business' ? '早安，海角七號民宿 👋' : '早安，林小美 👋'}
            </h2>
            
            {/* 數據卡片 (根據角色不同) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {role === 'business' ? (
                <>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">本月總曝光 (Reach)</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-bold text-slate-900">12.5k</h3>
                      <span className="text-xs font-bold text-green-600 flex items-center"><TrendingUp size={12}/> +12%</span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">進行中合約</p>
                    <h3 className="text-3xl font-bold text-slate-900">3</h3>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">剩餘急單點數</p>
                    <h3 className="text-3xl font-bold text-indigo-600">5 <span className="text-sm text-slate-400 font-normal">點</span></h3>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">Media Kit 瀏覽數</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-bold text-slate-900">856</h3>
                      <span className="text-xs font-bold text-green-600 flex items-center"><TrendingUp size={12}/> +24%</span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">收到的邀請</p>
                    <h3 className="text-3xl font-bold text-slate-900">5 <span className="text-sm text-red-500 font-bold text-base">New!</span></h3>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">待領取稿酬</p>
                    <h3 className="text-3xl font-bold text-green-600">$3,000</h3>
                  </div>
                </>
              )}
            </div>

            {/* 近期動態列表 */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">近期通知</h3>
                <button className="text-sm text-sky-600 hover:underline">查看全部</button>
              </div>
              <div className="divide-y divide-slate-50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 px-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-sky-500 mt-2 shrink-0"></div>
                    <div>
                      <p className="text-sm text-slate-800">
                        {role === 'business' 
                          ? `創作者 @user${i} 已簽署了「暑期推廣合約」，合約正式生效。` 
                          : `廠商「海角七號民宿」向您的「蘭嶼行程」發送了合作邀請。`}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">2 小時前</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // --- B. 案源/徵才管理 (Projects) ---
      case 'projects':
        return role === 'business' ? (
          // 業者視角：管理發布的職缺
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">我的徵才 (發布案源)</h2>
              <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800">
                <Plus size={16}/> 新增職缺
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">標題</th>
                    <th className="px-6 py-3 font-medium">狀態</th>
                    <th className="px-6 py-3 font-medium">應徵人數</th>
                    <th className="px-6 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-6 py-4 font-bold text-slate-900">海景房開箱體驗招募</td>
                    <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">招募中</span></td>
                    <td className="px-6 py-4 flex items-center gap-2"><Users size={14}/> 12 人</td>
                    <td className="px-6 py-4"><button className="text-sky-600 font-bold hover:underline">查看名單</button></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-slate-900">夏日餐飲新品推廣</td>
                    <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">已關閉</span></td>
                    <td className="px-6 py-4 flex items-center gap-2"><Users size={14}/> 8 人</td>
                    <td className="px-6 py-4"><button className="text-slate-400 font-bold hover:underline">重新上架</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // 創作者視角：管理應徵紀錄
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">我的應徵紀錄</h2>
            <div className="grid gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center"><Briefcase size={20} className="text-slate-500"/></div>
                  <div>
                    <h3 className="font-bold text-slate-900">海景房開箱體驗</h3>
                    <p className="text-sm text-slate-500">海角七號民宿 • 屏東恆春</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">審核中</span>
                  <p className="text-xs text-slate-400 mt-1">2 天前申請</p>
                </div>
              </div>
            </div>
          </div>
        );

      // --- C. 行程/邀請管理 (Trips) ---
      case 'trips':
        return role === 'business' ? (
          // 業者視角：發出的邀請
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">已發送的邀請</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jason" className="w-10 h-10 rounded-full" alt="Jason"/>
                  <div>
                    <p className="font-bold text-slate-900">Jason 攝影</p>
                    <p className="text-xs text-slate-500">針對行程：蘭嶼星空拍攝</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">等待回覆</span>
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                "哈囉 Jason，我們是海角七號民宿，看到您要來蘭嶼..."
              </p>
            </div>
          </div>
        ) : (
          // 創作者視角：我的許願行程
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">我的許願行程</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
                <Plus size={16}/> 發布新行程
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6">
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">招募中</span>
                   <h3 className="text-lg font-bold text-slate-900">宜蘭礁溪親子遊</h3>
                 </div>
                 <p className="text-sm text-slate-500 mb-4"><Calendar size={14} className="inline mr-1"/> 2024/05/20 - 05/22</p>
                 <div className="flex items-center gap-2 text-sm text-slate-600">
                   <Users size={16}/> 2大2小
                   <span className="text-slate-300">|</span>
                   <MapPin size={16}/> 尋找親子友善飯店
                 </div>
               </div>
               <div className="flex-shrink-0 border-l border-slate-100 pl-6 flex flex-col justify-center items-center min-w-[150px]">
                 <p className="text-xs text-slate-500 mb-1">目前收到</p>
                 <p className="text-3xl font-bold text-indigo-600 mb-2">5</p>
                 <p className="text-xs text-slate-500">間廠商邀請</p>
                 <button className="mt-3 w-full py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded hover:bg-indigo-100">查看邀請</button>
               </div>
            </div>
          </div>
        );

      // --- D. 合約管理 (Contracts) - 雙方共用 ---
      case 'contracts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">合約管理</h2>
              <Link href="/calculator" className="text-sky-600 font-bold text-sm hover:underline flex items-center gap-1">
                <Plus size={16}/> 建立新合約
              </Link>
            </div>
            
            {/* 合約列表 */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                    <FileSignature size={24}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">暑期親子專案推廣合約</h3>
                    <p className="text-sm text-slate-500">
                      {role === 'business' ? '合作對象：林小美' : '合作廠商：海角七號民宿'} • 2024/06/01
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    <CheckCircle2 size={12}/> 生效中 Active
                  </span>
                  <p className="text-xs text-slate-400 mt-1">點擊查看詳情</p>
                </div>
              </div>

              <div className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                    <FileText size={24}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">蘭嶼星空拍攝互惠備忘錄</h3>
                    <p className="text-sm text-slate-500">
                      {role === 'business' ? '合作對象：Jason 攝影' : '合作廠商：海角七號民宿'} • 2024/06/10
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    等待簽署 Pending
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    {role === 'business' ? '等待對方簽名' : '請盡快簽署'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="p-10 text-center text-slate-500">功能開發中...</div>;
    }
  };

  // --- 3. 主頁面佈局 ---
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 頂部導覽 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Link href="/" className="font-extrabold text-2xl text-sky-500 tracking-tight font-sans">
                X-Match
              </Link>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${
                role === 'business' ? 'bg-sky-100 text-sky-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {role === 'business' ? 'Business Pro' : 'Creator Studio'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
                 <button 
                   onClick={() => setRole('business')}
                   className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${role === 'business' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}
                 >業者視角</button>
                 <button 
                   onClick={() => setRole('creator')}
                   className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${role === 'creator' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}
                 >創作者視角</button>
              </div>
              <button className="text-slate-500 hover:text-slate-700 relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                     style={{ backgroundColor: role === 'business' ? '#0ea5e9' : '#8b5cf6' }}>
                  {role === 'business' ? 'H' : 'L'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左側選單 */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 sticky top-24">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === item.id
                      ? (role === 'business' ? 'bg-sky-50 text-sky-700' : 'bg-purple-50 text-purple-700')
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
          </div>

          {/* 右側內容區 */}
          <div className="lg:col-span-3 min-h-[600px]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}