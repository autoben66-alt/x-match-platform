'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, DollarSign, Settings, LogOut, ShieldAlert, 
  TrendingUp, CheckCircle2, XCircle, MoreVertical, Search, ShieldCheck, 
  Activity, PieChart, ArrowUpRight, ArrowDownRight, FileText, Briefcase, Bell,
  AlertTriangle
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'revenue' | 'settings';

export default function AdminDashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  // 搜尋與篩選狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('全部角色');
  const [filterStatus, setFilterStatus] = useState('全部狀態');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // 確認變更狀態的 Modal
  const [confirmAction, setConfirmAction] = useState<{userId: number, userName: string, newStatus: string} | null>(null);

  // 模擬登入
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => setIsLoggedIn(true), 800);
  };

  // 模擬用戶資料
  const [users, setUsers] = useState([
    { id: 1, name: '海角七號民宿', email: 'cape7@example.com', role: '商家', plan: 'Pro', status: '活躍', joinDate: '2024/02/15' },
    { id: 2, name: '林小美', email: 'may_travel@example.com', role: '創作者', plan: 'Free', status: '活躍', joinDate: '2024/01/10' },
    { id: 3, name: '山林秘境露營區', email: 'mountain@example.com', role: '商家', plan: 'Free', status: '待審核', joinDate: '2024/06/01' },
    { id: 4, name: 'Jason 攝影', email: 'jason@example.com', role: '創作者', plan: 'Free', status: '停權', joinDate: '2023/11/20' },
  ]);

  // 過濾後的用戶名單
  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === '全部角色' || user.role === filterRole;
    const matchStatus = filterStatus === '全部狀態' || user.status === filterStatus;
    
    return matchSearch && matchRole && matchStatus;
  });

  // 變更用戶狀態功能
  const handleStatusChange = (userId: number, newStatus: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
    setOpenMenuId(null); // 關閉選單
    setConfirmAction(null); // 關閉確認視窗
  };

  // 模擬交易紀錄
  const transactions = [
    { id: 'TX-1049', user: '海角七號民宿', item: '專業成長版 Pro (月訂閱)', amount: 999, status: '成功', date: '2024/06/01 10:23' },
    { id: 'TX-1048', user: 'Ocean Blue 衝浪店', item: '單次置頂推廣 (Boost)', amount: 300, status: '成功', date: '2024/05/28 15:40' },
    { id: 'TX-1047', user: '老宅咖啡·午後', item: '精準推播 (Smart Push)', amount: 100, status: '成功', date: '2024/05/25 09:12' },
  ];

  // --- 1. Admin 登入頁面 ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <ShieldAlert className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">X-Match 系統總後台</h1>
          <p className="text-center text-slate-500 mb-8">請輸入管理員憑證以登入系統</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">管理員帳號</label>
              <input type="text" defaultValue="admin" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">密碼</label>
              <input type="password" defaultValue="password" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
            <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors shadow-lg active:scale-95 transform duration-150">
              登入管理系統
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 2. Admin 內容渲染 ---
  const renderContent = () => {
    switch (activeTab) {
      // --- A. 營運總覽 ---
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">系統營運總覽</h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></div>
                  <span className="text-xs font-bold text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full"><TrendingUp size={12} className="mr-1"/> +12%</span>
                </div>
                <p className="text-sm text-slate-500 mb-1">總註冊用戶數</p>
                <h3 className="text-3xl font-bold text-slate-900">{users.length + 1848}</h3>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Briefcase size={20}/></div>
                  <span className="text-xs font-bold text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full"><TrendingUp size={12} className="mr-1"/> +8%</span>
                </div>
                <p className="text-sm text-slate-500 mb-1">活躍廠商案源</p>
                <h3 className="text-3xl font-bold text-slate-900">426</h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20}/></div>
                  <span className="text-xs font-bold text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full"><TrendingUp size={12} className="mr-1"/> +24%</span>
                </div>
                <p className="text-sm text-slate-500 mb-1">本月總營收 (TWD)</p>
                <h3 className="text-3xl font-bold text-slate-900">$142,500</h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileText size={20}/></div>
                  <span className="text-xs font-bold text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full"><TrendingUp size={12} className="mr-1"/> +5%</span>
                </div>
                <p className="text-sm text-slate-500 mb-1">成功簽署合約數</p>
                <h3 className="text-3xl font-bold text-slate-900">85</h3>
              </div>
            </div>

            {/* Charts & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900">營收趨勢 (近 6 個月)</h3>
                  <select className="text-sm border-slate-200 rounded-lg p-1 outline-none text-slate-600"><option>2024</option></select>
                </div>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm flex items-center gap-2"><Activity size={16}/> 圖表開發中 (Chart.js / Recharts 預留位置)</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">待辦事項 (Needs Action)</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-orange-800">商家實名審核</p>
                      <p className="text-xs text-orange-600">有 12 筆待處理</p>
                    </div>
                    <button className="text-xs bg-white text-orange-600 font-bold px-2 py-1 rounded shadow-sm hover:bg-orange-100">前往審核</button>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-red-800">用戶檢舉回報</p>
                      <p className="text-xs text-red-600">有 3 筆未結案</p>
                    </div>
                    <button className="text-xs bg-white text-red-600 font-bold px-2 py-1 rounded shadow-sm hover:bg-red-100">查看詳情</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // --- B. 用戶與權限管理 ---
      case 'users':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">用戶與權限管理</h2>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
              {/* 篩選工具列 */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 rounded-t-xl">
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text"
                      placeholder="搜尋名稱或 Email..."
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    className="p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none shadow-sm cursor-pointer"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                  >
                    <option value="全部角色">全部角色</option>
                    <option value="商家">商家</option>
                    <option value="創作者">創作者</option>
                  </select>
                  <select 
                    className="p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none shadow-sm cursor-pointer"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="全部狀態">全部狀態</option>
                    <option value="活躍">活躍</option>
                    <option value="待審核">待審核</option>
                    <option value="停權">停權</option>
                  </select>
                </div>
              </div>

              {/* 修正：增加 pb-24 以確保最後一筆資料的下拉選單不會被截斷 */}
              <div className="overflow-x-auto pb-24">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-bold">用戶資訊</th>
                      <th className="px-6 py-4 font-bold">角色 / 方案</th>
                      <th className="px-6 py-4 font-bold">狀態</th>
                      <th className="px-6 py-4 font-bold">加入時間</th>
                      <th className="px-6 py-4 font-bold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.role === '商家' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                {user.role}
                              </span>
                              {user.plan === 'Pro' && (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">PRO</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit text-xs font-bold ${
                              user.status === '活躍' ? 'bg-green-100 text-green-700' : 
                              user.status === '待審核' ? 'bg-orange-100 text-orange-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {user.status === '活躍' ? <CheckCircle2 size={12}/> : user.status === '待審核' ? <ShieldAlert size={12}/> : <XCircle size={12}/>}
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{user.joinDate}</td>
                          <td className="px-6 py-4 text-right relative">
                            {/* 操作按鈕 */}
                            <button 
                              onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors focus:outline-none"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* 彈出操作選單 - 修正定位與 z-index 確保不卡圖 */}
                            {openMenuId === user.id && (
                              <>
                                {/* 點擊背景關閉選單 */}
                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                                <div className="absolute right-6 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 text-left overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                  {user.status !== '活躍' && (
                                    <button 
                                      onClick={() => {
                                        setConfirmAction({ userId: user.id, userName: user.name, newStatus: '活躍' });
                                        setOpenMenuId(null);
                                      }} 
                                      className="w-full px-4 py-2.5 text-sm text-green-700 font-medium hover:bg-green-50 flex items-center gap-2 transition-colors"
                                    >
                                      <CheckCircle2 size={14}/> 設為活躍
                                    </button>
                                  )}
                                  {user.status !== '停權' && (
                                    <button 
                                      onClick={() => {
                                        setConfirmAction({ userId: user.id, userName: user.name, newStatus: '停權' });
                                        setOpenMenuId(null);
                                      }} 
                                      className="w-full px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                      <XCircle size={14}/> 停權帳號
                                    </button>
                                  )}
                                  {user.status !== '待審核' && (
                                    <button 
                                      onClick={() => {
                                        setConfirmAction({ userId: user.id, userName: user.name, newStatus: '待審核' });
                                        setOpenMenuId(null);
                                      }} 
                                      className="w-full px-4 py-2.5 text-sm text-orange-600 font-medium hover:bg-orange-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                                    >
                                      <ShieldAlert size={14}/> 退回審核
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          找不到符合條件的用戶
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- 確認變更狀態的 Modal 視窗 --- */}
            {confirmAction && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3 mb-4 text-slate-900">
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-full">
                      <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold">確認變更狀態</h3>
                  </div>
                  
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    您即將把用戶 <span className="font-bold text-slate-900">「{confirmAction.userName}」</span> 的帳號狀態更改為：
                    <span className={`ml-1 font-bold px-2 py-0.5 rounded text-sm ${
                      confirmAction.newStatus === '活躍' ? 'bg-green-100 text-green-700' :
                      confirmAction.newStatus === '停權' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {confirmAction.newStatus}
                    </span>
                    <br/><br/>
                    請確認是否執行此操作？
                  </p>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleStatusChange(confirmAction.userId, confirmAction.newStatus)}
                      className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md active:scale-95"
                    >
                      確認變更
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // --- C. 財務與營收報表 ---
      case 'revenue':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">財務與營收報表</h2>
              <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50">
                匯出報表 (CSV)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80}/></div>
                <div className="relative z-10">
                  <p className="text-indigo-300 text-sm font-medium mb-1">當月總營收淨利</p>
                  <h3 className="text-4xl font-bold mb-4">$142,500</h3>
                  <div className="flex justify-between text-sm text-slate-300 border-t border-white/20 pt-4 mt-2">
                    <span>上月同期: $125,000</span>
                    <span className="text-green-400 font-bold flex items-center"><ArrowUpRight size={14}/> 14%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-500 mb-1">Pro 訂閱收入 (MRR)</p>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">$98,500</h3>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <p className="text-xs text-slate-400">佔總營收 70%</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-500 mb-1">Boost 加速器收入</p>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">$44,000</h3>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
                <p className="text-xs text-slate-400">佔總營收 30%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">近期金流交易紀錄</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-bold">交易序號</th>
                      <th className="px-6 py-4 font-bold">購買項目</th>
                      <th className="px-6 py-4 font-bold">付款方</th>
                      <th className="px-6 py-4 font-bold">金額 (TWD)</th>
                      <th className="px-6 py-4 font-bold">狀態</th>
                      <th className="px-6 py-4 font-bold">時間</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">{tx.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{tx.item}</td>
                        <td className="px-6 py-4 text-slate-600">{tx.user}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">${tx.amount}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs font-bold">{tx.status}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{tx.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="p-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Settings size={48} className="mx-auto mb-4 text-slate-300"/>
            <h3 className="font-bold text-slate-900 mb-2">系統設定</h3>
            <p>全域變數、前台橫幅控制與系統日誌開發中...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 側邊導覽列 (Admin Sidebar) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="text-indigo-500 w-6 h-6" />
            <span className="font-extrabold text-xl text-white tracking-tight">Admin Console</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard size={18}/> 營運總覽
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Users size={18}/> 用戶與權限管理
          </button>
          <button onClick={() => setActiveTab('revenue')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'revenue' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
            <PieChart size={18}/> 財務與營收報表
          </button>
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              <Settings size={18}/> 系統設定
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut size={18}/> 登出系統
          </button>
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 overflow-hidden flex flex-col h-screen">
        {/* Top Header (Mobile menu & User Profile) */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="md:hidden font-bold text-slate-900">Admin Console</div>
          <div className="flex-1 hidden md:block"></div> {/* Spacer */}
          
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-700 relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                A
              </div>
              <span className="text-sm font-bold text-slate-700 hidden sm:block">Super Admin</span>
            </div>
          </div>
        </header>

        {/* 渲染內容 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}