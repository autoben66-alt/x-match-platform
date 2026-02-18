'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, FileText, Users, Mail, DollarSign, Settings, LogOut, Bell, 
  Briefcase, Plane, FileSignature, CheckCircle2, Search, Plus, MapPin, 
  CreditCard, TrendingUp, User, Calendar, Save, Image as ImageIcon, Camera, Upload, BarChart3, Building2, Info, X,
  Zap, Crown, Shield, Rocket, ListPlus, Loader2, Landmark, MessageCircle, Star, RefreshCcw, ChevronRight, Eye, Eraser, Copy, Share2, Printer
} from 'lucide-react';

// --- Firebase 核心引入 ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
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

// --- 型別定義 ---
type Tab = 'overview' | 'projects' | 'trips' | 'contracts' | 'wallet' | 'settings' | 'invitations';

interface ProjectData {
  id: string; title: string; category: string; type: string; location: string; 
  totalValue: string; valueBreakdown: string; requirements: string; spots: number; 
  status: string; applicants: number; date: string; image?: string; gallery?: string[];
  description?: string;
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

export default function DashboardPage() {
  // --- 基礎狀態 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'business' | 'creator'>('business');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  // --- 案源管理相關 ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [newProject, setNewProject] = useState({
    title: '', category: '住宿', type: '互惠體驗', location: '',
    totalValue: '', valueBreakdown: '', requirements: '', spots: 1, gallery: [] as string[],
    description: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [viewProject, setViewProject] = useState<ProjectData | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  
  // --- 應徵者/管理名單 ---
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [currentProjectApplicants, setCurrentProjectApplicants] = useState<InvitationData[]>([]);
  const [currentProjectTitle, setCurrentProjectTitle] = useState('');
  const [viewApplicant, setViewApplicant] = useState<any>(null);

  // --- 許願行程相關 ---
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [newTrip, setNewTrip] = useState({ destination: '', dates: '', partySize: '1人', purpose: '', needs: '' });

  // --- 邀請函與評價 ---
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTargetId, setReviewTargetId] = useState<string | null>(null); 
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // --- 創作者履歷狀態 ---
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

  // --- 金流與支付 ---
  const [purchaseItem, setPurchaseItem] = useState<PaymentItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer'>('credit_card');
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');

  // --- 初始化與 Firebase 監聽 ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLoginStatus = localStorage.getItem('xmatch_logged_in');
      const savedRole = localStorage.getItem('xmatch_role');
      if (savedLoginStatus === 'true') {
        setIsLoggedIn(true);
        if (savedRole === 'business' || savedRole === 'creator') setRole(savedRole as 'business' | 'creator');
      }
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) setFbUser(user);
      else { try { await signInAnonymously(auth); } catch (e) { console.error(e); } }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !fbUser || !isLoggedIn) return;
    
    // 監聽案源
    const unsubProjects = onSnapshot(collection(db, 'artifacts', internalAppId, 'public', 'data', 'projects'), (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as ProjectData);
      setProjects(data.sort((a, b) => Number(b.id) - Number(a.id)));
    });

    // 監聽許願
    const unsubTrips = onSnapshot(collection(db, 'artifacts', internalAppId, 'public', 'data', 'trips'), (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as TripData);
      setTrips(data.sort((a, b) => b.id.localeCompare(a.id)));
    });

    // 監聽邀請/應徵
    const unsubInv = onSnapshot(collection(db, 'artifacts', internalAppId, 'public', 'data', 'invitations'), (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as InvitationData);
      setInvitations(data.sort((a, b) => b.id.localeCompare(a.id)));
    });

    // 監聽個人資料
    const userRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', fbUser.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && role === 'creator') {
        const d = docSnap.data();
        setCreatorProfile(prev => ({
          ...prev,
          name: d.name || prev.name, handle: d.handle || prev.handle, lineId: d.lineId || prev.lineId,
          location: d.location || prev.location, tags: d.tags ? d.tags.join(', ') : prev.tags,
          bio: d.bio || prev.bio, coverImage: d.coverImage || '',
          avatar: d.avatar || '', portfolio: d.portfolio || [],
          rates: d.rates || prev.rates, audience: d.audience || prev.audience,
          averageViews: d.averageViews || prev.averageViews, completionScore: d.completionScore || prev.completionScore
        }));
      }
    });

    return () => { unsubProjects(); unsubTrips(); unsubUser(); unsubInv(); };
  }, [fbUser, isLoggedIn, role]);

  // --- 處理函式 ---
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage || !fbUser) return;
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileRef = ref(storage, `artifacts/${internalAppId}/public/data/images/${Date.now()}_${files[i].name}`);
        const uploadTask = await uploadBytesResumable(fileRef, files[i]);
        urls.push(await getDownloadURL(uploadTask.ref));
      }
      setNewProject(prev => ({ ...prev, gallery: [...prev.gallery, ...urls] }));
    } catch (error) { console.error(error); } finally { setIsUploading(false); }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !db || !fbUser) return;
    const newId = Date.now().toString();
    try {
      await setDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'projects', newId), {
        ...newProject, id: newId, status: '招募中', applicants: 0, date: new Date().toLocaleDateString('zh-TW'),
        image: newProject.gallery[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      });
      setShowCreateModal(false);
      setNewProject({ title: '', category: '住宿', type: '互惠體驗', location: '', totalValue: '', valueBreakdown: '', requirements: '', spots: 1, gallery: [], description: '' });
    } catch (err) { console.error(err); }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.destination || !db) return;
    const newId = `t${Date.now()}`;
    try {
      await setDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'trips', newId), {
        ...newTrip, id: newId, creatorName: creatorProfile.name, status: '招募中', offers: 0
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
        ...creatorProfile, id: fbUser.uid, role: '創作者', tags: creatorProfile.tags.split(',').map(t => t.trim())
      }, { merge: true });
      alert("🎉 履歷更新成功！");
    } catch (error) { console.error(error); } finally { setIsSavingProfile(false); }
  };

  const handleUpdateInviteStatus = async (invId: string, newStatus: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', invId), { status: newStatus });
      alert(`已將狀態更新為「${newStatus}」！`);
    } catch (e) { console.error(e); }
  };

  const handleSubmitReview = async () => {
    if (!db || !reviewTargetId) return;
    const reviewData: ReviewData = { rating: reviewRating, comment: reviewComment, date: new Date().toLocaleDateString('zh-TW') };
    try {
      const invRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', reviewTargetId);
      if (role === 'business') await updateDoc(invRef, { businessReview: reviewData });
      else await updateDoc(invRef, { creatorReview: reviewData });
      alert("🎉 評價已送出！");
      setShowReviewModal(false);
    } catch (e) { console.error(e); }
  };

  const handleManageApplicants = (project: ProjectData) => {
    const apps = invitations.filter(inv => inv.projectId === project.id && inv.type === 'application');
    setCurrentProjectApplicants(apps);
    setCurrentProjectTitle(project.title);
    setShowApplicantsModal(true);
  };

  // --- 選單定義 ---
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

  // --- 內容渲染器 ---
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">{role === 'business' ? '早安，海角七號民宿 👋' : `早安，${creatorProfile.name} 👋`}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {role === 'business' ? (
                <>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><p className="text-sm text-slate-500 mb-1">本月總曝光 (Reach)</p><div className="flex items-baseline gap-2"><h3 className="text-3xl font-bold text-slate-900">12.5k</h3><span className="text-xs font-bold text-green-600 flex items-center"><TrendingUp size={12}/> +12%</span></div></div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><p className="text-sm text-slate-500 mb-1">進行中案源</p><h3 className="text-3xl font-bold text-slate-900">{projects.length}</h3></div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><p className="text-sm text-slate-500 mb-1">剩餘急單點數</p><h3 className="text-3xl font-bold text-indigo-600">5 <span className="text-sm text-slate-400 font-normal">點</span></h3></div>
                </>
              ) : (
                <>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><p className="text-sm text-slate-500 mb-1">Media Kit 瀏覽數</p><div className="flex items-baseline gap-2"><h3 className="text-3xl font-bold text-slate-900">856</h3><span className="text-xs font-bold text-green-600 flex items-center"><TrendingUp size={12}/> +24%</span></div></div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><p className="text-sm text-slate-500 mb-1">收到的邀請</p><h3 className="text-3xl font-bold text-slate-900">{invitations.filter(i => i.toName === creatorProfile.name).length}</h3></div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><p className="text-sm text-slate-500 mb-1">完案信用評分</p><h3 className="text-3xl font-bold text-purple-600">{creatorProfile.completionScore}</h3></div>
                </>
              )}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">近期通知</h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-start border-b border-slate-50 pb-4">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
                    <div><p className="text-sm text-slate-700">您收到了一則新的系統訊息：關於「夏季促銷方案」的最新更新。</p><p className="text-xs text-slate-400 mt-1">2 小時前</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'projects':
        return role === 'business' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">我的徵才 (案源管理)</h2>
              <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:bg-indigo-700"><Plus size={16}/> 新增案源</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr><th className="px-6 py-4">標題</th><th className="px-6 py-4">分類</th><th className="px-6 py-4">狀態</th><th className="px-6 py-4">應徵人數</th><th className="px-6 py-4 text-right">操作</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{p.title}</td>
                      <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{p.category}</span></td>
                      <td className="px-6 py-4"><span className="text-green-600 font-bold">{p.status}</span></td>
                      <td className="px-6 py-4 font-bold text-indigo-600">{invitations.filter(i => i.projectId === p.id && i.type === 'application').length} 人</td>
                      <td className="px-6 py-4 text-right"><button onClick={() => handleManageApplicants(p)} className="text-indigo-600 font-bold hover:underline">管理名單</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">我的應徵紀錄</h2>
            <div className="grid gap-4">
              {invitations.filter(i => i.fromName === creatorProfile.name && i.type === 'application').map(i => (
                <div key={i.id} className="bg-white p-6 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                  <div><h3 className="font-bold">{i.projectTitle}</h3><p className="text-sm text-slate-500">{i.toName} • {i.date}</p></div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${i.status === '已接受' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>{i.status}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'invitations':
        const filteredInvs = role === 'business' 
          ? invitations.filter(i => i.type === 'invite') 
          : invitations.filter(i => (i.toName === creatorProfile.name || i.toHandle === creatorProfile.handle) && i.type === 'invite');
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold">{role === 'business' ? '發出的邀請' : '收到的邀請'}</h2>
            <div className="grid gap-4">
              {filteredInvs.map(inv => (
                <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 shadow-sm">
                  <div className="md:w-1/3 flex items-center gap-4">
                    <img src={role === 'business' ? inv.toAvatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${inv.fromName}`} className="w-12 h-12 rounded-full" alt="avatar" />
                    <div><p className="font-bold">{role === 'business' ? inv.toName : inv.fromName}</p><p className="text-xs text-slate-500">{inv.date}</p></div>
                  </div>
                  <div className="md:w-2/3">
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mb-4">"{inv.message}"</p>
                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === '已接受' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>{inv.status}</span>
                      {role === 'creator' && inv.status === '待回覆' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateInviteStatus(inv.id, '已婉拒')} className="px-3 py-1.5 border rounded-lg text-xs font-bold">婉拒</button>
                          <button onClick={() => handleUpdateInviteStatus(inv.id, '已接受')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">接受邀請</button>
                        </div>
                      )}
                      {inv.status === '已接受' && (
                        <div className="flex gap-2">
                           <button className="px-3 py-1.5 bg-[#06C755] text-white rounded-lg text-xs font-bold flex items-center gap-1"><MessageCircle size={14}/> LINE</button>
                           <Link href="/calculator" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">智能合約</Link>
                           <button onClick={() => { setReviewTargetId(inv.id); setShowReviewModal(true); }} className="px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-lg text-xs font-bold">結案評價</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'trips':
        return role === 'creator' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">我的許願行程</h2>
              <button onClick={() => setShowCreateTripModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md"><Plus size={16}/> 發布許願</button>
            </div>
            <div className="grid gap-6">
              {trips.filter(t => t.creatorName === creatorProfile.name).map(t => (
                <div key={t.id} className="bg-white p-6 rounded-xl border border-slate-200 flex justify-between shadow-sm">
                  <div><h3 className="font-bold text-lg">{t.destination}</h3><p className="text-sm text-slate-500">{t.dates}</p></div>
                  <div className="text-right"><p className="text-2xl font-black text-purple-600">{t.offers}</p><p className="text-xs text-slate-400">廠商邀請</p></div>
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'settings':
        return role === 'business' ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">商家設定</h2>
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div><label className="block text-sm font-bold mb-2">商家名稱</label><input type="text" className="w-full p-3 border rounded-lg" defaultValue="海角七號民宿" /></div>
              <div><label className="block text-sm font-bold mb-2">所在地</label><input type="text" className="w-full p-3 border rounded-lg" defaultValue="屏東恆春" /></div>
              <div><label className="block text-sm font-bold mb-2">品牌介紹</label><textarea className="w-full p-3 border rounded-lg h-32" defaultValue="位於國境之南的無敵海景民宿..." /></div>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">儲存修改</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">編輯履歷 (Media Kit)</h2><button onClick={handleSaveCreatorProfile} disabled={isSavingProfile} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md">{isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} 儲存公開</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold mb-4">形象照片與基本資料</h3>
                   <div className="space-y-4">
                     <div className="h-48 bg-slate-100 rounded-xl border-2 border-dashed flex items-center justify-center text-slate-400">點擊上傳封面圖</div>
                     <div className="grid grid-cols-2 gap-4">
                       <div><label className="block text-xs font-bold text-slate-500 mb-1">顯示名稱</label><input type="text" className="w-full p-3 border rounded-xl" value={creatorProfile.name} onChange={e => setCreatorProfile({...creatorProfile, name: e.target.value})} /></div>
                       <div><label className="block text-xs font-bold text-slate-500 mb-1">LINE ID</label><input type="text" className="w-full p-3 border rounded-xl" value={creatorProfile.lineId} onChange={e => setCreatorProfile({...creatorProfile, lineId: e.target.value})} /></div>
                     </div>
                     <div><label className="block text-xs font-bold text-slate-500 mb-1">個人簡介</label><textarea className="w-full p-3 border rounded-xl h-24" value={creatorProfile.bio} onChange={e => setCreatorProfile({...creatorProfile, bio: e.target.value})} /></div>
                   </div>
                 </div>
              </div>
              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm"><h3 className="font-bold text-green-800 mb-4">合作參考報價</h3><div className="space-y-4"><div><label className="text-xs font-bold text-green-700">圖文貼文 NT$</label><input type="number" className="w-full p-3 border border-green-200 rounded-xl" value={creatorProfile.rates.post} onChange={e => setCreatorProfile({...creatorProfile, rates: {...creatorProfile.rates, post: Number(e.target.value)}})} /></div><div><label className="text-xs font-bold text-green-700">短影音 NT$</label><input type="number" className="w-full p-3 border border-green-200 rounded-xl" value={creatorProfile.rates.reels} onChange={e => setCreatorProfile({...creatorProfile, rates: {...creatorProfile.rates, reels: Number(e.target.value)}})} /></div></div></div>
              </div>
            </div>
          </div>
        );
      
      case 'wallet':
        return (
          <div className="space-y-8 animate-in fade-in">
            <h2 className="text-2xl font-bold">訂閱與方案</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-2xl border shadow-sm border-slate-200">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">目前方案</span>
                  <h3 className="text-2xl font-bold mt-4">Free 免費版</h3>
                  <p className="text-4xl font-black mt-2">$0 <span className="text-base font-normal text-slate-400">/ 月</span></p>
                  <button className="w-full mt-8 py-3 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed">使用中</button>
               </div>
               <div className="bg-indigo-600 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-yellow-400 text-indigo-900 text-xs font-bold px-3 py-1 rounded-bl-lg">PRO</div>
                  <h3 className="text-2xl font-bold mt-4 flex items-center gap-2">專業成長版 <Crown size={20} className="text-yellow-400 fill-yellow-400"/></h3>
                  <p className="text-4xl font-black mt-2">$999 <span className="text-base font-normal text-indigo-200">/ 月</span></p>
                  <button onClick={() => setPurchaseItem({id:'pro', name:'專業成長版 Pro', price: 999, type:'subscription'})} className="w-full mt-8 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-indigo-50">立即升級</button>
               </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-center relative"><div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-indigo-900 opacity-50"></div><div className="relative z-10"><h1 className="text-4xl font-extrabold mb-4">X-Match</h1><p className="text-lg text-slate-200">連結在地旅宿與優質創作者，開啟您的互惠旅程。</p></div></div>
          <div className="md:w-1/2 p-12 flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-6">{authMode === 'login' ? '歡迎回來' : '建立您的帳號'}</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button onClick={() => setRole('business')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${role === 'business' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>我是商家</button>
              <button onClick={() => setRole('creator')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${role === 'creator' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>我是創作者</button>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && <div><label className="block text-sm font-bold mb-1">暱稱</label><input type="text" className="w-full p-3 border rounded-lg" required /></div>}
              <div><label className="block text-sm font-bold mb-1">Email</label><input type="email" className="w-full p-3 border rounded-lg" required /></div>
              <div><label className="block text-sm font-bold mb-1">密碼</label><input type="password" className="w-full p-3 border rounded-lg" required /></div>
              <button type="submit" className="w-full py-3 bg-sky-500 text-white font-bold rounded-lg shadow-lg hover:bg-sky-600">登入 {role === 'business' ? '商家後台' : '創作者中心'}</button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-600">{authMode === 'login' ? <p>還沒有帳號？ <button onClick={() => setAuthMode('register')} className="text-sky-600 font-bold hover:underline">立即註冊</button></p> : <p>已經有帳號了？ <button onClick={() => setAuthMode('login')} className="text-sky-600 font-bold hover:underline">直接登入</button></p>}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col overflow-y-auto m-0 p-0">
      {/* 頂部導覽列 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <Link href="/" className="font-extrabold text-2xl text-sky-500">X-Match</Link>
          <div className="flex items-center gap-4">
             <span className={`px-3 py-1 rounded-full text-xs font-bold ${role === 'business' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>{role === 'business' ? 'Business Pro' : 'Creator Studio'}</span>
             <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        {/* 側邊導覽 */}
        <aside className="w-64 shrink-0 hidden md:block">
          <nav className="space-y-2 sticky top-24">
            {menuItems.map(i => (
              <button key={i.id} onClick={() => setActiveTab(i.id as Tab)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === i.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                <i.icon size={18} /> {i.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* 主內容區 */}
        <main className="flex-1 pb-32">
          {renderContent()}
        </main>
      </div>

      {/* --- 全域彈出視窗 --- */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-xl flex items-center gap-2"><Crown className="text-yellow-500" size={24}/> 填寫結案評價</h3><button onClick={() => setShowReviewModal(false)}><X size={20} className="text-slate-400"/></button></div>
            <div className="flex justify-center gap-2 mb-6">{[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110 active:scale-95"><Star size={32} className={`${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} /></button>))}</div>
            <textarea className="w-full p-3 border rounded-xl h-24 resize-none mb-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="寫下您的心得評語..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
            <button onClick={handleSubmitReview} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all active:scale-95">送出評價</button>
          </div>
        </div>
      )}

      {/* 行動版導覽 */}
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