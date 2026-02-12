'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, FileText, Users, Mail, DollarSign, Settings, LogOut, Bell, 
  Briefcase, Plane, FileSignature, CheckCircle2, Search, Plus, MapPin, 
  CreditCard, TrendingUp, User, Calendar, Save, Image as ImageIcon, Camera, Upload, BarChart3, Building2, Info, X,
  Zap, Crown, Shield, Rocket, ListPlus, Loader2, Landmark
} from 'lucide-react';

// --- Firebase 核心引入 ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
let storage: any = null;

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app); // 初始化 Storage
  } catch (error) {
    console.error("Firebase 初始化失敗:", error);
  }
}

const internalAppId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'x-match-a83f0';

// 定義資料型別
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
  image?: string;
  gallery?: string[];
}

interface TripData {
  id: string;
  creatorName: string;
  destination: string;
  dates: string;
  partySize: string;
  purpose: string;
  needs: string;
  status: string;
  offers: number;
}

interface PaymentItem {
  id: string;
  name: string;
  price: number;
  type: 'subscription' | 'one-time';
}

// 初始模擬資料
const MOCK_PROJECTS: ProjectData[] = [];
const MOCK_TRIPS: TripData[] = [];

export default function DashboardPage() {
  // 狀態管理
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'business' | 'creator'>('business');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  // 案源管理相關狀態 (業者)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [newProject, setNewProject] = useState({
    title: '',
    category: '住宿',
    type: '互惠體驗',
    location: '',
    totalValue: '',
    valueBreakdown: '',
    requirements: '',
    spots: 1,
    gallery: [] as string[]
  });
  const [isUploading, setIsUploading] = useState(false);

  // 許願行程相關狀態 (創作者)
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [newTrip, setNewTrip] = useState({
    destination: '',
    dates: '',
    partySize: '1人',
    purpose: '',
    needs: ''
  });

  // 金流付款相關狀態
  const [purchaseItem, setPurchaseItem] = useState<PaymentItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer'>('credit_card');
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');

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

  // 2. 監聽 Firestore 實時資料
  useEffect(() => {
    if (!db || !fbUser || !isLoggedIn) return;

    const projectsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'projects');
    const unsubProjects = onSnapshot(projectsCol, (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as ProjectData);
      setProjects(data.sort((a, b) => Number(b.id) - Number(a.id)));
    }, (err) => console.error("無法讀取案源資料:", err));

    const tripsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'trips');
    const unsubTrips = onSnapshot(tripsCol, (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as TripData);
      setTrips(data.sort((a, b) => b.id.localeCompare(a.id)));
    }, (err) => console.error("無法讀取行程資料:", err));

    return () => {
      unsubProjects();
      unsubTrips();
    };
  }, [fbUser, isLoggedIn]);

  // 處理真實照片上傳至 Firebase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // 精準的錯誤提示
    if (!storage) {
      alert("Firebase Storage 尚未初始化！\n\n請至 Firebase 後台左側選單點擊「Storage」>「Get Started」並啟用服務。");
      return;
    }
    if (!fbUser) {
      alert("系統正在為您取得寫入權限，請等候幾秒鐘再試。");
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileRef = ref(storage, `artifacts/${internalAppId}/public/data/images/${Date.now()}_${file.name}`);
        const uploadTask = await uploadBytesResumable(fileRef, file);
        const downloadURL = await getDownloadURL(uploadTask.ref);
        uploadedUrls.push(downloadURL);
      }
      
      setNewProject(prev => ({ 
        ...prev, 
        gallery: [...prev.gallery, ...uploadedUrls] 
      }));
    } catch (error) {
      console.error("上傳失敗:", error);
      alert("照片上傳失敗！\n請確認您的 Firebase Storage 是否已開啟，且規則設為「測試模式」。");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setNewProject(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // 將新案源寫入 Firebase
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title) { alert("請輸入「案源標題」！"); return; }
    if (!newProject.location) { alert("請輸入「地點」！"); return; }
    if (!db || !fbUser) { alert("尚未連線至資料庫，請稍候再試。"); return; }

    const newId = Date.now().toString();
    const projectToSave: ProjectData = {
      id: newId,
      title: newProject.title,
      category: newProject.category,
      type: newProject.type,
      location: newProject.location,
      totalValue: newProject.totalValue || 'NT$ 未定',
      valueBreakdown: newProject.valueBreakdown,
      requirements: newProject.requirements,
      spots: newProject.spots,
      status: '招募中',
      applicants: 0,
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      image: newProject.gallery.length > 0 ? newProject.gallery[0] : "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      gallery: newProject.gallery
    };

    try {
      const projectRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'projects', newId);
      await setDoc(projectRef, projectToSave);
      setShowCreateModal(false);
      setNewProject({ title: '', category: '住宿', type: '互惠體驗', location: '', totalValue: '', valueBreakdown: '', requirements: '', spots: 1, gallery: [] });
    } catch (err) {
      console.error("新增案源失敗:", err);
      alert("新增失敗，請檢查 Firebase 權限。");
    }
  };

  // 將新許願行程寫入 Firebase
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.destination) { alert("請填寫目的地！"); return; }
    if (!db || !fbUser) { alert("尚未連線至資料庫，請稍候再試。"); return; }

    const newId = `t${Date.now()}`;
    const tripToSave: TripData = {
      id: newId,
      creatorName: '林小美',
      destination: newTrip.destination,
      dates: newTrip.dates,
      partySize: newTrip.partySize,
      purpose: newTrip.purpose,
      needs: newTrip.needs,
      status: '招募中',
      offers: 0
    };

    try {
      const tripRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'trips', newId);
      await setDoc(tripRef, tripToSave);
      setShowCreateTripModal(false);
      setNewTrip({ destination: '', dates: '', partySize: '1人', purpose: '', needs: '' });
    } catch (err) {
      console.error("新增行程失敗:", err);
    }
  };

  const handlePaymentSubmit = async () => {
    setPaymentStep('processing');
    setTimeout(async () => {
      if (db && fbUser && purchaseItem) {
        try {
          const newTxId = `TX-${Date.now().toString().slice(-6)}`;
          const txRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'transactions', newTxId);
          await setDoc(txRef, {
            id: newTxId,
            user: role === 'business' ? '海角七號民宿' : '林小美',
            item: purchaseItem.name,
            amount: purchaseItem.price,
            status: '成功',
            date: new Date().toLocaleString('zh-TW', { hour12: false })
          });
        } catch (err) {
          console.error("寫入交易紀錄失敗:", err);
        }
      }
      setPaymentStep('success');
    }, 2000);
  };

  // --- 1. 登入/註冊頁面 ---
  if (!isLoggedIn) {
    return (
      // 改用 z-[9999] 確保絕對置頂，覆蓋掉任何外部的 Navbar
      <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto">
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
            <div className="mb-8">
              <Link href="/" className="text-sm font-bold text-slate-400 hover:text-sky-600 transition-colors">
                &larr; 返回前台首頁
              </Link>
            </div>
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

            {/* --- 新增案源 Modal (寫入 Firebase) 包含互惠詳情與相簿 --- */}
            {showCreateModal && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                      <ListPlus size={20} className="text-sky-500"/> 發布新案源 (Cloud Sync)
                    </h3>
                    <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                    <form className="space-y-6" onSubmit={handleCreateProject}>
                      
                      {/* Section 1: 基本設定 */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-sky-500 pl-2">基本設定</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">案源標題 <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" 
                              placeholder="例如：海景房開箱體驗招募"
                              value={newProject.title}
                              onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">類別</label>
                              <select 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                                value={newProject.category}
                                onChange={(e) => setNewProject({...newProject, category: e.target.value})}
                              >
                                <option>住宿</option>
                                <option>餐飲</option>
                                <option>體驗</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">地點 <span className="text-red-500">*</span></label>
                              <div className="flex items-center relative">
                                 <MapPin size={16} className="absolute left-3 text-slate-400"/>
                                 <input 
                                   type="text" 
                                   className="w-full pl-9 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                                   placeholder="例如：屏東恆春"
                                   value={newProject.location}
                                   onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                                 />
                              </div>
                            </div>
                          </div>

                          {/* 真實照片上傳功能 */}
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">上傳環境相簿 (Gallery)</label>
                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar items-center">
                              <label className="shrink-0 w-20 h-20 bg-slate-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 text-slate-400 transition-colors relative overflow-hidden">
                                {isUploading ? (
                                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                ) : (
                                  <>
                                    <Plus size={24} />
                                    <span className="text-[10px] mt-1 font-bold">選擇照片</span>
                                  </>
                                )}
                                <input 
                                  type="file" 
                                  multiple 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleFileUpload} 
                                  disabled={isUploading}
                                />
                              </label>
                              {newProject.gallery.map((img, idx) => (
                                <div key={idx} className="shrink-0 w-20 h-20 bg-slate-200 rounded-lg overflow-hidden relative group shadow-sm">
                                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemovePhoto(idx)} 
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                              支援多圖上傳，第一張將預設為前台封面主圖。(需在 Firebase 後台開啟 Storage 服務)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: 互惠合作詳情 */}
                      <div className="pt-2">
                        <h4 className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-indigo-500 pl-2">互惠合作詳情</h4>
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">合作模式</label>
                              <select 
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={newProject.type}
                                onChange={(e) => setNewProject({...newProject, type: e.target.value})}
                              >
                                <option>互惠體驗</option>
                                <option>付費推廣</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">開放名額</label>
                              <input 
                                type="number" min="1"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={newProject.spots}
                                onChange={(e) => setNewProject({...newProject, spots: Number(e.target.value)})}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">合作總價值 (前台顯示金額)</label>
                              <input 
                                type="text" 
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-600 placeholder:font-normal"
                                placeholder="例如：NT$ 8,800"
                                value={newProject.totalValue}
                                onChange={(e) => setNewProject({...newProject, totalValue: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">價值拆解 (請用 + 號分隔)</label>
                              <input 
                                type="text" 
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                placeholder="例如：住宿($6800) + 早餐($800)"
                                value={newProject.valueBreakdown}
                                onChange={(e) => setNewProject({...newProject, valueBreakdown: e.target.value})}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">交付內容需求</label>
                            <textarea 
                              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm"
                              placeholder="例如：IG 貼文 1 則 + 限動 3 則 (需標記地點)..."
                              value={newProject.requirements}
                              onChange={(e) => setNewProject({...newProject, requirements: e.target.value})}
                            ></textarea>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200">
                        <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">
                          <CheckCircle2 size={18} /> 立即同步發布
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
              <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">海景房開箱體驗招募</h3>
                    <p className="text-sm text-slate-500">海角七號民宿 • 屏東恆春</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">審核中</span>
                  <p className="text-xs text-slate-400 mt-2">2 天前申請</p>
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
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">您尚未向任何創作者發送邀請</p>
              <button className="mt-3 text-sm text-indigo-600 font-bold hover:underline">前往「行程許願池」尋找適合的對象</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">我的許願行程</h2>
              <button 
                onClick={() => setShowCreateTripModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md active:scale-95 transition-all"
              >
                <Plus size={16}/> 發布新行程
              </button>
            </div>
            
            {/* 創作者行程列表 (連接 Firebase) */}
            <div className="grid grid-cols-1 gap-6">
               {trips.length > 0 ? (
                 trips.map(trip => (
                  <div key={trip.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          trip.status === '招募中' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {trip.status}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <MapPin size={18} className="text-indigo-500" />
                          {trip.destination}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-4 bg-slate-50 p-2 rounded-lg inline-flex border border-slate-100">
                        <span className="flex items-center gap-1"><Calendar size={14} className="text-slate-400"/> {trip.dates}</span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1"><Users size={14} className="text-slate-400"/> {trip.partySize}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-slate-700"><span className="text-xs font-bold text-slate-400 mr-2 bg-slate-100 px-1.5 py-0.5 rounded">目的</span> {trip.purpose}</p>
                        <p className="text-sm text-slate-700"><span className="text-xs font-bold text-slate-400 mr-2 bg-slate-100 px-1.5 py-0.5 rounded">許願</span> {trip.needs}</p>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center items-center min-w-[150px]">
                      <p className="text-xs text-slate-500 mb-1">目前收到</p>
                      <p className="text-4xl font-black text-indigo-600 mb-1">{trip.offers}</p>
                      <p className="text-xs text-slate-500 font-medium">間廠商邀請</p>
                      <button className="mt-4 w-full py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors">查看邀請</button>
                    </div>
                  </div>
                 ))
               ) : (
                 <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center">
                    <Plane size={32} className="text-slate-300 mb-3" />
                    <p className="font-bold text-slate-700">尚未發布任何行程</p>
                    <p className="text-sm text-slate-500 mt-1">主動告訴廠商您的旅遊計畫，獲取更多專屬贊助機會！</p>
                 </div>
               )}
            </div>

            {/* --- 新增許願行程 Modal (寫入 Firebase) --- */}
            {showCreateTripModal && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                      <Plane size={20} className="text-indigo-500" /> 發布許願行程
                    </h3>
                    <button onClick={() => setShowCreateTripModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                    <form className="space-y-4" onSubmit={handleCreateTrip}>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">目的地 (城市/區域) <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                          placeholder="例如：宜蘭礁溪、台南中西區"
                          value={newTrip.destination}
                          onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">預計日期</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                            placeholder="例如：2024/07/15 - 07/17"
                            value={newTrip.dates}
                            onChange={(e) => setNewTrip({...newTrip, dates: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">隨行人數</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                            placeholder="例如：2大1小、單人"
                            value={newTrip.partySize}
                            onChange={(e) => setNewTrip({...newTrip, partySize: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">行程目的 (將產出什麼內容？)</label>
                        <textarea 
                          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm"
                          placeholder="例如：家庭暑假旅遊，預計會拍攝兩支短影音介紹親子友善設施。"
                          value={newTrip.purpose}
                          onChange={(e) => setNewTrip({...newTrip, purpose: e.target.value})}
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">許願需求 (希望廠商提供什麼？)</label>
                        <textarea 
                          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm"
                          placeholder="例如：尋求有溫泉設施的飯店住宿贊助兩晚，或周邊親子餐廳體驗。"
                          value={newTrip.needs}
                          onChange={(e) => setNewTrip({...newTrip, needs: e.target.value})}
                        ></textarea>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all flex justify-center items-center gap-2">
                          確認發布
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
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
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
                <div className="relative z-10 flex-grow">
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
                </div>
                <div className="mt-auto">
                  <button className="w-full py-2 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed">使用中</button>
                </div>
              </div>

              {/* Pro Plan Card */}
              <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl relative overflow-hidden text-white flex flex-col">
                <div className="absolute top-0 right-0 bg-yellow-400 text-indigo-900 text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                <div className="relative z-10 flex-grow">
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
                </div>
                <div className="mt-auto">
                  <button 
                    onClick={() => {
                      setPurchaseItem({ id: 'pro', name: '專業成長版 Pro (月費)', price: 999, type: 'subscription' });
                      setPaymentStep('form');
                    }}
                    className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg active:scale-95"
                  >
                    立即升級 Pro
                  </button>
                </div>
              </div>
            </div>

            {/* Boost Options */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Rocket className="text-indigo-600" size={20}/> 單次付費推廣 (Boost)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group cursor-pointer flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform"><Zap size={20} fill="currentColor"/></div>
                    <span className="font-bold text-slate-900">$300</span>
                  </div>
                  <h4 className="font-bold text-slate-900 flex-grow">置頂推廣 (Featured)</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">讓您的徵才需求置頂 3 天，曝光加倍。</p>
                  <button 
                    onClick={() => {
                      setPurchaseItem({ id: 'boost-featured', name: '置頂推廣 (單次)', price: 300, type: 'one-time' });
                      setPaymentStep('form');
                    }}
                    className="mt-auto text-xs font-bold text-indigo-600 hover:underline text-left"
                  >
                    購買點數 &rarr;
                  </button>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group cursor-pointer flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-sky-100 text-sky-600 rounded-lg group-hover:scale-110 transition-transform"><Rocket size={20} fill="currentColor"/></div>
                    <span className="font-bold text-slate-900">$100</span>
                  </div>
                  <h4 className="font-bold text-slate-900 flex-grow">精準推播 (Smart Push)</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">主動推播給附近 10 位符合條件的網紅。</p>
                  <button 
                    onClick={() => {
                      setPurchaseItem({ id: 'boost-push', name: '精準推播 (單次)', price: 100, type: 'one-time' });
                      setPaymentStep('form');
                    }}
                    className="mt-auto text-xs font-bold text-indigo-600 hover:underline text-left"
                  >
                    購買點數 &rarr;
                  </button>
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
               <h2 className="text-2xl font-bold text-slate-900">基本資料設定</h2>
               <button 
                 onClick={() => alert("儲存成功！")}
                 className="hidden sm:flex bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
               >
                 <Save size={16}/> 儲存變更
               </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1 space-y-6">
                 {/* 僅保留 Logo 封面圖，相簿與互惠內容移至新增案源 */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ImageIcon size={18}/> 商家封面圖 (Logo)</h3>
                   <div className="relative h-48 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-50">
                     <div className="text-center text-slate-400">
                       <Upload size={24} className="mx-auto mb-2"/>
                       <span className="text-sm font-bold">點擊上傳封面大圖</span>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Building2 size={18}/> 商家資訊</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">商家名稱</label>
                       <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" defaultValue="海角七號民宿" />
                     </div>
                     
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">所在地 (縣市/區域)</label>
                       <div className="flex items-center relative">
                          <MapPin size={16} className="absolute left-3 text-slate-400"/>
                          <input type="text" className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" defaultValue="屏東縣恆春鎮" />
                       </div>
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">主營類別</label>
                       <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none">
                          <option>住宿</option>
                          <option>餐飲</option>
                          <option>體驗</option>
                       </select>
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">特色標籤 (用逗號分隔)</label>
                       <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" defaultValue="海景, 早餐, 寵物友善" />
                     </div>
                   </div>

                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">關於商家 (品牌介紹)</label>
                     <textarea className="w-full p-3 border border-slate-300 rounded-lg h-32 resize-none text-sm focus:ring-2 focus:ring-sky-500 outline-none" defaultValue="位於國境之南的隱密角落，海角七號民宿擁有絕佳的無敵海景。我們致力於提供旅人最放鬆的度假體驗..."></textarea>
                   </div>
                 </div>
               </div>
             </div>

             <div className="block sm:hidden mt-6 pb-6">
                <button 
                  onClick={() => alert("儲存成功！")}
                  className="w-full bg-slate-900 text-white px-4 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg"
                >
                  <Save size={18}/> 儲存所有變更
                </button>
             </div>
           </div>
        ) : (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-900">編輯履歷 (Media Kit)</h2>
               <button 
                 onClick={() => alert("履歷更新成功！")}
                 className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
               >
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
                       <span className="text-sm font-bold">點擊上傳封面圖</span>
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
                       <label className="block text-xs font-bold text-slate-500 mb-1">顯示名稱</label>
                       <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" defaultValue="林小美" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Handle (ID)</label>
                       <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" defaultValue="@may_travel" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">所在地</label>
                       <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" defaultValue="台北市" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">風格標籤 (用逗號分隔)</label>
                       <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" defaultValue="旅遊, 美食, 親子" />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">個人簡介 (Bio)</label>
                     <textarea className="w-full p-3 border border-slate-300 rounded-lg h-24 resize-none text-sm outline-none focus:ring-2 focus:ring-indigo-500" defaultValue="專注於親子友善飯店與在地美食推廣，擁有高黏著度的媽媽社群。"></textarea>
                   </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ImageIcon size={18}/> 作品集展示</h3>
                   <div className="grid grid-cols-3 gap-4">
                     {[1, 2, 3].map((i) => (
                       <div key={i} className="aspect-square bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-100">
                         <Plus size={24} className="text-slate-400"/>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><DollarSign size={18} className="text-green-600"/> 參考報價 (NT$)</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">圖文貼文 (Post)</label>
                       <input type="number" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none" defaultValue={5000} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">限時動態 (Story)</label>
                       <input type="number" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none" defaultValue={1500} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Reels 短影音</label>
                       <input type="number" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none" defaultValue={8000} />
                     </div>
                   </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500"/> 受眾概況</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">性別分佈</label>
                       <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none" defaultValue="女性 85%" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">主力年齡層</label>
                       <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none" defaultValue="25-34歲" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">熱門城市</label>
                       <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none" defaultValue="台北/新北" />
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
    // 改用 z-[9999] 確保絕對置頂，覆蓋掉任何外部的 Navbar
    <div className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col overflow-y-auto m-0 p-0">
      
      {/* 頂部導覽 (後台專用) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Link href="/" className="font-extrabold text-2xl text-sky-500 tracking-tight font-sans hover:opacity-80 transition-opacity">
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

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative flex-grow">
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
              <Link 
                href="/"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg mt-8 transition-colors"
              >
                <LogOut size={18} />
                登出回首頁
              </Link>
            </nav>
          </div>

          <div className="lg:col-span-3 min-h-[600px]">
            {renderContent()}
          </div>
        </div>
        
        {/* Firebase 連線狀態指示器 */}
        {isLoggedIn && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-xl text-[9px] font-black text-slate-500 animate-in slide-in-from-bottom-5 z-40">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
             DB Sync: <span className="text-indigo-600 tracking-wider ml-1">{internalAppId.toUpperCase()}</span>
          </div>
        )}

        {/* --- 金流付款彈出視窗 (Payment Modal) --- */}
        {purchaseItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200 flex flex-col">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-slate-900">結帳確認</h3>
                {paymentStep === 'form' && (
                  <button onClick={() => setPurchaseItem(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Step 1: Payment Form */}
              {paymentStep === 'form' && (
                <div className="p-6 overflow-y-auto">
                  {/* Order Summary */}
                  <div className="bg-indigo-50 p-4 rounded-xl mb-6 border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-bold mb-1 uppercase tracking-wider">購買項目</p>
                    <div className="flex justify-between items-end">
                      <p className="font-bold text-slate-900 text-lg">{purchaseItem.name}</p>
                      <p className="font-black text-2xl text-indigo-700">
                        NT$ {purchaseItem.price} <span className="text-sm font-normal text-slate-500">{purchaseItem.type === 'subscription' ? '/ 月' : '/ 次'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Payment Method Tabs */}
                  <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
                    <button 
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'credit_card' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    >
                      <CreditCard size={16}/> 信用卡
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'bank_transfer' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    >
                      <Landmark size={16}/> 銀行匯款
                    </button>
                  </div>

                  {/* Credit Card Form (Mock) */}
                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">信用卡卡號</label>
                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-500 mb-1">有效期限</label>
                          <input type="text" placeholder="MM/YY" className="w-full p-3 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-500 mb-1">安全碼 (CVC)</label>
                          <input type="text" placeholder="123" className="w-full p-3 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Info (Mock) */}
                  {paymentMethod === 'bank_transfer' && (
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-right-2">
                      <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Info size={16} className="text-sky-500" /> 請匯款至以下專屬虛擬帳號：
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-xs text-slate-500">銀行代碼</span>
                          <span className="font-bold text-slate-700">808 (玉山銀行)</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-xs text-slate-500">繳款帳號</span>
                          <span className="font-mono font-bold text-indigo-600 text-lg tracking-wider">9876-5432-1098</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">應繳金額</span>
                          <span className="font-bold text-slate-700">NT$ {purchaseItem.price}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        * 此虛擬帳號限本次交易使用。<br/>
                        * 轉帳完成後系統將自動為您開通權限，無需額外回報。
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-8">
                    <button 
                      onClick={handlePaymentSubmit}
                      className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                    >
                      {paymentMethod === 'credit_card' ? '確認付款' : '我已了解，建立虛擬帳號'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Processing */}
              {paymentStep === 'processing' && (
                <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <h3 className="font-bold text-lg text-slate-900 mb-2">安全處理中...</h3>
                  <p className="text-sm text-slate-500">請勿關閉視窗或重新整理頁面</p>
                </div>
              )}

              {/* Step 3: Success */}
              {paymentStep === 'success' && (
                <div className="p-8 text-center min-h-[300px] flex flex-col justify-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">交易成功！</h3>
                  <p className="text-sm text-slate-600 mb-8">
                    感謝您的購買，您的「{purchaseItem.name}」權限已開通。<br/>
                    電子發票將發送至您的註冊信箱。
                  </p>
                  <button 
                    onClick={() => {
                      setPurchaseItem(null);
                      setActiveTab('overview'); // 付款完跳回總覽
                    }}
                    className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    返回總覽
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}