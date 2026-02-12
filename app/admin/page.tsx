'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, DollarSign, Settings, LogOut, ShieldAlert, 
  TrendingUp, CheckCircle2, XCircle, MoreVertical, Search, ShieldCheck, 
  Activity, PieChart, ArrowUpRight, ArrowDownRight, FileText, Briefcase, Bell,
  AlertTriangle, Quote, Plus, Loader2
} from 'lucide-react';

// --- Firebase 核心引入 ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';

// --- Firebase 初始化 (終極防護版) ---
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

// 防護機制：只有在瀏覽器端，且「確實有讀取到 API Key」時才進行初始化
// 這可以完美避免 Next.js 在 npm run build 時因為找不到環境變數而崩潰
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase 初始化失敗:", error);
  }
}

// 依照 Firebase 規範定義資料儲存路徑的 ID
const internalAppId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'x-match-a83f0';

// 資料型別定義
type AdminTab = 'overview' | 'users' | 'revenue' | 'settings';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  status: string;
  joinDate: string;
}

interface TransactionData {
  id: string;
  user: string;
  item: string;
  amount: number;
  status: string;
  date: string;
}

// 初始模擬資料 (當資料庫為空時，自動寫入 Firebase 作為測試資料)
const MOCK_USERS: UserData[] = [
  { id: '1', name: '海角七號民宿', email: 'cape7@example.com', role: '商家', plan: 'Pro', status: '活躍', joinDate: '2024/02/15' },
  { id: '2', name: '林小美', email: 'may_travel@example.com', role: '創作者', plan: 'Free', status: '活躍', joinDate: '2024/01/10' },
  { id: '3', name: '山林秘境露營區', email: 'mountain@example.com', role: '商家', plan: 'Free', status: '待審核', joinDate: '2024/06/01' },
  { id: '4', name: 'Jason 攝影', email: 'jason@example.com', role: '創作者', plan: 'Free', status: '停權', joinDate: '2023/11/20' },
];

const MOCK_TX: TransactionData[] = [
  { id: 'TX-1049', user: '海角七號民宿', item: '專業成長版 Pro (月訂閱)', amount: 999, status: '成功', date: '2024/06/01 10:23' },
  { id: 'TX-1048', user: 'Ocean Blue 衝浪店', item: '單次置頂推廣 (Boost)', amount: 300, status: '成功', date: '2024/05/28 15:40' },
  { id: 'TX-1047', user: '老宅咖啡·午後', item: '精準推播 (Smart Push)', amount: 100, status: '成功', date: '2024/05/25 09:12' },
];

export default function AdminDashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  
  // UI 控制狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('全部角色');
  const [filterStatus, setFilterStatus] = useState('全部狀態');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{userId: string, userName: string, newStatus: string} | null>(null);

  // 首頁評價 CMS 控制狀態
  const [newTestimonial, setNewTestimonial] = useState({ quote: '', authorName: '', metricLabel: '' });
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);

  // Firestore 真實資料狀態
  const [users, setUsers] = useState<UserData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);

  // 登入模擬
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => setIsLoggedIn(true), 800);
  };

  // 1. 處理身份驗證 (取得資料庫讀寫權限)
  useEffect(() => {
    if (!auth) return; // 確保 Firebase 已在 Client 端初始化成功
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFbUser(user);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Firebase 匿名登入失敗，請檢查後台設定:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. 監聽 Firestore 實時資料
  useEffect(() => {
    if (!db || !fbUser || !isLoggedIn) return; // 確保取得 DB 實體才執行監聽

    // 監聽用戶列表
    const usersCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'users');
    const unsubUsers = onSnapshot(usersCol, (snapshot) => {
      if (snapshot.empty) {
        // 如果您的新資料庫目前是空的，自動植入種子資料方便測試
        MOCK_USERS.forEach(u => setDoc(doc(usersCol, u.id), u));
      } else {
        const data = snapshot.docs.map(d => d.data() as UserData);
        setUsers(data.sort((a, b) => Number(a.id) - Number(b.id)));
      }
    }, (err) => console.error("無法讀取用戶資料:", err));

    // 監聽交易紀錄
    const txCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'transactions');
    const unsubTx = onSnapshot(txCol, (snapshot) => {
      if (snapshot.empty) {
        MOCK_TX.forEach(tx => setDoc(doc(txCol, tx.id), tx));
      } else {
        const data = snapshot.docs.map(d => d.data() as TransactionData);
        setTransactions(data.sort((a, b) => b.id.localeCompare(a.id)));
      }
    }, (err) => console.error("無法讀取交易資料:", err));

    return () => { unsubUsers(); unsubTx(); };
  }, [fbUser, isLoggedIn]);

  // 搜尋與篩選邏輯
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === '全部角色' || u.role === filterRole;
    const matchStatus = filterStatus === '全部狀態' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  // 更新用戶狀態至 Firebase
  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!db || !fbUser) return;
    try {
      const userRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', userId);
      await updateDoc(userRef, { status: newStatus });
      setConfirmAction(null);
      setOpenMenuId(null);
    } catch (e) {
      console.error("更新用戶狀態失敗:", e);
      alert("更新失敗，請檢查 Firebase 權限規則");
    }
  };

  // 新增首頁評價 (CMS) 至 Firebase
  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !fbUser) {
      alert("尚未連線至資料庫，請稍候再試。");
      return;
    }
    setIsSubmittingTestimonial(true);
    
    try {
      const newId = `case-${Date.now()}`;
      const testimonialRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'testimonials', newId);
      
      await setDoc(testimonialRef, {
        id: newId,
        quote: newTestimonial.quote,
        authorName: newTestimonial.authorName,
        authorInitial: newTestimonial.authorName.charAt(0), // 自動抓取第一個字作為頭像代號
        authorLocation: "台灣優質用戶", // 預設地區
        metricIcon: 'TrendingUp', // 預設圖示
        metricLabel: newTestimonial.metricLabel,
        rating: 5, // 預設 5 星好評
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" // 預設美觀背景圖
      });
      
      alert("🎉 評價新增成功！前台首頁已即時同步更新。");
      setNewTestimonial({ quote: '', authorName: '', metricLabel: '' }); // 清空表單
    } catch (err) {
      console.error("新增評價失敗:", err);
      alert("新增失敗，請檢查 Firebase 權限設定。");
    } finally {
      setIsSubmittingTestimonial(false);
    }
  };

  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0) + 141101;

  // --- UI: 登入頁面 ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-indigo-100 p-3 rounded-xl inline-block mb-6 shadow-inner">
            <ShieldAlert className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">X-Match Admin</h1>
          <p className="text-slate-500 mb-8 text-sm italic underline">已連接至專案：{internalAppId}</p>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">系統管理員帳號</label>
              <input type="text" placeholder="admin" defaultValue="admin" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">安全存取密碼</label>
              <input type="password" placeholder="••••••••" defaultValue="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" />
            </div>
            <button className="w-full py-3.5 mt-2 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 text-sm uppercase tracking-widest">安全登入</button>
          </form>
        </div>
      </div>
    );
  }

  // --- UI: 管理介面內容 ---
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-bold text-slate-900">系統營運總覽</h2>
              <div className="text-xs text-slate-500 flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live Data
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: '總註冊用戶', value: users.length + 1848, trend: '+12%', icon: Users },
                { label: '活躍案源', value: 426, trend: '+8%', icon: Briefcase },
                { label: '本月總營收', value: `$${totalRevenue.toLocaleString()}`, trend: '+24%', color: 'text-emerald-600', icon: DollarSign },
                { label: '完成合約', value: 85, trend: '+5%', icon: FileText }
              ].map((kpi, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <kpi.icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{kpi.trend}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-1 font-black uppercase tracking-widest">{kpi.label}</p>
                  <h3 className={`text-3xl font-black ${kpi.color || 'text-slate-900'}`}>{kpi.value}</h3>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-6">營收趨勢分析 (Cloud Data)</h3>
                <div className="h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                   <Activity size={32} className="animate-pulse text-indigo-300" /> 
                   <p className="text-xs font-bold uppercase tracking-widest">Chart Visualization Pending...</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-6">待辦事項 (Needs Action)</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-orange-800">用戶實名審核</p>
                      <p className="text-xs text-orange-600 font-medium mt-0.5">有 {users.filter(u => u.status === '待審核').length} 筆待處理</p>
                    </div>
                    <button onClick={() => setActiveTab('users')} className="text-xs bg-white text-orange-600 font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-orange-100 transition-colors">前往審核</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-slate-900">用戶權限控管 (連線至 Firestore)</h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
              
              {/* 篩選工具列 */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" placeholder="搜尋姓名或 Email..." 
                    className="w-full pl-9 p-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <select className="flex-1 sm:flex-none border border-slate-200 rounded-xl p-2.5 text-sm bg-white font-bold text-slate-600 outline-none shadow-sm cursor-pointer" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option>全部角色</option><option>商家</option><option>創作者</option>
                  </select>
                  <select className="flex-1 sm:flex-none border border-slate-200 rounded-xl p-2.5 text-sm bg-white font-bold text-slate-600 outline-none shadow-sm cursor-pointer" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option>全部狀態</option><option>活躍</option><option>待審核</option><option>停權</option>
                  </select>
                </div>
              </div>

              {/* 資料表格 */}
              <div className="overflow-x-auto flex-grow pb-32">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-5">用戶資訊</th>
                      <th className="px-6 py-5">角色定位</th>
                      <th className="px-6 py-5">帳號狀態</th>
                      <th className="px-6 py-5 text-right">權限操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredUsers.length > 0 ? filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-base">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border ${
                            u.role === '商家' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit ${
                             u.status === '活躍' ? 'bg-green-100 text-green-700' : 
                             u.status === '停權' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                           }`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${u.status === '活躍' ? 'bg-green-600' : u.status === '停權' ? 'bg-red-600' : 'bg-orange-600'}`} />
                             {u.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none">
                            <MoreVertical size={18} />
                          </button>

                          {/* 彈出選單 */}
                          {openMenuId === u.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                              <div className="absolute right-6 top-12 w-40 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1.5 text-left animate-in fade-in zoom-in-95 duration-100">
                                {u.status !== '活躍' && <button onClick={() => setConfirmAction({userId: u.id, userName: u.name, newStatus: '活躍'})} className="w-full px-4 py-2.5 hover:bg-green-50 text-xs font-black text-green-600 flex items-center gap-2"><CheckCircle2 size={14}/>設為活躍</button>}
                                {u.status !== '停權' && <button onClick={() => setConfirmAction({userId: u.id, userName: u.name, newStatus: '停權'})} className="w-full px-4 py-2.5 hover:bg-red-50 text-xs font-black text-red-600 flex items-center gap-2"><XCircle size={14}/>停權帳號</button>}
                                <button onClick={() => setConfirmAction({userId: u.id, userName: u.name, newStatus: '待審核'})} className="w-full px-4 py-2.5 hover:bg-orange-50 text-xs font-black text-orange-600 border-t border-slate-100 flex items-center gap-2 mt-1 pt-2"><ShieldAlert size={14}/>退回審核</button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">尚未找到任何用戶資料或正在載入中...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 確認對話框 */}
            {confirmAction && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3 mb-4 text-amber-500">
                    <div className="p-3 bg-amber-50 rounded-2xl"><AlertTriangle size={24}/></div>
                    <h3 className="font-black text-xl text-slate-900">變更狀態確認</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-8 leading-relaxed font-medium">
                    確定要將用戶 「<span className="font-black text-slate-900">{confirmAction.userName}</span>」 變更為 <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{confirmAction.newStatus}</span> 嗎？<br/><br/>此操作將永久寫入您的 Firebase 資料庫。
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmAction(null)} className="flex-1 py-3.5 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all">取消操作</button>
                    <button onClick={() => handleStatusChange(confirmAction.userId, confirmAction.newStatus)} className="flex-1 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 shadow-lg active:scale-95 transition-all">確認寫入</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'revenue':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">財務報表 (Syncing)</h2>
            </div>

            <div className="bg-slate-900 p-10 rounded-3xl text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
               <p className="text-indigo-300 font-black mb-2 uppercase tracking-widest text-[10px]">Total Accumulated Revenue</p>
               <h3 className="text-6xl font-black tracking-tighter">${totalRevenue.toLocaleString()}</h3>
               <div className="mt-8 flex items-center gap-4">
                 <div className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2.5 py-1 rounded-lg text-xs font-black">
                   <ArrowUpRight size={14} /> +14.2%
                 </div>
                 <p className="text-slate-400 text-xs font-bold italic tracking-wider">MOM GROWTH</p>
               </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
               <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
                  <h4 className="font-black text-slate-900 text-xs flex items-center gap-2 uppercase tracking-widest"><DollarSign size={14} className="text-indigo-500"/> Recent Transactions</h4>
                  <button className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-widest">Export CSV</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-white border-b text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-6 py-5">Item Details</th>
                        <th className="px-6 py-5 text-right">Amount (TWD)</th>
                        <th className="px-6 py-5 text-right">Timestamp</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 font-medium">
                      {transactions.length > 0 ? transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                             <p className="font-bold text-slate-900">{tx.item}</p>
                             <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">{tx.user} • {tx.id}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-indigo-600 text-base">${tx.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-slate-400 text-[10px] font-mono">{tx.date}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={3} className="px-6 py-16 text-center text-slate-400 font-bold italic text-xs tracking-widest">SYNCHRONIZING WITH CLOUD STORAGE...</td></tr>
                      )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">系統設定與 CMS</h2>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-widest uppercase">Admin Level</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Testimonials CMS */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                    <Quote className="text-sky-500" size={24} />
                    首頁評價管理 (Testimonials)
                  </h3>
                  <p className="text-sm text-slate-500 mb-8 font-medium">
                    在此新增的成功案例將會「即時同步」顯示於前台首頁的「聽聽他們怎麼說」區塊。
                  </p>

                  <form onSubmit={handleAddTestimonial} className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">評價內容 (Quote) <span className="text-red-500">*</span></label>
                      <textarea 
                        required
                        placeholder="例如：自從使用了 X-Match，我們的訂房率提升了 30%！"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium text-slate-700 h-28 resize-none"
                        value={newTestimonial.quote}
                        onChange={(e) => setNewTestimonial({...newTestimonial, quote: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">提供者名稱 <span className="text-red-500">*</span></label>
                        <input 
                          required
                          type="text" 
                          placeholder="例如：海角七號民宿"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-bold text-slate-700"
                          value={newTestimonial.authorName}
                          onChange={(e) => setNewTestimonial({...newTestimonial, authorName: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">成效數字 <span className="text-red-500">*</span></label>
                        <input 
                          required
                          type="text" 
                          placeholder="例如：轉換率 +30%"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-bold text-slate-700"
                          value={newTestimonial.metricLabel}
                          onChange={(e) => setNewTestimonial({...newTestimonial, metricLabel: e.target.value})}
                        />
                      </div>
                    </div>

                    <button 
                      disabled={isSubmittingTestimonial}
                      type="submit" 
                      className="w-full py-4 mt-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 text-sm uppercase tracking-widest flex justify-center items-center gap-2 disabled:opacity-70"
                    >
                      {isSubmittingTestimonial ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18} />}
                      {isSubmittingTestimonial ? '正在寫入雲端...' : '發布至前台首頁'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Other Settings (Placeholder) */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 border-dashed flex flex-col items-center justify-center text-center">
                <Settings size={40} className="text-slate-300 mb-4 animate-[spin_6s_linear_infinite]" />
                <h3 className="font-black text-slate-900 mb-2 uppercase tracking-widest">進階系統設定</h3>
                <p className="text-slate-500 text-sm max-w-xs font-medium">
                  全域參數、API 限制與安全規則，目前於開發模式中鎖定。
                </p>
                <span className="mt-6 px-4 py-1.5 bg-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-full">Locked</span>
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 側邊導覽 - Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col h-screen sticky top-0 shadow-2xl z-20">
        <div className="p-8 border-b border-slate-800/50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-indigo-600 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-indigo-600/20">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-xl text-white tracking-tighter uppercase italic">X-Match <span className="text-indigo-400 text-[10px] block font-black tracking-[0.3em] not-italic mt-0.5">Control Panel</span></span>
          </Link>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: '營運總覽' },
            { id: 'users', icon: Users, label: '用戶管理' },
            { id: 'revenue', icon: DollarSign, label: '財務報表' },
            { id: 'settings', icon: Settings, label: '系統設定' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={16}/> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800/50">
           <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={16}/> 登出系統</button>
        </div>
      </aside>

      {/* 主工作區 */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
           <div className="md:hidden"><ShieldCheck className="text-indigo-600 w-6 h-6" /></div>
           <div className="flex-1"></div>
           <div className="flex items-center gap-6">
              <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
              </button>
              <div className="w-px h-6 bg-slate-100" />
              <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Super Admin</p>
                    <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">● System Online</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-black text-xs shadow-md border border-slate-700">AD</div>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
           <div className="max-w-6xl mx-auto">
              {renderContent()}
           </div>
           
           <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-xl text-[9px] font-black text-slate-500 animate-in slide-in-from-bottom-5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              DB Sync: <span className="text-indigo-600 tracking-wider ml-1">{internalAppId.toUpperCase()}</span>
           </div>
        </div>
      </main>
    </div>
  );
}