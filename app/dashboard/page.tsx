'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, FileText, Users, Mail, DollarSign, Settings, LogOut, Bell, 
  Briefcase, Plane, FileSignature, CheckCircle2, Search, Plus, MapPin, 
  CreditCard, TrendingUp, User, Calendar, Save, Image as ImageIcon, Camera, Upload, BarChart3, Building2, Info, X,
  Zap, Crown, Shield, Rocket, ListPlus
} from 'lucide-react';

// --- Firebase 核心引入 ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

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

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase 初始化失敗:", error);
  }
}

const internalAppId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'x-match-a83f0';

// 定義後台分頁
type Tab = 'overview' | 'projects' | 'trips' | 'contracts' | 'wallet' | 'settings';

interface ProjectData {
  id: string;
  title: string;
  category: string;
  type: string;
  location: string;
  totalValue: string;
  valueBreakdown: string;
  requirements: string;
  spots: number;
  status: string;
  applicants: number;
  date: string;
}

// 初始模擬案源資料 (用於第一次寫入 Firebase)
const MOCK_PROJECTS: ProjectData[] = [
  { id: '1', title: '海景房開箱體驗招募', category: '住宿', type: '互惠體驗', location: '屏東恆春', totalValue: 'NT$ 8,800', valueBreakdown: '海景房住宿($6800) + 早餐($800) + 接送($1200)', requirements: 'IG 貼文 1 則 + 限動 3 則 (需標記地點)', spots: 1, status: '招募中', applicants: 12, date: '2024/06/01' },
  { id: '2', title: '夏日餐飲新品推廣', category: '餐飲', type: '付費推廣', location: '台北大安', totalValue: 'NT$ 3,000', valueBreakdown: '餐點($1000) + 車馬費($2000)', requirements: 'Reels 短影音 1 支', spots: 3, status: '已關閉', applicants: 8, date: '2024/05/15' },
];

export default function DashboardPage() {
  // 狀態管理
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'business' | 'creator'>('business'); // 角色切換
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  // 案源管理相關狀態
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [newProject, setNewProject] = useState({
    title: '',
    category: '住宿',
    type: '互惠體驗',
    location: '屏東恆春',
    totalValue: '',
    valueBreakdown: '',
    requirements: '',
    spots: 1
  });

  // 登入處理
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => setIsLoggedIn(true), 800);
  };

  // 1. 處理 Firebase 身份驗證
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFbUser(user);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Firebase 匿名登入失敗:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. 監聽 Firestore 案源實時資料
  useEffect(() => {
    if (!db || !fbUser || !isLoggedIn) return;

    const projectsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'projects');
    const unsubProjects = onSnapshot(projectsCol, (snapshot) => {
      if (snapshot.empty) {
        // 如果資料庫是空的，自動植入初始案源資料
        MOCK_PROJECTS.forEach(p => setDoc(doc(projectsCol, String(p.id)), p));
      } else {
        const data = snapshot.docs.map(d => d.data() as ProjectData);
        // 依據 ID (時間戳或數字) 排序，確保最新的在最上面
        setProjects(data.sort((a, b) => Number(b.id) - Number(a.id)));
      }
    }, (err) => console.error("無法讀取案源資料:", err));

    return () => unsubProjects();
  }, [fbUser, isLoggedIn]);

  // 將新案源寫入 Firebase
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !fbUser) return;

    // 使用當下時間戳作為唯一 ID
    const newId = Date.now().toString();
    const projectToSave: ProjectData = {
      id: newId,
      title: newProject.title,
      category: newProject.category,
      type: newProject.type,
      location: newProject.location,
      totalValue: newProject.totalValue,
      valueBreakdown: newProject.valueBreakdown,
      requirements: newProject.requirements,
      spots: newProject.spots,
      status: '招募中',
      applicants: 0,
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
    };

    try {
      const projectRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'projects', newId);
      await setDoc(projectRef, projectToSave);
      setShowCreateModal(false);
      // 重置表單
      setNewProject({ ...newProject, title: '', totalValue: '', valueBreakdown: '', requirements: '' });
    } catch (err) {
      console.error("新增案源失敗:", err);
      alert("新增失敗，請檢查網路連線或 Firebase 權限。");
    }
  };

  // --- 1. 登入/註冊頁面 ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-indigo-900 opacity-50"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-extrabold mb-4">X-Match</h1>
              <p className="text-lg text-slate-200 mb-8">
                {authMode === 'login' ? '連結在地旅宿與優質創作者，開啟您的互惠旅程。' : '加入全台最大互惠平台，立即開始媒合。'}
              </p>
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
          
          <div className="md:w-1/2 p-12 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {authMode === 'login' ? '歡迎回來' : '建立您的帳號'}
            </h2>
            <p className="text-slate-500 mb-6 text-sm">
              {authMode === 'login' ? '請登入以繼續管理您的專案' : '免費加入，探索更多合作機會'}
            </p>
            
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button onClick={() => setRole('business')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === 'business' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Briefcase size={16}/> 我是商家
              </button>
              <button onClick={() => setRole('creator')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === 'creator' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <User size={16}/> 我是創作者
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                  <label className="block text-sm font-bold text-slate-700 mb-1">{role === 'business' ? '商家/品牌名稱' : '創作者暱稱'}</label>
                  <input type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all" placeholder={role === 'business' ? "例如：海角七號民宿" : "例如：林小美"} required />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input type="email" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all" placeholder="example@mail.com" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">密碼</label>
                <input type="password" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all" placeholder="••••••••" required />
              </div>
              <button type="submit" className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-sky-200 active:scale-95 transform duration-150">
                {authMode === 'login' ? '登入' : '免費註冊'} {role === 'business' ? '商家後台' : '創作者中心'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              {authMode === 'login' ? (
                <>還沒有帳號？ <button onClick={() => setAuthMode('register')} className="text-sky-600 font-bold hover:underline focus:outline-none">立即註冊</button></>
              ) : (
                <>已經有帳號了？ <button onClick={() => setAuthMode('login')} className="text-sky-600 font-bold hover:underline focus:outline-none">直接登入</button></>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. 後台主邏輯與內容渲染 ---

  const menuItems = role === 'business' ? [
    { id: 'overview', icon: LayoutDashboard, label: '總覽 Dashboard' },
    { id: 'projects', icon: Briefcase, label: '我的徵才 (案源)' },
    { id: 'trips', icon: Plane, label: '發出的邀請' },
    { id: 'contracts', icon: FileSignature, label: '合約管理' },
    { id: 'wallet', icon: CreditCard, label: '訂閱與點數' },
    { id: 'settings', icon: Settings, label: '商家設定' },
  ] : [
    { id: 'overview', icon: LayoutDashboard, label: '創作者中心' },
    { id: 'trips', icon: Plane, label: '我的許願行程' },
    { id: 'projects', icon: FileText, label: '我的應徵' },
    { id: 'contracts', icon: FileSignature, label: '合約管理' },
    { id: 'settings', icon: User, label: '履歷 (Media Kit)' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      
      // --- A. 總覽 Dashboard ---
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {role === 'business' ? '早安，海角七號民宿 👋' : '早安，林小美 👋'}
            </h2>
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
                    <p className="text-sm text-slate-500 mb-1">進行中案源</p>
                    <h3 className="text-3xl font-bold text-slate-900">{projects.length}</h3>
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
                    <p className="text-sm text-slate-500 mb-1">待簽署合約</p>
                    <h3 className="text-3xl font-bold text-amber-500">1</h3>
                  </div>
                </>
              )}
            </div>
            {/* 近期通知 */}
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
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">我的徵才 (案源管理)</h2>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md"
              >
                <ListPlus size={16}/> 新增案源
              </button>
            </div>
            
            {/* 案源列表 (連接 Firebase) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-bold">標題</th>
                      <th className="px-6 py-4 font-bold">分類</th>
                      <th className="px-6 py-4 font-bold">狀態</th>
                      <th className="px-6 py-4 font-bold">應徵人數</th>
                      <th className="px-6 py-4 font-bold">發布日期</th>
                      <th className="px-6 py-4 font-bold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{project.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{project.type} · {project.location}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                            {project.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            project.status === '招募中' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <Users size={14} className="text-slate-400"/> {project.applicants}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">{project.date}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sky-600 font-bold hover:underline">管理名單</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {projects.length === 0 && (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <Briefcase size={32} className="text-slate-300 mb-3" />
                  <p className="font-bold text-slate-700">尚未發布任何合作案源</p>
                  <p className="text-sm mt-1">點擊右上角「新增案源」開始招募創作者！</p>
                </div>
              )}
            </div>

            {/* --- 新增案源 Modal (寫入 Firebase) --- */}
            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-xl text-slate-900">發布新案源 (Cloud Sync)</h3>
                    <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                    <form className="space-y-4" onSubmit={handleCreateProject}>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">案源標題</label>
                        <input 
                          type="text" 
                          required
                          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" 
                          placeholder="例如：海景房開箱體驗招募"
                          value={newProject.title}
                          onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">類別</label>
                          <select 
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            value={newProject.category}
                            onChange={(e) => setNewProject({...newProject, category: e.target.value})}
                          >
                            <option>住宿</option>
                            <option>餐飲</option>
                            <option>體驗</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">合作模式</label>
                          <select 
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            value={newProject.type}
                            onChange={(e) => setNewProject({...newProject, type: e.target.value})}
                          >
                            <option>互惠體驗</option>
                            <option>付費推廣</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">地點</label>
                        <div className="flex items-center relative">
                           <MapPin size={16} className="absolute left-3 text-slate-400"/>
                           <input 
                             type="text" 
                             className="w-full pl-9 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                             value={newProject.location}
                             onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">總價值</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            placeholder="NT$ 8,800"
                            value={newProject.totalValue}
                            onChange={(e) => setNewProject({...newProject, totalValue: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">開放名額</label>
                          <input 
                            type="number" 
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            value={newProject.spots}
                            onChange={(e) => setNewProject({...newProject, spots: Number(e.target.value)})}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">價值拆解 (住宿+餐飲...)</label>
                        <input 
                          type="text" 
                          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                          placeholder="例如：住宿($3000) + 餐飲($1000)"
                          value={newProject.valueBreakdown}
                          onChange={(e) => setNewProject({...newProject, valueBreakdown: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">內容需求</label>
                        <textarea 
                          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none h-24 resize-none"
                          placeholder="例如：IG 貼文 1 則 + 限動 3 則..."
                          value={newProject.requirements}
                          onChange={(e) => setNewProject({...newProject, requirements: e.target.value})}
                        ></textarea>
                      </div>

                      <div className="pt-2">
                        <button type="submit" className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">
                          立即同步發布
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">已發送的邀請</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-sm text-slate-600">暫無邀請記錄</p>
            </div>
          </div>
        ) : (
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

      // --- D. 合約管理 (Contracts) ---
      case 'contracts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">合約管理</h2>
              <Link href="/calculator" className="text-sky-600 font-bold text-sm hover:underline flex items-center gap-1">
                <Plus size={16}/> 建立新合約
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg"><FileSignature size={24}/></div>
                  <div>
                    <h3 className="font-bold text-slate-900">暑期親子專案推廣合約</h3>
                    <p className="text-sm text-slate-500">{role === 'business' ? '合作對象：林小美' : '合作廠商：海角七號民宿'} • 2024/06/01</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><CheckCircle2 size={12}/> 生效中 Active</span>
                </div>
              </div>
            </div>
          </div>
        );

      // --- E. 錢包/訂閱 (Wallet) - 僅限業者 ---
      case 'wallet':
        return role === 'business' ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">訂閱與點數</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free Plan Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded mb-4 inline-block">目前方案</span>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Free 免費體驗版</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold text-slate-900">$0</span>
                    <span className="text-slate-500 ml-2">/ 月</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2"/> 每月 3 次合作邀請</li>
                    <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2"/> 查看所有公開行程許願池</li>
                    <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2"/> 基礎智能合約 (每月 1 份)</li>
                    <li className="flex items-center text-sm text-slate-400"><X className="w-4 h-4 text-slate-400 mr-2"/> 無法查看網紅深度數據</li>
                  </ul>
                  <button className="w-full py-2 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed">使用中</button>
                </div>
              </div>

              {/* Pro Plan Card */}
              <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 bg-yellow-400 text-indigo-900 text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    專業成長版 Pro <Crown size={20} className="text-yellow-400 fill-yellow-400"/>
                  </h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold">$999</span>
                    <span className="text-indigo-200 ml-2">/ 月</span>
                  </div>
                  <ul className="space-y-3 mb-6 text-indigo-100">
                    <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 text-white mr-2"/> 無限發送合作邀請</li>
                    <li className="flex items-center text-sm"><BarChart3 className="w-4 h-4 text-white mr-2"/> 網紅深度數據解鎖 (受眾分析)</li>
                    <li className="flex items-center text-sm"><Shield className="w-4 h-4 text-white mr-2"/> 無限使用智能合約與數位簽署</li>
                    <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 text-white mr-2"/> 優先客服支援</li>
                    <li className="flex items-center text-sm"><Zap className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-2"/> 贈送每月置頂推廣 ($300) 每月一次</li>
                    <li className="flex items-center text-sm"><Rocket className="w-4 h-4 text-sky-400 fill-sky-400 mr-2"/> 贈送每月精準推播 每月一次</li>
                  </ul>
                  <button className="w-full py-2 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">立即升級</button>
                </div>
              </div>
            </div>

            {/* Boost Options */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Rocket className="text-indigo-600" size={20}/> 單次付費推廣 (Boost)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform"><Zap size={20} fill="currentColor"/></div>
                    <span className="font-bold text-slate-900">$300</span>
                  </div>
                  <h4 className="font-bold text-slate-900">置頂推廣 (Featured)</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-3">讓您的徵才需求置頂 3 天，曝光加倍。</p>
                  <button className="text-xs font-bold text-indigo-600 hover:underline">購買點數 &rarr;</button>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-sky-100 text-sky-600 rounded-lg group-hover:scale-110 transition-transform"><Rocket size={20} fill="currentColor"/></div>
                    <span className="font-bold text-slate-900">$100</span>
                  </div>
                  <h4 className="font-bold text-slate-900">精準推播 (Smart Push)</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-3">主動推播給附近 10 位符合條件的網紅。</p>
                  <button className="text-xs font-bold text-indigo-600 hover:underline">購買點數 &rarr;</button>
                </div>
              </div>
            </div>
          </div>
        ) : null;

      // --- F. 設定/履歷 (Settings/Media Kit) ---
      case 'settings':
        return role === 'business' ? (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-900">編輯商家檔案 (Business Profile)</h2>
               <button className="hidden sm:flex bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold items-center gap-2 hover:bg-indigo-700">
                 <Save size={16}/> 儲存變更
               </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white p-6 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ImageIcon size={18}/> 商家封面圖</h3>
                   <div className="relative h-48 bg-slate-100 rounded-lg mb-6 flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-50">
                     <div className="text-center text-slate-400">
                       <Upload size={24} className="mx-auto mb-2"/>
                       <span className="text-sm">點擊上傳封面大圖</span>
                     </div>
                   </div>
                   
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ImageIcon size={18}/> 環境相簿 (Gallery)</h3>
                   <div className="grid grid-cols-3 gap-4">
                     {[1, 2, 3, 4, 5, 6].map((i) => (
                       <div key={i} className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-50">
                         <Plus size={24} className="text-slate-400"/>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Building2 size={18}/> 基本資料</h3>
                   
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">商家名稱</label>
                     <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="海角七號民宿" />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">所在地 (縣市/區域)</label>
                     <div className="flex items-center relative">
                        <MapPin size={16} className="absolute left-3 text-slate-400"/>
                        <input type="text" className="w-full pl-9 p-2 border border-slate-300 rounded-lg" defaultValue="屏東縣恆春鎮" />
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">類別</label>
                     <select className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="住宿">
                        <option>住宿</option>
                        <option>餐飲</option>
                        <option>體驗</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">標籤 (用逗號分隔)</label>
                     <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="海景, 早餐, 寵物友善" />
                   </div>

                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">關於商家 (Description)</label>
                     <textarea className="w-full p-2 border border-slate-300 rounded-lg h-32 resize-none" defaultValue="位於國境之南的隱密角落，海角七號民宿擁有絕佳的無敵海景..."></textarea>
                   </div>

                   <div className="pt-6 mt-2 border-t border-slate-100">
                     <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><DollarSign size={18}/> 互惠合作詳情</h3>
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">合作總價值</label>
                          <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="NT$ 8,800" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">開放名額</label>
                          <input type="number" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue={1} />
                        </div>
                     </div>

                     <div className="mb-4">
                       <label className="block text-sm font-bold text-slate-700 mb-1">價值拆解 (請用 + 號分隔)</label>
                       <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="海景房住宿($6800) + 早餐($800) + 接送($1200)" />
                       <p className="text-xs text-slate-500 mt-1">例如：住宿($3000) + 餐飲($1000)</p>
                     </div>

                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">內容需求</label>
                       <textarea className="w-full p-2 border border-slate-300 rounded-lg h-24 resize-none" defaultValue="IG 貼文 1 則 + 限動 3 則 (需標記地點)"></textarea>
                     </div>
                   </div>

                 </div>
               </div>
             </div>

             <div className="block sm:hidden mt-6 pb-6">
                <button className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl text-base font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg">
                  <Save size={18}/> 儲存所有變更
                </button>
             </div>
           </div>
        ) : (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-900">編輯履歷 (Media Kit)</h2>
               <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
                 <Save size={16}/> 儲存變更
               </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white p-6 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ImageIcon size={18}/> 形象照片</h3>
                   <div className="relative h-48 bg-slate-100 rounded-lg mb-4 flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-50">
                     <div className="text-center text-slate-400">
                       <Upload size={24} className="mx-auto mb-2"/>
                       <span className="text-sm">點擊上傳封面圖</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-100">
                       <Camera size={20} className="text-slate-400"/>
                     </div>
                     <div className="flex-1">
                       <p className="text-sm font-bold text-slate-700">個人頭像</p>
                       <p className="text-xs text-slate-500">建議尺寸 200x200px</p>
                     </div>
                   </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                   <h3 className="font-bold text-slate-900 mb-4">基本資料</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">顯示名稱</label>
                       <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="林小美" />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Handle (ID)</label>
                       <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="@may_travel" />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">所在地</label>
                       <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="台北市" />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">風格標籤 (用逗號分隔)</label>
                       <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="旅遊, 美食, 親子" />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">個人簡介 (Bio)</label>
                     <textarea className="w-full p-2 border border-slate-300 rounded-lg h-24 resize-none" defaultValue="專注於親子友善飯店與在地美食推廣，擁有高黏著度的媽媽社群。"></textarea>
                   </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ImageIcon size={18}/> 作品集展示</h3>
                   <div className="grid grid-cols-3 gap-4">
                     {[1, 2, 3].map((i) => (
                       <div key={i} className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-50">
                         <Plus size={24} className="text-slate-400"/>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="bg-white p-6 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><DollarSign size={18}/> 參考報價 (NT$)</h3>
                   <div className="space-y-3">
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-1">圖文貼文 (Post)</label>
                       <input type="number" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue={5000} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-1">限時動態 (Story)</label>
                       <input type="number" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue={1500} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-1">Reels 短影音</label>
                       <input type="number" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue={8000} />
                     </div>
                   </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 size={18}/> 受眾概況</h3>
                   <div className="space-y-3">
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-1">性別分佈</label>
                       <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="女性 85%" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-1">主力年齡層</label>
                       <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="25-34歲" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-1">熱門城市</label>
                       <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="台北/新北" />
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        );

      default:
        return <div className="p-10 text-center text-slate-500">功能開發中...</div>;
    }
  };

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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

          <div className="lg:col-span-3 min-h-[600px]">
            {renderContent()}
          </div>
        </div>
        
        {/* Firebase 連線狀態指示器 (對齊 Admin) */}
        {isLoggedIn && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-xl text-[9px] font-black text-slate-500 animate-in slide-in-from-bottom-5 z-50">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
             DB Sync: <span className="text-indigo-600 tracking-wider ml-1">{internalAppId.toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
}