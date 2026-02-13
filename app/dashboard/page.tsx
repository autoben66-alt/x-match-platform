'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, FileText, Users, Mail, DollarSign, Settings, LogOut, Bell, 
  Briefcase, Plane, FileSignature, CheckCircle2, Search, Plus, MapPin, 
  CreditCard, TrendingUp, User, Calendar, Save, Image as ImageIcon, Camera, Upload, BarChart3, Building2, Info, X,
  Zap, Crown, Shield, Rocket, ListPlus, Loader2, Landmark, MessageCircle
} from 'lucide-react';

// --- Firebase 核心引入 ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// --- Firebase 初始化 ---
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
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase 初始化失敗:", error);
  }
}

const internalAppId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'x-match-a83f0';

type Tab = 'overview' | 'projects' | 'trips' | 'contracts' | 'wallet' | 'settings' | 'invitations';

interface ProjectData {
  id: string; title: string; category: string; type: string; location: string; 
  totalValue: string; valueBreakdown: string; requirements: string; spots: number; 
  status: string; applicants: number; date: string; image?: string; gallery?: string[];
}

interface TripData {
  id: string; creatorName: string; destination: string; dates: string; partySize: string; 
  purpose: string; needs: string; status: string; offers: number;
}

interface InvitationData {
  id: string; fromName: string; toName: string; toHandle: string; toAvatar: string;
  message: string; status: string; date: string;
  projectId?: string; projectTitle?: string; projectValue?: string; 
  type?: 'invite' | 'application'; 
  creatorInfo?: any;
  fromLineId?: string; // 新增：來源者的 LINE ID (若有)
}

interface PaymentItem {
  id: string; name: string; price: number; type: 'subscription' | 'one-time';
}

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'business' | 'creator'>('business');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [newProject, setNewProject] = useState({
    title: '', category: '住宿', type: '互惠體驗', location: '',
    totalValue: '', valueBreakdown: '', requirements: '', spots: 1, gallery: [] as string[]
  });
  const [isUploading, setIsUploading] = useState(false);
  
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [currentProjectApplicants, setCurrentProjectApplicants] = useState<InvitationData[]>([]);
  const [currentProjectTitle, setCurrentProjectTitle] = useState('');
  
  const [viewApplicant, setViewApplicant] = useState<any>(null);

  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [newTrip, setNewTrip] = useState({ destination: '', dates: '', partySize: '1人', purpose: '', needs: '' });

  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  
  const [viewProject, setViewProject] = useState<ProjectData | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  const [creatorProfile, setCreatorProfile] = useState({
    name: '林小美', handle: '@may_travel', lineId: '', location: '台北市', tags: '旅遊, 美食, 親子',
    bio: '專注於親子友善飯店與在地美食推廣，擁有高黏著度的媽媽社群。',
    coverImage: '', avatar: '', portfolio: [] as string[],
    rates: { post: 5000, story: 1500, reels: 8000 },
    audience: { gender: '女性 85%', age: '25-34歲', topCity: '台北/新北' }
  });
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [purchaseItem, setPurchaseItem] = useState<PaymentItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer'>('credit_card');
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLoginStatus = localStorage.getItem('xmatch_logged_in');
      const savedRole = localStorage.getItem('xmatch_role');
      if (savedLoginStatus === 'true') {
        setIsLoggedIn(true);
        if (savedRole === 'business' || savedRole === 'creator') {
          setRole(savedRole as 'business' | 'creator');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) setFbUser(user);
      else { try { await signInAnonymously(auth); } catch (e) { console.error("匿名登入失敗:", e); } }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !fbUser || !isLoggedIn) return;
    
    const projectsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'projects');
    const unsubProjects = onSnapshot(projectsCol, (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as ProjectData);
      setProjects(data.sort((a, b) => Number(b.id) - Number(a.id)));
    });

    const tripsCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'trips');
    const unsubTrips = onSnapshot(tripsCol, (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as TripData);
      setTrips(data.sort((a, b) => b.id.localeCompare(a.id)));
    });

    const invCol = collection(db, 'artifacts', internalAppId, 'public', 'data', 'invitations');
    const unsubInv = onSnapshot(invCol, (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as InvitationData);
      setInvitations(data.sort((a, b) => b.id.localeCompare(a.id)));
    });

    const userRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', fbUser.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && role === 'creator') {
        const d = docSnap.data();
        if (d.role === '創作者') {
          setCreatorProfile(prev => ({
            ...prev,
            name: d.name || prev.name, handle: d.handle || prev.handle, lineId: d.lineId || prev.lineId,
            location: d.location || prev.location, tags: d.tags ? d.tags.join(', ') : prev.tags,
            bio: d.bio || prev.bio, coverImage: d.coverImage || '',
            avatar: d.avatar || '', portfolio: d.portfolio || [],
            rates: d.rates || prev.rates, audience: d.audience || prev.audience
          }));
        }
      }
    });

    return () => { unsubProjects(); unsubTrips(); unsubUser(); unsubInv(); };
  }, [fbUser, isLoggedIn, role]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!storage || !fbUser) { alert("Firebase Storage 未準備好"); return; }
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileRef = ref(storage, `artifacts/${internalAppId}/public/data/images/${Date.now()}_${files[i].name}`);
        const uploadTask = await uploadBytesResumable(fileRef, files[i]);
        urls.push(await getDownloadURL(uploadTask.ref));
      }
      setNewProject(prev => ({ ...prev, gallery: [...prev.gallery, ...urls] }));
    } catch (error) {
      console.error("上傳失敗:", error);
    } finally { setIsUploading(false); }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setNewProject(prev => ({ ...prev, gallery: prev.gallery.filter((_, idx) => idx !== indexToRemove) }));
  };

  const handleCreatorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'avatar' | 'portfolio') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!storage || !fbUser) return;

    if (type === 'cover') setIsUploadingCover(true);
    else if (type === 'avatar') setIsUploadingAvatar(true);
    else setIsUploadingPortfolio(true);

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileRef = ref(storage, `artifacts/${internalAppId}/public/data/creators/${fbUser.uid}_${type}_${Date.now()}_${files[i].name}`);
        const uploadTask = await uploadBytesResumable(fileRef, files[i]);
        urls.push(await getDownloadURL(uploadTask.ref));
      }
      if (type === 'cover') setCreatorProfile(p => ({ ...p, coverImage: urls[0] }));
      else if (type === 'avatar') setCreatorProfile(p => ({ ...p, avatar: urls[0] }));
      else setCreatorProfile(p => ({ ...p, portfolio: [...p.portfolio, ...urls] }));
    } catch (error) {
      console.error("照片上傳失敗:", error);
    } finally {
      if (type === 'cover') setIsUploadingCover(false);
      else if (type === 'avatar') setIsUploadingAvatar(false);
      else setIsUploadingPortfolio(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !newProject.location) { alert("請填寫必填欄位"); return; }
    if (!db || !fbUser) return;
    const newId = Date.now().toString();
    try {
      await setDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'projects', newId), {
        id: newId, title: newProject.title, category: newProject.category, type: newProject.type, location: newProject.location,
        totalValue: newProject.totalValue || 'NT$ 未定', valueBreakdown: newProject.valueBreakdown, requirements: newProject.requirements,
        spots: newProject.spots, status: '招募中', applicants: 0, date: new Date().toLocaleDateString('zh-TW'),
        image: newProject.gallery.length > 0 ? newProject.gallery[0] : "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        gallery: newProject.gallery
      });
      setShowCreateModal(false);
      setNewProject({ title: '', category: '住宿', type: '互惠體驗', location: '', totalValue: '', valueBreakdown: '', requirements: '', spots: 1, gallery: [] });
    } catch (err) { console.error(err); }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.destination) { alert("請填寫目的地"); return; }
    if (!db || !fbUser) return;
    const newId = `t${Date.now()}`;
    try {
      await setDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'trips', newId), {
        id: newId, creatorName: creatorProfile.name || '創作者', destination: newTrip.destination, dates: newTrip.dates,
        partySize: newTrip.partySize, purpose: newTrip.purpose, needs: newTrip.needs, status: '招募中', offers: 0
      });
      setShowCreateTripModal(false);
      setNewTrip({ destination: '', dates: '', partySize: '1人', purpose: '', needs: '' });
    } catch (err) { console.error(err); }
  };

  const handleSaveCreatorProfile = async () => {
    if (!db || !fbUser) return;
    setIsSavingProfile(true);
    try {
      await setDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', fbUser.uid), {
        id: fbUser.uid, name: creatorProfile.name, email: `${creatorProfile.handle.replace('@', '')}@creator.com`, role: '創作者', status: '活躍', plan: 'Free',
        joinDate: new Date().toLocaleDateString('zh-TW'), handle: creatorProfile.handle, lineId: creatorProfile.lineId, location: creatorProfile.location,
        tags: creatorProfile.tags.split(',').map(t => t.trim()).filter(Boolean), bio: creatorProfile.bio, coverImage: creatorProfile.coverImage,
        avatar: creatorProfile.avatar, portfolio: creatorProfile.portfolio, rates: creatorProfile.rates, audience: creatorProfile.audience,
        followers: 12000, engagement: 4.5, completedJobs: 0
      }, { merge: true });
      alert("🎉 履歷更新成功！");
    } catch (error) { console.error(error); } 
    finally { setIsSavingProfile(false); }
  };

  const handleUpdateInviteStatus = async (invId: string, newStatus: string) => {
    if (!db) return;
    try {
      const invRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', invId);
      await updateDoc(invRef, { status: newStatus });
      alert(`已將狀態標示為「${newStatus}」！`);
    } catch (e) {
      console.error("更新狀態失敗:", e);
      alert("更新狀態失敗，請稍後再試。");
    }
  };

  const handleViewProject = (projectId?: string) => {
    if (!projectId) return;
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setViewProject(proj);
      setActiveImage(proj.image || (proj.gallery && proj.gallery.length > 0 ? proj.gallery[0] : ''));
    } else {
      alert("此案源可能已關閉或被移除。");
    }
  };

  const handleManageApplicants = (project: ProjectData) => {
    const apps = invitations.filter(inv => inv.projectId === project.id && inv.type === 'application');
    setCurrentProjectApplicants(apps);
    setCurrentProjectTitle(project.title);
    setShowApplicantsModal(true);
  };

  const handlePaymentSubmit = async () => {
    setPaymentStep('processing');
    setTimeout(async () => {
      if (db && fbUser && purchaseItem) {
        try {
          const newTxId = `TX-${Date.now().toString().slice(-6)}`;
          await setDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'transactions', newTxId), {
            id: newTxId, user: role === 'business' ? '海角七號民宿' : creatorProfile.name, item: purchaseItem.name,
            amount: purchaseItem.price, status: '成功', date: new Date().toLocaleString('zh-TW', { hour12: false })
          });
        } catch (err) { console.error(err); }
      }
      setPaymentStep('success');
    }, 2000);
  };

  const handleAuth = (e: React.FormEvent) => { 
    e.preventDefault(); 
    setTimeout(() => {
      setIsLoggedIn(true);
      localStorage.setItem('xmatch_logged_in', 'true');
      localStorage.setItem('xmatch_role', role);
    }, 800); 
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('xmatch_logged_in');
    localStorage.removeItem('xmatch_role');
  };

  const handleRoleSwitch = (newRole: 'business' | 'creator') => {
    setRole(newRole);
    if (isLoggedIn) {
      localStorage.setItem('xmatch_role', newRole);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto">
          <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-indigo-900 opacity-50"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-extrabold mb-4">X-Match</h1>
              <p className="text-lg text-slate-200 mb-8">
                連結在地旅宿與優質創作者，開啟您的互惠旅程。
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
              <button onClick={() => handleRoleSwitch('business')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === 'business' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Briefcase size={16}/> 我是商家
              </button>
              <button onClick={() => handleRoleSwitch('creator')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === 'creator' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
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

  const menuItems = role === 'business' ? [
    { id: 'overview', icon: LayoutDashboard, label: '總覽 Dashboard' },
    { id: 'projects', icon: Briefcase, label: '我的徵才 (案源)' },
    { id: 'invitations', icon: Mail, label: '發出的邀請' },
    { id: 'contracts', icon: FileSignature, label: '合約管理' },
    { id: 'wallet', icon: CreditCard, label: '訂閱與點數' },
    { id: 'settings', icon: Settings, label: '商家設定' },
  ] : [
    { id: 'overview', icon: LayoutDashboard, label: '創作者中心' },
    { id: 'invitations', icon: Mail, label: '收到的邀請' },
    { id: 'trips', icon: Plane, label: '我的許願行程' },
    { id: 'projects', icon: FileText, label: '我的應徵' },
    { id: 'contracts', icon: FileSignature, label: '合約管理' },
    { id: 'settings', icon: User, label: '履歷 (Media Kit)' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        const myReceivedInvs = invitations.filter(inv => inv.toName === creatorProfile.name || inv.toHandle === creatorProfile.handle);

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {role === 'business' ? '早安，海角七號民宿 👋' : `早安，${creatorProfile.name} 👋`}
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
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => setActiveTab('invitations')}>
                    <p className="text-sm text-slate-500 mb-1">收到的邀請</p>
                    <h3 className="text-3xl font-bold text-slate-900">
                      {myReceivedInvs.length} {myReceivedInvs.length > 0 && <span className="text-sm text-red-500 font-bold text-base ml-2">New!</span>}
                    </h3>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">待簽署合約</p>
                    <h3 className="text-3xl font-bold text-amber-500">1</h3>
                  </div>
                </>
              )}
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">近期通知</h3>
                <button className="text-sm text-sky-600 hover:underline">查看全部</button>
              </div>
              <div className="divide-y divide-slate-50">
                {role === 'creator' && myReceivedInvs.length > 0 ? (
                  myReceivedInvs.slice(0, 3).map((inv) => (
                    <div key={inv.id} className="p-4 px-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-sky-500 mt-2 shrink-0"></div>
                      <div>
                        <p className="text-sm text-slate-800">
                          廠商「<span className="font-bold">{inv.fromName}</span>」向您發送了合作邀請！
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{inv.date}</p>
                      </div>
                      <button onClick={() => setActiveTab('invitations')} className="ml-auto text-xs font-bold text-indigo-600 hover:underline mt-1">查看內容</button>
                    </div>
                  ))
                ) : (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="p-4 px-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-slate-300 mt-2 shrink-0"></div>
                      <div>
                        <p className="text-sm text-slate-800">
                          {role === 'business' 
                            ? `創作者 @user${i} 已簽署了「暑期推廣合約」，合約正式生效。` 
                            : `您的行程「蘭嶼星空攝影」已獲得 350 次曝光。`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">2 小時前</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

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
                    {projects.map((project) => {
                      const applicantCount = invitations.filter(inv => inv.projectId === project.id && inv.type === 'application').length;
                      return (
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
                              <Users size={14} className="text-slate-400"/> {applicantCount} 人
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{project.date}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleManageApplicants(project)} className="text-sky-600 font-bold hover:underline">管理名單</button>
                          </td>
                        </tr>
                      );
                    })}
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

            {showApplicantsModal && (
              <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                      <h3 className="font-bold text-xl text-slate-900">應徵者名單</h3>
                      <p className="text-xs text-slate-500 mt-1">案源：{currentProjectTitle}</p>
                    </div>
                    <button onClick={() => setShowApplicantsModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto bg-slate-50/50 flex-grow">
                     {currentProjectApplicants.length > 0 ? (
                       <div className="space-y-4">
                         {currentProjectApplicants.map(app => {
                           const info = app.creatorInfo || {};
                           return (
                             <div key={app.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                               <div className="flex flex-col sm:flex-row items-start gap-5 mb-5 border-b border-slate-100 pb-5">
                                 <div className="relative shrink-0">
                                   <img src={info.avatar || app.toAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.fromName}`} className="w-16 h-16 rounded-full border-4 border-slate-50 shadow-sm" alt="Avatar"/>
                                   {info.followers > 10000 && <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1 rounded-full border-2 border-white"><Crown size={12} fill="currentColor"/></div>}
                                 </div>
                                 
                                 <div className="flex-1 w-full">
                                   <div className="flex justify-between items-start">
                                      <div>
                                         <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 text-lg">{info.name || app.fromName}</h4>
                                            {info.lineId && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">LINE OK</span>}
                                         </div>
                                         <div className="flex gap-3 text-xs text-slate-500 mt-1.5 font-medium">
                                            <span className="flex items-center gap-1"><Users size={12}/> {info.followers ? (info.followers/1000).toFixed(1) + 'k' : 'N/A'} 粉絲</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="flex items-center gap-1"><TrendingUp size={12}/> {info.engagement || 'N/A'}% 互動</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="flex items-center gap-1"><Briefcase size={12}/> {info.completedJobs || 0} 案</span>
                                         </div>
                                         <div className="mt-3 flex flex-wrap gap-1.5">
                                            {info.tags?.map((t:string, i:number) => <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">#{t}</span>)}
                                         </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${app.status === '待審核' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                            {app.status}
                                        </span>
                                        {app.status === '已接受' && (
                                            <div className="flex gap-2">
                                                {/* ✨ 新增：LINE 聯繫按鈕 (業者端) */}
                                                {info.lineId ? (
                                                  <a 
                                                      href={`https://line.me/ti/p/~${info.lineId}`}
                                                      target="_blank" 
                                                      rel="noreferrer"
                                                      className="px-3 py-1.5 bg-[#06C755] text-white rounded-lg text-xs font-bold hover:bg-[#05b34c] flex items-center gap-1 shadow-sm transition-colors"
                                                  >
                                                      <MessageCircle size={12}/> LINE
                                                  </a>
                                                ) : (
                                                    <button className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-1">
                                                        <MessageCircle size={12}/> 無 LINE
                                                    </button>
                                                )}
                                                <Link href="/calculator" className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-1 shadow-sm transition-colors">
                                                    <FileSignature size={12}/> 發起合約
                                                </Link>
                                            </div>
                                        )}
                                      </div>
                                   </div>
                                 </div>
                               </div>
                               
                               <button 
                                 onClick={() => setViewApplicant(info)}
                                 className="w-full mb-4 py-2 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                               >
                                 <FileText size={16}/> 查看完整履歷 (Media Kit)
                               </button>
                               
                               <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl mb-5 italic border border-slate-100 relative">
                                 <div className="absolute top-3 left-3 text-slate-300"><MessageCircle size={16}/></div>
                                 <span className="pl-6 block">"{app.message}"</span>
                               </div>
                               
                               {app.status === '待審核' ? (
                                 <div className="flex gap-3">
                                   <button onClick={() => handleUpdateInviteStatus(app.id, '已婉拒')} className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors">婉拒申請</button>
                                   <button onClick={() => handleUpdateInviteStatus(app.id, '已接受')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-md">接受並開始合作</button>
                                 </div>
                               ) : (
                                 <div className="flex items-center justify-center gap-2 text-xs text-green-600 font-bold bg-green-50 py-3 rounded-xl border border-green-100">
                                   <CheckCircle2 size={16}/> 此申請已成功媒合，請使用上方按鈕進行後續聯繫
                                 </div>
                               )}
                             </div>
                           )
                         })}
                       </div>
                     ) : (
                       <div className="text-center py-24 text-slate-400 flex flex-col items-center">
                         <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Users size={40} className="opacity-40"/></div>
                         <h4 className="font-bold text-slate-600 text-lg">目前尚無人應徵</h4>
                         <p className="text-sm mt-1 mb-6 max-w-xs">您的案源可能曝光不足，建議購買「置頂推廣」來增加 5 倍以上的瀏覽量。</p>
                         <button onClick={() => { setShowApplicantsModal(false); setActiveTab('wallet'); }} className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">前往推廣</button>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            )}

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
                      {/* ... (新增案源表單內容，保持不變) ... */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-sky-500 pl-2">基本設定</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">案源標題 <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" placeholder="例如：海景房開箱體驗招募" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">類別</label>
                              <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" value={newProject.category} onChange={(e) => setNewProject({...newProject, category: e.target.value})}>
                                <option>住宿</option><option>餐飲</option><option>體驗</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">地點 <span className="text-red-500">*</span></label>
                              <div className="flex items-center relative">
                                 <MapPin size={16} className="absolute left-3 text-slate-400"/>
                                 <input type="text" className="w-full pl-9 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" placeholder="例如：屏東恆春" value={newProject.location} onChange={(e) => setNewProject({...newProject, location: e.target.value})} />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">上傳環境相簿 (Gallery)</label>
                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar items-center">
                              <label className="shrink-0 w-20 h-20 bg-slate-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 text-slate-400 transition-colors relative overflow-hidden">
                                {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> : <><Plus size={24} /><span className="text-[10px] mt-1 font-bold">選擇照片</span></>}
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                              </label>
                              {newProject.gallery.map((img, idx) => (
                                <div key={idx} className="shrink-0 w-20 h-20 bg-slate-200 rounded-lg overflow-hidden relative group shadow-sm">
                                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => handleRemovePhoto(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><X size={12} /></button>
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">支援多圖上傳，第一張將預設為前台封面主圖。(需在 Firebase 後台開啟 Storage 服務)</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-indigo-500 pl-2">互惠合作詳情</h4>
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">合作模式</label>
                              <select className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={newProject.type} onChange={(e) => setNewProject({...newProject, type: e.target.value})}>
                                <option>互惠體驗</option><option>付費推廣</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">開放名額</label>
                              <input type="number" min="1" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={newProject.spots} onChange={(e) => setNewProject({...newProject, spots: Number(e.target.value)})} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">合作總價值 (前台顯示金額)</label>
                              <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-600 placeholder:font-normal" placeholder="例如：NT$ 8,800" value={newProject.totalValue} onChange={(e) => setNewProject({...newProject, totalValue: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">價值拆解 (請用 + 號分隔)</label>
                              <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="例如：住宿($6800) + 早餐($800)" value={newProject.valueBreakdown} onChange={(e) => setNewProject({...newProject, valueBreakdown: e.target.value})} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">交付內容需求</label>
                            <textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm" placeholder="例如：IG 貼文 1 則 + 限動 3 則 (需標記地點)..." value={newProject.requirements} onChange={(e) => setNewProject({...newProject, requirements: e.target.value})}></textarea>
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
          <div className="space-y-6 animate-in fade-in duration-300">
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

      case 'invitations':
        // ... (這部分內容維持不變，請複製之前的 invitations case 程式碼) ...
        // 為確保完整性，我再次提供邀請部分
        if (role === 'business') {
          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-slate-900">已發送的邀請</h2>
              {invitations.length > 0 ? (
                <div className="grid gap-4">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 md:w-1/3 shrink-0">
                        <img src={inv.toAvatar} className="w-12 h-12 rounded-full border border-slate-200" alt="avatar" />
                        <div>
                          <p className="font-bold text-slate-900">{inv.toName}</p>
                          <p className="text-xs text-slate-500">{inv.toHandle}</p>
                        </div>
                      </div>
                      <div className="md:w-2/3 flex flex-col justify-center">
                         {inv.projectTitle && (
                           <button onClick={() => handleViewProject(inv.projectId)} className="w-full text-left mb-3 flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 hover:shadow-sm transition-all group">
                             <Briefcase size={16} className="shrink-0" /> <span className="truncate">附件案源：{inv.projectTitle}</span><span className="text-indigo-400 group-hover:text-indigo-600 ml-1 text-xs underline underline-offset-2 shrink-0">查看詳情</span>
                           </button>
                         )}
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 mb-3 line-clamp-2">"{inv.message}"</div>
                         <div className="flex justify-between items-center">
                           <span className="text-xs text-slate-400 font-mono">{inv.date}</span>
                           <div className="flex items-center gap-2">
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === '已接受' ? 'bg-green-100 text-green-700' : inv.status === '已婉拒' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{inv.status}</span>
                             {inv.status === '已接受' && <Link href="/calculator" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1"><FileSignature size={14} /> 智能合約</Link>}
                           </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">您尚未向任何創作者發送邀請</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm mt-4">
                    <Link href="/creators" className="text-indigo-600 font-bold hover:underline">前往「找網紅」尋找適合的對象</Link>
                    <span className="hidden sm:block text-slate-300">|</span>
                    <Link href="/trips" className="text-indigo-600 font-bold hover:underline">前往「行程許願池」尋找適合的對象</Link>
                  </div>
                </div>
              )}
            </div>
          );
        } else {
          // 創作者專屬
          const myInvs = invitations.filter(inv => inv.toName === creatorProfile.name || inv.toHandle === creatorProfile.handle);
          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-slate-900">收到的邀請</h2>
              {myInvs.length > 0 ? (
                <div className="grid gap-4">
                  {myInvs.map((inv) => (
                    <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 md:w-1/4 shrink-0">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100">{inv.fromName.charAt(0)}</div>
                        <div><p className="font-bold text-slate-900">{inv.fromName}</p><p className="text-xs text-slate-500">合作廠商</p></div>
                      </div>
                      <div className="md:w-3/4 flex flex-col justify-center">
                         {inv.projectTitle && (
                           <button onClick={() => handleViewProject(inv.projectId)} className="w-full text-left mb-3 flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 hover:shadow-sm transition-all group">
                             <Briefcase size={16} className="shrink-0" /> <span className="truncate">附件案源：{inv.projectTitle}</span><span className="text-indigo-400 group-hover:text-indigo-600 ml-1 text-xs underline underline-offset-2 shrink-0">查看詳情</span>
                           </button>
                         )}
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 mb-4 whitespace-pre-wrap leading-relaxed">{inv.message}</div>
                         <div className="flex justify-between items-center">
                           <span className="text-xs text-slate-400 font-mono">{inv.date}</span>
                           <div className="flex gap-2">
                             {(inv.status === '待回覆' || inv.status === '招募中' || inv.status === '待審核') ? (
                               <>
                                 <button onClick={() => handleUpdateInviteStatus(inv.id, '已婉拒')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">婉拒</button>
                                 <button onClick={() => handleUpdateInviteStatus(inv.id, '已接受')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">回覆並接受</button>
                               </>
                             ) : (
                               <div className="flex items-center gap-2">
                                 <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === '已接受' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span>
                                 {inv.status === '已接受' && <Link href="/calculator" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1"><FileSignature size={14} /> 智能合約</Link>}
                               </div>
                             )}
                           </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center">
                   <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                   <p className="font-bold text-slate-700 text-lg mb-1">尚未收到任何邀請</p>
                   <p className="text-sm text-slate-500">完善您的 Media Kit，或是發布更多許願行程來吸引廠商吧！</p>
                </div>
              )}
            </div>
          );
        }

      case 'trips':
        // ... (保持原樣，請複製之前的 trips case) ...
        return role === 'creator' ? (
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
            
            <div className="grid grid-cols-1 gap-6">
               {trips.length > 0 ? (
                 trips.map(trip => (
                  <div key={trip.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          trip.status === '招募中' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>{trip.status}</span>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <MapPin size={18} className="text-indigo-500" /> {trip.destination}
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
                      <button 
                        onClick={() => setActiveTab('invitations')} 
                        className="mt-4 w-full py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        查看邀請
                      </button>
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
                        <input type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" placeholder="例如：宜蘭礁溪、台南中西區" value={newTrip.destination} onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">預計日期</label>
                          <input type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="例如：2024/07/15 - 07/17" value={newTrip.dates} onChange={(e) => setNewTrip({...newTrip, dates: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">隨行人數</label>
                          <input type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="例如：2大1小、單人" value={newTrip.partySize} onChange={(e) => setNewTrip({...newTrip, partySize: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">行程目的 (將產出什麼內容？)</label>
                        <textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm" placeholder="例如：家庭暑假旅遊，預計會拍攝兩支短影音介紹親子友善設施。" value={newTrip.purpose} onChange={(e) => setNewTrip({...newTrip, purpose: e.target.value})}></textarea>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">許願需求 (希望廠商提供什麼？)</label>
                        <textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm" placeholder="例如：尋求有溫泉設施的飯店住宿贊助兩晚，或周邊親子餐廳體驗。" value={newTrip.needs} onChange={(e) => setNewTrip({...newTrip, needs: e.target.value})}></textarea>
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
        ) : null;

      // ... (其他 contracts, wallet, settings 保持不變，直接沿用上一次的完整代碼) ...
      // 為了完整性，我再貼一次剩餘的部分
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

      case 'wallet':
        return role === 'business' ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">訂閱與點數</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
                <div className="relative z-10 flex-grow">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded mb-4 inline-block">目前方案</span>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Free 免費體驗版</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold text-slate-900">$0</span><span className="text-slate-500 ml-2">/ 月</span>
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

              <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl relative overflow-hidden text-white flex flex-col">
                <div className="absolute top-0 right-0 bg-yellow-400 text-indigo-900 text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                <div className="relative z-10 flex-grow">
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">專業成長版 Pro <Crown size={20} className="text-yellow-400 fill-yellow-400"/></h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold">$999</span><span className="text-indigo-200 ml-2">/ 月</span>
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
                  <button onClick={() => { setPurchaseItem({ id: 'pro', name: '專業成長版 Pro (月費)', price: 999, type: 'subscription' }); setPaymentStep('form'); }} className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg active:scale-95">
                    立即升級 Pro
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Rocket className="text-indigo-600" size={20}/> 單次付費推廣 (Boost)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group cursor-pointer flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform"><Zap size={20} fill="currentColor"/></div>
                    <span className="font-bold text-slate-900">$300</span>
                  </div>
                  <h4 className="font-bold text-slate-900 flex-grow">置頂推廣 (Featured)</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">讓您的徵才需求置頂 3 天，曝光加倍。</p>
                  <button onClick={() => { setPurchaseItem({ id: 'boost-featured', name: '置頂推廣 (單次)', price: 300, type: 'one-time' }); setPaymentStep('form'); }} className="mt-auto text-xs font-bold text-indigo-600 hover:underline text-left">
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
                  <button onClick={() => { setPurchaseItem({ id: 'boost-push', name: '精準推播 (單次)', price: 100, type: 'one-time' }); setPaymentStep('form'); }} className="mt-auto text-xs font-bold text-indigo-600 hover:underline text-left">
                    購買點數 &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null;

      case 'settings':
        return role === 'business' ? (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-900">基本資料設定</h2>
               <button onClick={() => alert("儲存成功！")} className="hidden sm:flex bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm">
                 <Save size={16}/> 儲存變更
               </button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1 space-y-6">
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
                          <option>住宿</option><option>餐飲</option><option>體驗</option>
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
                <button onClick={() => alert("儲存成功！")} className="w-full bg-slate-900 text-white px-4 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg">
                  <Save size={18}/> 儲存所有變更
                </button>
             </div>
           </div>
        ) : (
           <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-900">編輯履歷 (Media Kit)</h2>
               <button 
                 onClick={handleSaveCreatorProfile}
                 disabled={isSavingProfile}
                 className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md active:scale-95 transition-all disabled:opacity-70"
               >
                 {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} 
                 {isSavingProfile ? '雲端寫入中...' : '儲存履歷並公開'}
               </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                 
                 {/* 形象照片區塊 */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ImageIcon size={18} className="text-sky-500"/> 形象照片 (Cloud Sync)</h3>
                   
                   {/* Cover Image Upload */}
                   <div className="relative h-48 bg-slate-50 rounded-xl mb-6 flex items-center justify-center border-2 border-dashed border-slate-300 hover:bg-slate-100 transition-colors overflow-hidden group">
                     {creatorProfile.coverImage ? (
                        <>
                          <img src={creatorProfile.coverImage} className="w-full h-full object-cover" alt="Cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">點擊更換封面圖</span>
                          </div>
                        </>
                     ) : (
                        <div className="text-center text-slate-400">
                          {isUploadingCover ? <Loader2 size={24} className="mx-auto mb-2 animate-spin text-sky-500"/> : <Upload size={24} className="mx-auto mb-2"/>}
                          <span className="text-sm font-bold">{isUploadingCover ? '照片上傳中...' : '點擊上傳封面大圖'}</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleCreatorImageUpload(e, 'cover')} disabled={isUploadingCover} />
                   </div>
                   
                   {/* Avatar Upload */}
                   <div className="flex items-center gap-5">
                     <div className="relative w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 hover:bg-slate-200 transition-colors overflow-hidden shrink-0 group">
                       {creatorProfile.avatar ? (
                          <>
                            <img src={creatorProfile.avatar} className="w-full h-full object-cover" alt="Avatar" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera size={20} className="text-white"/>
                            </div>
                          </>
                       ) : (
                          isUploadingAvatar ? <Loader2 size={24} className="animate-spin text-sky-500"/> : <Camera size={24} className="text-slate-400"/>
                       )}
                       <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleCreatorImageUpload(e, 'avatar')} disabled={isUploadingAvatar} />
                     </div>
                     <div className="flex-1">
                       <p className="text-sm font-bold text-slate-900 mb-1">個人頭像 (Avatar)</p>
                       <p className="text-xs text-slate-500 leading-relaxed">建議尺寸 200x200px。<br/>清晰的人像能提升 40% 的媒合率。</p>
                     </div>
                   </div>
                 </div>

                 {/* 基本資料區塊 */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                   <h3 className="font-bold text-slate-900 mb-2">基本資料</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">顯示名稱</label>
                       <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all" 
                              value={creatorProfile.name} onChange={(e) => setCreatorProfile(p => ({...p, name: e.target.value}))} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Handle (社群 ID)</label>
                       <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all" 
                              value={creatorProfile.handle} onChange={(e) => setCreatorProfile(p => ({...p, handle: e.target.value}))} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">LINE ID (聯絡用)</label>
                       <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all" 
                              placeholder="例如：may_travel"
                              value={creatorProfile.lineId} onChange={(e) => setCreatorProfile(p => ({...p, lineId: e.target.value}))} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">主要所在地</label>
                       <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all" 
                              value={creatorProfile.location} onChange={(e) => setCreatorProfile(p => ({...p, location: e.target.value}))} />
                     </div>
                     <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">風格標籤 (逗號分隔)</label>
                       <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 focus:bg-white transition-all" 
                              value={creatorProfile.tags} onChange={(e) => setCreatorProfile(p => ({...p, tags: e.target.value}))} />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">個人簡介 (Bio)</label>
                     <textarea className="w-full p-4 border border-slate-200 rounded-xl h-28 resize-none text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all" 
                               value={creatorProfile.bio} onChange={(e) => setCreatorProfile(p => ({...p, bio: e.target.value}))} />
                   </div>
                 </div>

                 {/* 作品集上傳 */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ImageIcon size={18} className="text-purple-500"/> 近期作品集 (Portfolio)</h3>
                   <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                     <label className="aspect-square bg-slate-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 text-slate-400 transition-colors">
                       {isUploadingPortfolio ? <Loader2 className="animate-spin text-purple-500" size={24}/> : <Plus size={24}/>}
                       <span className="text-[10px] font-bold mt-1">新增作品</span>
                       <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleCreatorImageUpload(e, 'portfolio')} disabled={isUploadingPortfolio} />
                     </label>
                     {creatorProfile.portfolio.map((img, i) => (
                       <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-200 relative group shadow-sm border border-slate-100">
                         <img src={img} className="w-full h-full object-cover" alt="Portfolio" />
                         <button 
                           type="button" 
                           onClick={() => setCreatorProfile(p => ({...p, portfolio: p.portfolio.filter((_, idx) => idx !== i)}))}
                           className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all scale-75 group-hover:scale-100"
                         >
                           <X size={12} strokeWidth={3}/>
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               {/* 右側：報價與受眾 */}
               <div className="space-y-6">
                 <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm">
                   <h3 className="font-black text-green-800 mb-5 flex items-center gap-2 uppercase tracking-widest text-sm"><DollarSign size={18} className="text-green-600"/> 合作參考報價</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-green-700 mb-1.5">圖文貼文 (Post) NT$</label>
                       <input type="number" className="w-full p-3 border border-green-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-green-500 bg-white" 
                              value={creatorProfile.rates.post} onChange={(e) => setCreatorProfile(p => ({...p, rates: {...p.rates, post: Number(e.target.value)}}))} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-green-700 mb-1.5">限時動態 (Story) NT$</label>
                       <input type="number" className="w-full p-3 border border-green-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-green-500 bg-white" 
                              value={creatorProfile.rates.story} onChange={(e) => setCreatorProfile(p => ({...p, rates: {...p.rates, story: Number(e.target.value)}}))} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-green-700 mb-1.5">短影音 (Reels) NT$</label>
                       <input type="number" className="w-full p-3 border border-green-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-green-500 bg-white" 
                              value={creatorProfile.rates.reels} onChange={(e) => setCreatorProfile(p => ({...p, rates: {...p.rates, reels: Number(e.target.value)}}))} />
                     </div>
                   </div>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2 uppercase tracking-widest text-sm"><BarChart3 size={18} className="text-indigo-500"/> 社群受眾分析</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5">性別分佈</label>
                       <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" 
                              value={creatorProfile.audience.gender} onChange={(e) => setCreatorProfile(p => ({...p, audience: {...p.audience, gender: e.target.value}}))} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5">主力年齡層</label>
                       <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" 
                              value={creatorProfile.audience.age} onChange={(e) => setCreatorProfile(p => ({...p, audience: {...p.audience, age: e.target.value}}))} />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5">熱門分佈城市</label>
                       <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" 
                              value={creatorProfile.audience.topCity} onChange={(e) => setCreatorProfile(p => ({...p, audience: {...p.audience, topCity: e.target.value}}))} />
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        );

      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col overflow-y-auto m-0 p-0 font-sans">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <Link href="/" className="font-extrabold text-2xl text-sky-500 tracking-tight">X-Match</Link>
          <div className="flex gap-4">
             <div className="bg-slate-100 p-1 rounded-lg flex">
                <button onClick={() => handleRoleSwitch('business')} className={`px-3 py-1 text-xs font-bold rounded ${role === 'business' ? 'bg-white shadow' : 'text-slate-400'}`}>業者視角</button>
                <button onClick={() => handleRoleSwitch('creator')} className={`px-3 py-1 text-xs font-bold rounded ${role === 'creator' ? 'bg-white shadow' : 'text-slate-400'}`}>創作者視角</button>
             </div>
             <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <div className="w-64 shrink-0 hidden md:block">
          <nav className="space-y-2 sticky top-24">
            {menuItems.map(i => (
              <button key={i.id} onClick={() => setActiveTab(i.id as Tab)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl ${activeTab === i.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-white'}`}>
                <i.icon size={18} /> {i.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1 pb-32 relative">
          
          {/* 金流 Modal */}
          {purchaseItem && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
              <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between bg-slate-50">
                  <h3 className="font-bold">結帳確認</h3>
                  {paymentStep === 'form' && <button onClick={() => setPurchaseItem(null)}><X size={20} /></button>}
                </div>
                {paymentStep === 'form' && (
                  <div className="p-6">
                    <div className="bg-indigo-50 p-4 rounded-xl mb-6">
                      <p className="text-xs text-indigo-600 font-bold mb-1">購買項目</p>
                      <div className="flex justify-between items-end"><p className="font-bold">{purchaseItem.name}</p><p className="font-black text-2xl text-indigo-700">NT$ {purchaseItem.price}</p></div>
                    </div>
                    <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
                      <button onClick={() => setPaymentMethod('credit_card')} className={`flex-1 py-2 text-sm font-bold flex justify-center gap-2 rounded ${paymentMethod === 'credit_card' ? 'bg-white shadow' : 'text-slate-500'}`}><CreditCard size={16}/> 信用卡</button>
                      <button onClick={() => setPaymentMethod('bank_transfer')} className={`flex-1 py-2 text-sm font-bold flex justify-center gap-2 rounded ${paymentMethod === 'bank_transfer' ? 'bg-white shadow' : 'text-slate-500'}`}><Landmark size={16}/> 銀行匯款</button>
                    </div>
                    <button onClick={handlePaymentSubmit} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">確認付款</button>
                  </div>
                )}
                {paymentStep === 'processing' && (<div className="p-12 text-center"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="font-bold">處理中...</h3></div>)}
                {paymentStep === 'success' && (<div className="p-12 text-center"><CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" /><h3 className="font-bold mb-4">交易成功！</h3><button onClick={() => {setPurchaseItem(null); setActiveTab('overview');}} className="w-full py-3 bg-slate-100 rounded-xl font-bold">返回</button></div>)}
              </div>
            </div>
          )}
          
          {/* 案源詳情 Modal */}
          {viewProject && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-bottom-5 duration-300 relative">
                <button onClick={() => setViewProject(null)} className="absolute top-4 right-4 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"><X size={20} /></button>
                
                <div className="relative h-64 sm:h-72 shrink-0 bg-slate-200">
                  <img src={activeImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} className="w-full h-full object-cover transition-opacity duration-300" alt="Cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  {viewProject.gallery && viewProject.gallery.length > 0 && (
                    <div className="absolute bottom-4 left-4 flex gap-2 overflow-x-auto max-w-[calc(100%-2rem)]">
                      {viewProject.gallery.map((img, i) => (
                        <img key={i} src={img} onClick={() => setActiveImage(img)} className={`w-16 h-12 object-cover rounded-md border-2 cursor-pointer transition-colors ${activeImage === img ? 'border-indigo-500' : 'border-white/50 hover:border-white'}`} alt="Gallery" />
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-6 sm:p-8 flex-grow bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${viewProject.type === '付費推廣' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-50 text-indigo-700'}`}>{viewProject.type}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /> {viewProject.location}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">{viewProject.title}</h2>
                      <div className="flex gap-2">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{viewProject.category}</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto bg-white sm:bg-transparent p-4 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">合作總價值</p>
                      <p className="text-2xl font-black text-indigo-600">{viewProject.totalValue}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm"><DollarSign size={18} className="text-green-600"/> 互惠價值詳情</h4>
                      <ul className="space-y-3 text-sm text-slate-600">
                        {viewProject.valueBreakdown?.split('+').map((item, i) => (
                          <li key={i} className="flex items-start gap-2"><CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0"/><span className="font-medium">{item.trim()}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm"><Camera size={18} className="text-blue-600"/> 內容需求</h4>
                      <p className="text-sm text-slate-600 mb-4 leading-relaxed font-medium">{viewProject.requirements}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <Users size={16} className="text-indigo-500"/>
                        <span>剩餘 <span className="text-indigo-600 text-base">{viewProject.spots || 0}</span> 個名額</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6 border-t border-slate-200 bg-white sticky bottom-0 flex justify-end items-center z-20">
                   <button onClick={() => setViewProject(null)} className="px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg active:scale-95 transition-all">關閉詳情</button>
                </div>
              </div>
            </div>
          )}

          {renderContent()}
        </div>
      </div>
      {/* 行動版底部導覽 */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-40 flex justify-around p-2 pb-safe">
        {menuItems.slice(0, 4).map(i => (
          <button key={i.id} onClick={() => setActiveTab(i.id as Tab)} className={`p-2 flex flex-col items-center ${activeTab === i.id ? 'text-indigo-600' : 'text-slate-400'}`}>
            <i.icon size={20} />
            <span className="text-[10px] mt-1 font-bold">{i.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}