'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, FileText, Users, Mail, DollarSign, Settings, LogOut, Bell, 
  Briefcase, Plane, FileSignature, CheckCircle2, Search, Plus, MapPin, 
  CreditCard, TrendingUp, User, Calendar, Save, Image as ImageIcon, Camera, Upload, BarChart3, Building2, Info, X,
  Zap, Crown, Shield, Rocket, ListPlus, Loader2, Landmark, MessageCircle, Star, RefreshCcw, ChevronRight, Eye
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

interface ReviewData {
  rating: number;
  comment: string;
  date: string;
}

interface InvitationData {
  id: string; fromName: string; toName: string; toHandle: string; toAvatar: string;
  message: string; status: string; date: string;
  projectId?: string; projectTitle?: string; projectValue?: string; 
  type?: 'invite' | 'application'; 
  creatorInfo?: any;
  fromLineId?: string;
  businessReview?: ReviewData; 
  creatorReview?: ReviewData;  
}

interface PaymentItem {
  id: string; name: string; price: number; type: 'subscription' | 'one-time';
}

const MOCK_PROJECTS: ProjectData[] = [];
const MOCK_TRIPS: TripData[] = [];

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'business' | 'creator'>('business');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  // 案源管理相關狀態
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [newProject, setNewProject] = useState({
    title: '', category: '住宿', type: '互惠體驗', location: '',
    totalValue: '', valueBreakdown: '', requirements: '', spots: 1, gallery: [] as string[]
  });
  const [isUploading, setIsUploading] = useState(false);
  
  // 管理名單相關狀態
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [currentProjectApplicants, setCurrentProjectApplicants] = useState<InvitationData[]>([]);
  const [currentProjectTitle, setCurrentProjectTitle] = useState('');
  
  // 查看應徵者完整履歷
  const [viewApplicant, setViewApplicant] = useState<any>(null);

  // 許願行程相關狀態
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [newTrip, setNewTrip] = useState({ destination: '', dates: '', partySize: '1人', purpose: '', needs: '' });

  // 邀請函狀態
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  
  // 評價相關狀態
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTargetId, setReviewTargetId] = useState<string | null>(null); 
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  // 案源詳情檢視狀態
  const [viewProject, setViewProject] = useState<ProjectData | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  // 創作者履歷狀態
  const [creatorProfile, setCreatorProfile] = useState({
    name: '林小美', handle: '@may_travel', lineId: '', location: '台北市', tags: '旅遊, 美食, 親子',
    bio: '專注於親子友善飯店與在地美食推廣，擁有高黏著度的媽媽社群。',
    coverImage: '', avatar: '', portfolio: [] as string[],
    rates: { post: 5000, story: 1500, reels: 8000 },
    audience: { gender: '女性 85%', age: '25-34歲', topCity: '台北/新北' },
    averageViews: 5000,
    completionScore: 5.0
  });
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 金流狀態
  const [purchaseItem, setPurchaseItem] = useState<PaymentItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer'>('credit_card');
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');

  // 初始化時檢查 localStorage (保持登入狀態)
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

  // Firebase Auth
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) setFbUser(user);
      else { try { await signInAnonymously(auth); } catch (e) { console.error("匿名登入失敗:", e); } }
    });
    return () => unsubscribe();
  }, []);

  // 監聽 Firestore 實時資料
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
            rates: d.rates || prev.rates, audience: d.audience || prev.audience,
            averageViews: d.averageViews || prev.averageViews,
            completionScore: d.completionScore || prev.completionScore
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
        followers: 12000, engagement: 4.5, completedJobs: 0,
        averageViews: creatorProfile.averageViews, completionScore: creatorProfile.completionScore
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

  // 開啟評價視窗
  const handleOpenReviewModal = (invId: string) => {
    setReviewTargetId(invId);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  // 送出評價
  const handleSubmitReview = async () => {
    if (!db || !reviewTargetId) return;
    
    const reviewData: ReviewData = {
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toLocaleDateString('zh-TW')
    };

    try {
      const invRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', reviewTargetId);
      
      // 根據角色寫入對應的評價欄位
      if (role === 'business') {
        await updateDoc(invRef, { businessReview: reviewData });
      } else {
        await updateDoc(invRef, { creatorReview: reviewData });
      }
      
      alert("🎉 評價已送出！案件成功結案。");
      setShowReviewModal(false);
    } catch (e) {
      console.error("送出評價失敗:", e);
      alert("發生錯誤，請稍後再試。");
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

  // 登入並寫入 localStorage
  const handleAuth = (e: React.FormEvent) => { 
    e.preventDefault(); 
    setTimeout(() => {
      setIsLoggedIn(true);
      localStorage.setItem('xmatch_logged_in', 'true');
      localStorage.setItem('xmatch_role', role);
    }, 800); 
  };

  // 登出並清除 localStorage
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('xmatch_logged_in');
    localStorage.removeItem('xmatch_role');
  };

  // 僅在登入頁面使用，用來設定初始角色
  const handleRoleSelect = (selectedRole: 'business' | 'creator') => {
    setRole(selectedRole);
  };

  const themeText = role === 'business' ? 'text-indigo-600' : 'text-purple-600';
  const themeBg = role === 'business' ? 'bg-indigo-600' : 'bg-purple-600';

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
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button onClick={() => handleRoleSelect('business')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === 'business' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Briefcase size={16}/> 我是商家
              </button>
              <button onClick={() => handleRoleSelect('creator')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === 'creator' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
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

  // 根據角色動態顯示不同的選單
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
                    <h3 className={`text-3xl font-bold ${themeText}`}>5 <span className="text-sm text-slate-400 font-normal">點</span></h3>
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
              <button onClick={() => setShowCreateModal(true)} className={`text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-md ${themeBg} hover:opacity-90`}><ListPlus size={16}/> 新增案源</button>
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
                          <td className="px-6 py-4 font-bold text-slate-900">{project.title}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">{project.category}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${project.status === '招募中' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{project.status}</span>
                          </td>
                          <td className="px-6 py-4"><div className="flex items-center gap-1.5 font-bold text-slate-700"><Users size={14} className="text-slate-400"/> {applicantCount} 人</div></td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{project.date}</td>
                          <td className="px-6 py-4 text-right"><button onClick={() => handleManageApplicants(project)} className={`font-bold hover:underline ${themeText}`}>管理名單</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- 管理應徵者名單 Modal (Upgrade) --- */}
            {showApplicantsModal && (
              <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div><h3 className="font-bold text-lg text-slate-900">應徵者名單</h3><p className="text-xs text-slate-500 mt-1">案源：{currentProjectTitle}</p></div>
                    <button onClick={() => setShowApplicantsModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  <div className="p-6 overflow-y-auto bg-slate-50/50 flex-grow">
                     {currentProjectApplicants.length > 0 ? (
                       <div className="space-y-4">
                         {currentProjectApplicants.map(app => {
                           const info = app.creatorInfo || {};
                           const myReview = app.businessReview;
                           return (
                             <div key={app.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                               {/* 創作者卡片頭部 */}
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
                                            <span className="flex items-center gap-1"><Eye size={12}/> {info.averageViews ? (info.averageViews/1000).toFixed(1)+'k' : 'N/A'} 觀看</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="flex items-center gap-1"><Star size={12} className="fill-yellow-400 text-yellow-400"/> {info.completionScore || '5.0'} 信用</span>
                                         </div>
                                         <div className="mt-3 flex flex-wrap gap-1.5">
                                            {info.tags?.map((t:string, i:number) => <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">#{t}</span>)}
                                         </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${app.status === '待審核' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                            {app.status}
                                        </span>
                                        {/* ✨ 新增：當已接受時顯示的按鈕 */}
                                        {app.status === '已接受' && (
                                            <div className="flex gap-2 justify-end flex-wrap">
                                                {/* LINE 聯繫 */}
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
                                                    <button className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-1"><MessageCircle size={12}/> 無 LINE</button>
                                                )}
                                                {/* 智能合約 */}
                                                <Link href="/calculator" className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-1 shadow-sm transition-colors">
                                                    <FileSignature size={12}/> 合約
                                                </Link>
                                                {/* 結案評價 */}
                                                {myReview ? (
                                                  <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold border border-yellow-200">
                                                    <Star size={12} className="fill-yellow-500 text-yellow-500"/> {myReview.rating} 已評價
                                                  </div>
                                                ) : (
                                                  <button 
                                                    onClick={() => handleOpenReviewModal(app.id)}
                                                    className="px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-lg text-xs font-bold hover:bg-yellow-500 shadow-sm flex items-center gap-1"
                                                  >
                                                    <Crown size={14} /> 評價
                                                  </button>
                                                )}
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
                               ) : null}
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
                 {/* ... (Create Project Modal) ... */}
                 <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                      <ListPlus size={20} className="text-sky-500"/> 發布新案源 (Cloud Sync)
                    </h3>
                    <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                    <form className="space-y-6" onSubmit={handleCreateProject}>
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
                              <label className="block text-xs font-bold text-slate-700 mb-1">合作總價值</label>
                              <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-600" placeholder="例如：NT$ 8,800" value={newProject.totalValue} onChange={(e) => setNewProject({...newProject, totalValue: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">價值拆解</label>
                              <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="例如：住宿($6800) + 早餐($800)" value={newProject.valueBreakdown} onChange={(e) => setNewProject({...newProject, valueBreakdown: e.target.value})} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">交付內容需求</label>
                            <textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm" placeholder="例如：IG 貼文 1 則 + 限動 3 則..." value={newProject.requirements} onChange={(e) => setNewProject({...newProject, requirements: e.target.value})}></textarea>
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

      // ... settings ...
      case 'settings':
        return role === 'business' ? (
           <div className="p-8">商家設定 (略)</div>
        ) : (
           <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-900">編輯履歷 (Media Kit)</h2>
               <button onClick={handleSaveCreatorProfile} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md">
                 {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} 
                 {isSavingProfile ? '雲端寫入中...' : '儲存履歷並公開'}
               </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* 左側照片區塊 (略，使用前版) */}
               
               {/* 右側：數據與受眾 */}
               <div className="space-y-6">
                 {/* ✨ 新增：數據表現區塊 (可編輯) */}
                 <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm">
                   <h3 className="font-black text-purple-800 mb-5 flex items-center gap-2 uppercase tracking-widest text-sm"><BarChart3 size={18} className="text-purple-600"/> 數據表現</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-purple-700 mb-1.5">平均觀看數 (Average Views)</label>
                       <input type="number" className="w-full p-3 border border-purple-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 bg-white" 
                              value={creatorProfile.averageViews} onChange={(e) => setCreatorProfile(p => ({...p, averageViews: Number(e.target.value)}))} />
                       <p className="text-[10px] text-purple-600 mt-1">* 建議填寫最近 5 支 Reels 的平均觀看數</p>
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-purple-700 mb-1.5">完案信用評分 (系統自動計算)</label>
                       <div className="w-full p-3 border border-purple-200 rounded-xl text-sm font-black text-slate-500 bg-purple-100 flex items-center gap-2">
                          <Star size={16} className="fill-yellow-400 text-yellow-400" />
                          {creatorProfile.completionScore || '5.0'}
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2 uppercase tracking-widest text-sm"><Users size={18} className="text-indigo-500"/> 社群受眾分析</h3>
                   {/* ... (受眾分析輸入框，保持不變) ... */}
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
       {/* (Layout 保持不變，請複製前版) */}
       <div className="flex-1 pb-32 relative">
           
          {/* ✨ 評價填寫 Modal (全域) */}
          {showReviewModal && (
            <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2"><Crown className="text-yellow-500" size={24}/> 填寫結案評價</h3>
                  <button onClick={() => setShowReviewModal(false)}><X size={20} className="text-slate-400"/></button>
                </div>
                <p className="text-sm text-slate-500 mb-6">請為這次的合作體驗評分，您的評價將幫助其他用戶做出更好的選擇。</p>
                
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110 active:scale-95">
                      <Star size={32} className={`${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
                
                <textarea 
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none mb-4"
                  placeholder="寫下您的心得評語..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
                
                <button 
                  onClick={handleSubmitReview}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg active:scale-95 transition-all"
                >
                  送出評價
                </button>
              </div>
            </div>
          )}

          {renderContent()}
       </div>
       
       {/* 行動版底部導覽 */}
       <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-40 flex justify-around p-2 pb-safe">
        {menuItems.map(i => (
          <button 
            key={i.id} 
            onClick={() => setActiveTab(i.id as Tab)} 
            className={`p-2 flex flex-col items-center ${
              activeTab === i.id 
                ? (role === 'business' ? 'text-indigo-600' : 'text-purple-600') 
                : 'text-slate-400'
            }`}
          >
            <i.icon size={20} />
            <span className="text-[10px] mt-1 font-bold">{i.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}