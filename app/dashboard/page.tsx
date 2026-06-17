'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Users, Mail, DollarSign, Settings, LogOut, Bell, 
  Briefcase, Plane, FileSignature, CheckCircle2, Search, Plus, MapPin, 
  CreditCard, TrendingUp, User, Calendar, Save, Image as ImageIcon, Camera, Upload, BarChart3, Building2, Info, X,
  Zap, Crown, Shield, Rocket, ListPlus, Loader2, Landmark, MessageCircle, Star, RefreshCcw, ChevronRight, Eye, Lock, Link as LinkIcon, Instagram, Youtube, Sparkles, AlertCircle, Trash2
} from 'lucide-react';

// --- Firebase 核心引入 ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// --- 自定義 Link 元件 (解決 next/link 錯誤) ---
const Link = ({ href, children, className, ...props }: any) => (
  <a href={href} className={className} {...props}>
    {children}
  </a>
);

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
  numericValue: number; totalValue: string; valueBreakdown: string; requirements: string; spots: number; 
  status: string; applicants: number; date: string; image?: string; gallery?: string[]; requiredTier?: string;
  validDays?: string;
  deliverables?: string[]; // ✨ 內建交付項目
  requirementsNote?: string; // ✨ 備註說明
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
  extraConditions?: string;
}

interface PaymentItem {
  id: string; name: string; price: number; type: 'subscription' | 'one-time';
}

// ✨ 內建的交付選項清單
const deliverableOptions = ['IG 圖文貼文', 'IG 限時動態', 'IG Reels 短影音', 'FB 粉絲專頁貼文', 'YouTube 影片', 'TikTok 短影音', '部落格文章', 'Google 商家評論'];

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'business' | 'creator'>('business');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [localUid, setLocalUid] = useState<string>(''); 

  // 業者權限與點數
  const [providerPlan, setProviderPlan] = useState<'free' | 'pro'>('free');
  const [singleInvites, setSingleInvites] = useState<number>(0); // ✨ 單次解鎖票券
  const [unlockedApps, setUnlockedApps] = useState<string[]>([]); // ✨ 已用票券解鎖的申請紀錄

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [editProjectId, setEditProjectId] = useState<string | null>(null); 
  const [newProject, setNewProject] = useState({
    title: '', category: '住宿', type: '互惠體驗', location: '',
    numericValue: 0, valueBreakdown: '', requirements: '', 
    deliverables: [] as string[], requirementsNote: '',
    spots: 1, gallery: [] as string[],
    validDays: '不限 (平假日皆可)' 
  });
  const [isUploading, setIsUploading] = useState(false);
  
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [currentProjectApplicants, setCurrentProjectApplicants] = useState<InvitationData[]>([]);
  const [currentProjectTitle, setCurrentProjectTitle] = useState('');
  
  const [viewApplicant, setViewApplicant] = useState<any>(null);

  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [newTrip, setNewTrip] = useState({ destination: '', startDate: '', endDate: '', partySize: '1人', purpose: '', needs: '' }); 

  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  
  // 評價與合約 Modal 狀態
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false); // ✨ 預覽合約
  const [reviewTargetId, setReviewTargetId] = useState<string | null>(null); 
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  const [viewProject, setViewProject] = useState<ProjectData | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  const [creatorProfile, setCreatorProfile] = useState({
    name: '林小美', handle: '@may_travel', lineId: '', location: '台北市', tags: '旅遊, 美食, 親子',
    bio: '專注於親子友善飯店與在地美食推廣，擁有高黏著度的媽媽社群。',
    tier: '未評級',
    coverImage: '', avatar: '', portfolio: [] as string[],
    socialLinks: { ig: '', yt: '', tiktok: '', other: '' },
    rates: { post: 5000, story: 1500, reels: 8000 },
    audience: { gender: '女性 85%', age: '25-34歲', topCity: '台北/新北' },
    followers: 45000, 
    averageViews: 5000,
    completionScore: 5.0
  });
  
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [purchaseItem, setPurchaseItem] = useState<PaymentItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer'>('credit_card');
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'limit' | 'line' | 'tier'>('limit');

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
      
      let uid = localStorage.getItem('xmatch_uid');
      if (!uid) {
        uid = 'user_' + Date.now().toString().slice(-6);
        localStorage.setItem('xmatch_uid', uid);
      }
      setLocalUid(uid);
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
    if (!db || !isLoggedIn) return;
    
    const currentUid = fbUser?.uid || localUid;
    
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

    const userRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', currentUid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (role === 'creator' && d.role === '創作者') {
          setCreatorProfile(prev => ({
            ...prev,
            name: d.name || prev.name, handle: d.handle || prev.handle, lineId: d.lineId || prev.lineId,
            location: d.location || prev.location, 
            tags: Array.isArray(d.tags) ? d.tags.join(', ') : (d.tags || prev.tags), 
            tier: d.tier || '未評級',
            socialLinks: d.socialLinks || prev.socialLinks,
            bio: d.bio || prev.bio, coverImage: d.coverImage || '',
            avatar: d.avatar || '', portfolio: d.portfolio || [],
            rates: d.rates || prev.rates, audience: d.audience || prev.audience,
            followers: d.followers || prev.followers, 
            averageViews: d.averageViews || prev.averageViews,
            completionScore: d.completionScore || prev.completionScore
          }));
        } else if (role === 'business') {
          setProviderPlan(d.plan === 'Pro' ? 'pro' : 'free');
          setSingleInvites(d.singleInvites || 0); // 讀取票券餘額
        }
      }
    });

    return () => { unsubProjects(); unsubTrips(); unsubUser(); unsubInv(); };
  }, [db, fbUser, isLoggedIn, role, localUid]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    
    if (!storage) { 
      setTimeout(() => {
        const fakeUrl = `https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
        setNewProject(prev => ({ ...prev, gallery: [...prev.gallery, fakeUrl] }));
        setIsUploading(false);
      }, 1000);
      return; 
    }
    
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileRef = ref(storage, `artifacts/${internalAppId}/public/data/images/${Date.now()}_${files[i].name}`);
        const uploadTask = await uploadBytesResumable(fileRef, files[i]);
        urls.push(await getDownloadURL(uploadTask.ref));
      }
      setNewProject(prev => ({ ...prev, gallery: [...prev.gallery, ...urls] }));
    } catch (error) {
      const fakeUrl = `https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
      setNewProject(prev => ({ ...prev, gallery: [...prev.gallery, fakeUrl] }));
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setNewProject(prev => ({ ...prev, gallery: prev.gallery.filter((_, idx) => idx !== indexToRemove) }));
  };

  const handleCreatorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'avatar' | 'portfolio') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (type === 'cover') setIsUploadingCover(true);
    else if (type === 'avatar') setIsUploadingAvatar(true);
    else setIsUploadingPortfolio(true);

    const currentUid = fbUser?.uid || localUid;

    if (!storage) { 
      setTimeout(() => {
        const fakeUrl = `https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
        if (type === 'cover') setCreatorProfile(p => ({ ...p, coverImage: fakeUrl }));
        else if (type === 'avatar') setCreatorProfile(p => ({ ...p, avatar: fakeUrl }));
        else setCreatorProfile(p => ({ ...p, portfolio: [...p.portfolio, fakeUrl] }));
        
        if (type === 'cover') setIsUploadingCover(false);
        else if (type === 'avatar') setIsUploadingAvatar(false);
        else setIsUploadingPortfolio(false);
      }, 1000);
      return; 
    }

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileRef = ref(storage, `artifacts/${internalAppId}/public/data/creators/${currentUid}_${type}_${Date.now()}_${files[i].name}`);
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

  const handleEditProject = (project: ProjectData) => {
    setNewProject({
      title: project.title, category: project.category, type: project.type, location: project.location,
      numericValue: project.numericValue || 0, valueBreakdown: project.valueBreakdown, 
      requirements: project.requirements, 
      deliverables: project.deliverables || [], // ✨ 讀取基本交付內容
      requirementsNote: project.requirementsNote || '', // ✨ 讀取自訂備註
      spots: project.spots, gallery: project.gallery || (project.image ? [project.image] : []),
      validDays: project.validDays || '不限 (平假日皆可)' 
    });
    setEditProjectId(project.id);
    setShowCreateModal(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !newProject.location || newProject.numericValue <= 0) { alert("請填寫完整資訊與總價值"); return; }
    
    const targetId = editProjectId || Date.now().toString(); 
    const requiredTier = newProject.numericValue >= 30000 ? 'S' : '無限制'; 

    // ✨ 組合 Requirements
    const combinedRequirements = [
      (newProject.deliverables && newProject.deliverables.length > 0) ? `【基本交付需求】\n${newProject.deliverables.map(d => `✅ ${d}`).join('\n')}` : '',
      newProject.requirementsNote ? `【特殊備註】\n${newProject.requirementsNote}` : ''
    ].filter(Boolean).join('\n\n').trim();

    try {
      if (db) {
        await setDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'projects', targetId), {
          id: targetId, title: newProject.title, category: newProject.category, type: newProject.type, location: newProject.location,
          numericValue: newProject.numericValue, totalValue: `NT$ ${newProject.numericValue.toLocaleString()}`, 
          valueBreakdown: newProject.valueBreakdown, 
          deliverables: newProject.deliverables || [],
          requirementsNote: newProject.requirementsNote || '',
          requirements: combinedRequirements,
          spots: newProject.spots, status: '招募中', applicants: 0, date: new Date().toLocaleDateString('zh-TW'),
          requiredTier: requiredTier,
          validDays: newProject.validDays, 
          image: newProject.gallery.length > 0 ? newProject.gallery[0] : "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          gallery: newProject.gallery
        }, { merge: true }); 
      }
      setShowCreateModal(false);
      setEditProjectId(null); 
      setNewProject({ title: '', category: '住宿', type: '互惠體驗', location: '', numericValue: 0, valueBreakdown: '', requirements: '', deliverables: [], requirementsNote: '', spots: 1, gallery: [], validDays: '不限 (平假日皆可)' });
    } catch (err) { console.error(err); }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.destination || !newTrip.startDate || !newTrip.endDate) { alert("請填寫完整目的地與日期"); return; }
    
    const newId = `t${Date.now()}`;
    const formattedDates = `${newTrip.startDate.replace(/-/g, '/')} - ${newTrip.endDate.replace(/-/g, '/')}`;

    try {
      if (db) {
          await setDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'trips', newId), {
            id: newId, creatorName: creatorProfile.name || '創作者', destination: newTrip.destination, dates: formattedDates,
            partySize: newTrip.partySize, purpose: newTrip.purpose, needs: newTrip.needs, status: '招募中', offers: 0
          });
      }
      setShowCreateTripModal(false);
      setNewTrip({ destination: '', startDate: '', endDate: '', partySize: '1人', purpose: '', needs: '' });
    } catch (err) { console.error(err); }
  };

  const handleSaveCreatorProfile = async () => {
    setIsSavingProfile(true);
    const currentUid = fbUser?.uid || localUid;
    
    if (!db) { 
      setTimeout(() => {
        setIsSavingProfile(false);
        alert("🎉 (模擬模式) 履歷已成功儲存！");
      }, 1000);
      return; 
    }
    
    try {
      const safeTags = typeof creatorProfile.tags === 'string'
        ? creatorProfile.tags.split(',').map(t => t.trim()).filter(Boolean)
        : Array.isArray(creatorProfile.tags) ? creatorProfile.tags : [];
      
      const safeHandle = creatorProfile.handle || 'creator';

      await setDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', currentUid), {
        id: currentUid, 
        name: creatorProfile.name, 
        email: `${safeHandle.replace('@', '')}@creator.com`, 
        role: '創作者', 
        status: '活躍', 
        plan: 'Free',
        joinDate: new Date().toLocaleDateString('zh-TW'), 
        handle: safeHandle, 
        lineId: creatorProfile.lineId, 
        location: creatorProfile.location,
        tags: safeTags, 
        bio: creatorProfile.bio, 
        coverImage: creatorProfile.coverImage,
        avatar: creatorProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorProfile.name}`, 
        portfolio: creatorProfile.portfolio, 
        rates: creatorProfile.rates, 
        audience: creatorProfile.audience,
        socialLinks: creatorProfile.socialLinks, 
        tier: creatorProfile.tier,
        followers: creatorProfile.followers, 
        engagement: 4.5, completedJobs: 0,
        averageViews: creatorProfile.averageViews, 
        completionScore: creatorProfile.completionScore
      }, { merge: true });
      
      alert("🎉 履歷已成功儲存並同步至前台與 Admin 後台！");
    } catch (error) { 
      alert("🎉 (本地模式) 您的履歷已暫存。如果要同步到前台，請至 Firebase 調整 Firestore 規則為 allow read, write: if true;");
    } finally { 
      setIsSavingProfile(false); 
    }
  };

  const handleUpdateInviteStatus = async (invId: string, newStatus: string) => {
    if (!db) return;
    try {
      const invRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', invId);
      await updateDoc(invRef, { status: newStatus });
      alert(`已將狀態標示為「${newStatus}」！`);
    } catch (e) {
      alert("更新狀態失敗，請稍後再試。");
    }
  };

  // ✨ 刪除發送的邀請
  const handleDeleteInvitation = async (invId: string) => {
    if (!confirm("確定要收回這筆邀請紀錄嗎？刪除後廠商將無法看到您的邀請。")) return;
    if (!db) {
      setInvitations(prev => prev.filter(inv => inv.id !== invId));
      return;
    }
    try {
      await deleteDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', invId));
      alert("已成功收回該筆邀請。");
    } catch (error) {
      console.error("刪除失敗", error);
      alert("收回失敗，請檢查權限");
    }
  };

  const handleOpenReviewModal = (invId: string) => {
    setReviewTargetId(invId);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!db || !reviewTargetId) return;
    
    const reviewData: ReviewData = { rating: reviewRating, comment: reviewComment, date: new Date().toLocaleDateString('zh-TW') };

    try {
      const invRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'invitations', reviewTargetId);
      if (role === 'business') await updateDoc(invRef, { businessReview: reviewData });
      else await updateDoc(invRef, { creatorReview: reviewData });
      alert("🎉 評價已送出！案件成功結案。");
      setShowReviewModal(false);
    } catch (e) { alert("發生錯誤，請稍後再試。"); }
  };

  const handleViewProject = (projectId?: string) => {
    if (!projectId) return;
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setViewProject(proj);
      setActiveImage(proj.image || (proj.gallery && proj.gallery.length > 0 ? proj.gallery[0] : ''));
    } else alert("此案源可能已關閉或被移除。");
  };

  const handleManageApplicants = (project: ProjectData) => {
    const apps = invitations.filter(inv => inv.projectId === project.id && inv.type === 'application');
    const simulatedApps = apps.length > 0 ? apps : [
      {
        id: `mock-app-${Date.now()}`,
        fromName: "潛力新星",
        toName: "海角七號民宿",
        toHandle: "@new_star",
        toAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=newstar",
        message: "您好，我非常喜歡這間海景房！雖然我的等級尚未達到 S 級，但我願意提供額外的曝光資源來爭取這次合作機會。",
        status: "待審核",
        date: new Date().toLocaleDateString('zh-TW'),
        projectId: project.id,
        projectTitle: project.title,
        type: 'application' as const,
        extraConditions: "✅ 加碼一支 YouTube 10 分鐘開箱長影片\n✅ 同步發布 3 篇 IG 限動並標記帳號",
        creatorInfo: {
          name: "潛力新星",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=newstar",
          followers: 8500, averageViews: 2000, completionScore: 4.8, tier: 'A',
          lineId: "new_star_line", tags: ["旅遊", "新秀"], socialLinks: { ig: "https://instagram.com", yt: "https://youtube.com" }
        }
      }
    ];

    setCurrentProjectApplicants(simulatedApps);
    setCurrentProjectTitle(project.title);
    setShowApplicantsModal(true);
  };

  const handlePaymentSubmit = async () => {
    setPaymentStep('processing');
    const currentUid = fbUser?.uid || localUid;
    
    setTimeout(async () => {
      if (db && purchaseItem) {
        try {
          const newTxId = `TX-${Date.now().toString().slice(-6)}`;
          await setDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'transactions', newTxId), {
            id: newTxId, user: role === 'business' ? '海角七號民宿' : creatorProfile.name, item: purchaseItem.name,
            amount: purchaseItem.price, status: '成功', date: new Date().toLocaleString('zh-TW', { hour12: false })
          });
          
          if ((purchaseItem.id === 'pro' || purchaseItem.id === 'pro-year') && role === 'business') {
            await updateDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', currentUid), { plan: 'Pro' });
            setProviderPlan('pro');
          }
          
          // ✨ 處理購買單次高流量解鎖券
          if (purchaseItem.id === 'boost-single-invite' && role === 'business') {
            const newCount = singleInvites + 1;
            await updateDoc(doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', currentUid), { singleInvites: newCount });
            setSingleInvites(newCount);
          }
        } catch (err) { console.error(err); }
      } else {
         // 本地模擬
         if (purchaseItem?.id === 'boost-single-invite') setSingleInvites(prev => prev + 1);
         if (purchaseItem?.id === 'pro' || purchaseItem?.id === 'pro-year') setProviderPlan('pro');
      }
      setPaymentStep('success');
    }, 2000);
  };

  const handleAuth = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!auth) return;
    try {
      await signInAnonymously(auth);
      setTimeout(() => { setIsLoggedIn(true); localStorage.setItem('xmatch_logged_in', 'true'); }, 800); 
    } catch (e) {
      setIsLoggedIn(true);
      localStorage.setItem('xmatch_logged_in', 'true');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('xmatch_logged_in');
    localStorage.removeItem('xmatch_role');
  };

  const handleRoleSwitch = (newRole: 'business' | 'creator') => {
    setRole(newRole);
    localStorage.setItem('xmatch_role', newRole);
    setActiveTab('overview'); 
  };

  const themeText = role === 'business' ? 'text-indigo-600' : 'text-purple-600';
  const themeBg = role === 'business' ? 'bg-indigo-600' : 'bg-purple-600';

  const TierBadge = ({ tier }: { tier?: string }) => {
    if (!tier || tier === '未評級') return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200">未評級</span>;
    const colors: Record<string, string> = {
      'S': 'bg-gradient-to-r from-yellow-300 to-amber-500 text-slate-900 border-amber-300 shadow-sm',
      'A': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'B': 'bg-sky-100 text-sky-700 border-sky-200',
      'C': 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 w-fit ${colors[tier] || colors['C']}`}>
        {tier === 'S' && <Crown size={12} />} {tier} 級
      </span>
    );
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
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">
                {role === 'business' ? '早安，海角七號民宿 👋' : `早安，${creatorProfile.name} 👋`}
              </h2>
              {role === 'business' && (
                <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold">
                  {providerPlan === 'pro' ? <><Crown size={14} className="text-yellow-400"/> Pro 專業版</> : 'Free 免費版'}
                </div>
              )}
            </div>

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
                    <p className="text-sm text-slate-500 mb-1">單次高階邀約券</p>
                    <h3 className={`text-3xl font-bold ${themeText}`}>{singleInvites} <span className="text-sm text-slate-400 font-normal">張</span></h3>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">目前評級</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-2"><TierBadge tier={creatorProfile.tier} /></h3>
                    </div>
                    <p className="text-xs text-slate-400">努力接案提升信用分數可升級！</p>
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
                      <th className="px-6 py-4 font-bold">等級限制</th>
                      <th className="px-6 py-4 font-bold">分類</th>
                      <th className="px-6 py-4 font-bold">狀態</th>
                      <th className="px-6 py-4 font-bold">應徵人數</th>
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
                             {project.requiredTier === 'S' ? <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-1 rounded font-bold border border-amber-200">S 級優先</span> : <span className="text-slate-400 text-xs">無限制</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">{project.category}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${project.status === '招募中' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{project.status}</span>
                          </td>
                          <td className="px-6 py-4"><div className="flex items-center gap-1.5 font-bold text-slate-700"><Users size={14} className="text-slate-400"/> {applicantCount} 人</div></td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{project.date}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-3">
                              <button onClick={() => handleEditProject(project)} className="font-bold text-slate-400 hover:text-indigo-600 transition-colors">編輯</button>
                              <button onClick={() => handleManageApplicants(project)} className={`font-bold hover:underline ${themeText}`}>管理名單</button>
                            </div>
                          </td>
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
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
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
                           
                           // ✨ 判斷是否為 S/A 級網紅且未付費且未解鎖 (Paywall 機制)
                           const isPremiumTier = info.tier === 'S' || info.tier === 'A';
                           const isLocked = isPremiumTier && providerPlan !== 'pro' && !unlockedApps.includes(app.id);

                           // 若觸發付費牆，顯示上鎖的模糊卡片
                           if (isLocked) {
                             return (
                               <div key={app.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center group">
                                  {/* 上鎖提示區塊 */}
                                  <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-3 shadow-inner">
                                      <Lock size={24} className="text-amber-500" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-1">發現 {info.tier} 級高影響力創作者！</h4>
                                    <p className="text-xs text-slate-500 mb-4 max-w-sm">有高影響力網紅對您的案源感興趣並提出了加碼方案。升級專業版 (Pro) 或使用單次解鎖即可查看完整履歷與聯繫方式。</p>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => { setShowApplicantsModal(false); setUpgradeReason('tier'); setShowUpgradeModal(true); }}
                                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                                      >
                                        立即升級 Pro
                                      </button>
                                      <button 
                                        onClick={() => { 
                                          if(singleInvites > 0) {
                                            if(confirm('將消耗 1 張高階邀約券解鎖此網紅履歷，確定嗎？')) {
                                               setSingleInvites(prev => prev - 1);
                                               setUnlockedApps(prev => [...prev, app.id]);
                                            }
                                          } else {
                                             setPurchaseItem({ id: 'boost-single-invite', name: '單次高流量解鎖券', price: 150, type: 'one-time' }); 
                                             setShowApplicantsModal(false);
                                             setPaymentStep('form');
                                          }
                                        }}
                                        className="px-4 py-2 bg-white text-amber-600 border border-amber-200 text-sm font-bold rounded-xl shadow-sm hover:bg-amber-50 transition-colors"
                                      >
                                        單次解鎖 ($150)
                                      </button>
                                    </div>
                                  </div>
                                  {/* 底層模糊假資料 (視覺誘餌) */}
                                  <div className="opacity-40 flex w-full p-6 items-start gap-4 filter blur-[3px]">
                                    <div className="w-16 h-16 bg-slate-300 rounded-full shrink-0 border-2 border-white"></div>
                                    <div className="flex-1 space-y-3">
                                      <div className="h-5 bg-slate-300 rounded w-1/3"></div>
                                      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                      <div className="h-12 bg-slate-200 rounded w-full mt-2"></div>
                                    </div>
                                  </div>
                               </div>
                             );
                           }

                           // 正常顯示的履歷卡片
                           return (
                             <div key={app.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                               {/* 創作者卡片頭部 */}
                               <div className="flex flex-col sm:flex-row items-start gap-5 mb-5 border-b border-slate-100 pb-5">
                                 <div className="relative shrink-0">
                                   <img src={info.avatar || app.toAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.fromName}`} className="w-16 h-16 rounded-full border-4 border-slate-50 shadow-sm" alt="Avatar"/>
                                 </div>
                                 
                                 <div className="flex-1 w-full">
                                   <div className="flex justify-between items-start">
                                      <div>
                                         <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-900 text-lg">{info.name || app.fromName}</h4>
                                            <TierBadge tier={info.tier} />
                                         </div>
                                         <div className="flex gap-3 text-xs text-slate-500 mt-1.5 font-medium">
                                            <span className="flex items-center gap-1"><Users size={12}/> {info.followers ? (info.followers/1000).toFixed(1) + 'k' : 'N/A'} 粉絲</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="flex items-center gap-1"><Eye size={12}/> {info.averageViews ? (info.averageViews/1000).toFixed(1)+'k' : 'N/A'} 觀看</span>
                                         </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${app.status === '待審核' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                            {app.status}
                                        </span>
                                        {app.status === '已接受' && (
                                            <div className="flex gap-2 justify-end flex-wrap mt-2">
                                                {/* ✨ 付費牆/解鎖後可看 LINE */}
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

                                                <Link href="/calculator" className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-1 shadow-sm transition-colors">
                                                    <FileSignature size={12}/> 合約
                                                </Link>
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
                               
                               <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl mb-4 italic border border-slate-100 relative">
                                 <div className="absolute top-3 left-3 text-slate-300"><MessageCircle size={16}/></div>
                                 <span className="pl-6 block leading-relaxed">{app.message}</span>
                               </div>

                               {app.extraConditions && (
                                 <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-5">
                                   <p className="text-xs font-bold text-orange-800 mb-1 flex items-center gap-1"><Sparkles size={14}/> 創作者加碼條件 (爭取 S 級案源)</p>
                                   <p className="text-sm text-orange-900 font-medium whitespace-pre-line">{app.extraConditions}</p>
                                 </div>
                               )}
                               
                               {app.status === '待審核' ? (
                                 <div className="flex gap-3 mt-4">
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
            
            {/* 發布/編輯案源 Modal */}
            {showCreateModal && (
               <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                 <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                      <ListPlus size={20} className="text-sky-500"/> {editProjectId ? '編輯案源' : '發布新案源'} (Cloud Sync)
                    </h3>
                    <button onClick={() => { setShowCreateModal(false); setEditProjectId(null); setNewProject({ title: '', category: '住宿', type: '互惠體驗', location: '', numericValue: 0, valueBreakdown: '', requirements: '', deliverables: [], requirementsNote: '', spots: 1, gallery: [], validDays: '不限 (平假日皆可)' }); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
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
                              <label className="block text-xs font-bold text-slate-500 mb-1">適用時間 (平/假日) <span className="text-red-500">*</span></label>
                              <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" value={newProject.validDays} onChange={(e) => setNewProject({...newProject, validDays: e.target.value})}>
                                <option>不限 (平假日皆可)</option><option>限平日</option><option>限假日</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">地點 <span className="text-red-500">*</span></label>
                              <div className="flex items-center relative">
                                 <MapPin size={16} className="absolute left-3 text-slate-400"/>
                                 <input type="text" className="w-full pl-9 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" placeholder="例如：屏東恆春" value={newProject.location} onChange={(e) => setNewProject({...newProject, location: e.target.value})} />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">上傳環境相片 (建議上傳真實美照以吸引網紅)</label>
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
                              <label className="block text-xs font-bold text-slate-700 mb-1">合作總價值 (填寫數字 NT$)</label>
                              <input 
                                type="number" 
                                min="0"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-600" 
                                placeholder="例如：8800" 
                                value={newProject.numericValue} 
                                onChange={(e) => setNewProject({...newProject, numericValue: Number(e.target.value)})} 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">價值拆解說明</label>
                              <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="例如：住宿($6800) + 早餐($800)" value={newProject.valueBreakdown} onChange={(e) => setNewProject({...newProject, valueBreakdown: e.target.value})} />
                            </div>
                          </div>

                          {newProject.numericValue >= 30000 && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs mt-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                              <p className="font-bold mb-1 flex items-center gap-1"><Crown size={14} className="text-amber-500"/> 高價值案源設定</p>
                              系統判定此案源總價值超過 30,000 元，將自動標示為 <b>S 級網紅優先</b>。<br/>
                              (A、B、C 級網紅仍可應徵，但系統將強制要求他們提出「加碼條件」，例如：多一篇貼文或短影音，方可送出申請。)
                            </div>
                          )}

                          {/* ✨ 新增：基本交付內容需求選項 */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">基本交付內容需求 <span className="text-red-500">*</span></label>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {deliverableOptions.map(opt => (
                                <label key={opt} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border cursor-pointer transition-all ${newProject.deliverables?.includes(opt) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                  <input 
                                    type="checkbox" 
                                    checked={newProject.deliverables?.includes(opt) || false} 
                                    onChange={(e) => {
                                      const current = newProject.deliverables || [];
                                      if (e.target.checked) setNewProject({...newProject, deliverables: [...current, opt]});
                                      else setNewProject({...newProject, deliverables: current.filter(item => item !== opt)});
                                    }}
                                    className="hidden" 
                                  />
                                  <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${newProject.deliverables?.includes(opt) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                     {newProject.deliverables?.includes(opt) && <CheckCircle2 size={10} className="text-white"/>}
                                  </div>
                                  {opt}
                                </label>
                              ))}
                            </div>
                            <textarea 
                              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-16 resize-none text-sm" 
                              placeholder="其他手動輸入備註 (例如：需包含 3 支短影片素材供品牌投放廣告...)" 
                              value={newProject.requirementsNote || ''} 
                              onChange={(e) => setNewProject({...newProject, requirementsNote: e.target.value})}
                            ></textarea>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">
                          <CheckCircle2 size={18} /> {editProjectId ? '儲存修改' : '確認發布'}
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
        if (role === 'business') {
          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-slate-900">已發送的邀請</h2>
              {invitations.length > 0 ? (
                <div className="grid gap-4">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 md:w-1/3 shrink-0">
                        <img src={inv.toAvatar} className="w-12 h-12 rounded-full border border-slate-200 object-cover" alt="avatar" />
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

                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 mb-3 line-clamp-2">
                           "{inv.message}"
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-xs text-slate-400 font-mono">{inv.date}</span>
                           <div className="flex items-center gap-2">
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                               inv.status === '已接受' ? 'bg-green-100 text-green-700' :
                               inv.status === '已婉拒' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                             }`}>{inv.status}</span>
                             {inv.status === '已接受' && (
                               <div className="flex gap-2">
                                  {providerPlan === 'pro' ? (
                                    inv.creatorInfo?.lineId ? (
                                      <a href={`https://line.me/ti/p/~${inv.creatorInfo.lineId}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-[#06C755] text-white rounded-lg text-xs font-bold hover:bg-[#05b34c] shadow-sm flex items-center gap-1"><MessageCircle size={14}/> LINE</a>
                                    ) : (
                                      <button className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-1"><MessageCircle size={14}/> 無 LINE</button>
                                    )
                                  ) : (
                                    <button onClick={() => setActiveTab('wallet')} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-700 flex items-center gap-1 shadow-sm transition-colors">
                                      <Lock size={10}/> 升級解鎖 LINE
                                    </button>
                                  )}
                                  
                                  <button onClick={() => setShowContractModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1"><FileSignature size={14} /> 合約</button>
                                  {inv.businessReview ? (
                                    <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold border border-yellow-200">
                                      <Star size={12} className="fill-yellow-500 text-yellow-500"/> {inv.businessReview.rating} 已評價
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => handleOpenReviewModal(inv.id)}
                                      className="px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-lg text-xs font-bold hover:bg-yellow-500 shadow-sm flex items-center gap-1"
                                    >
                                      <Crown size={14} /> 評價
                                    </button>
                                  )}
                               </div>
                             )}
                             {/* ✨ 刪除邀請按鈕 */}
                             <button 
                               onClick={() => handleDeleteInvitation(inv.id)}
                               className="p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors ml-1" 
                               title="收回/刪除邀請"
                             >
                               <Trash2 size={16} />
                             </button>
                           </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center">
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
                                 {inv.status === '已接受' && (
                                   <div className="flex gap-2">
                                     {inv.fromLineId ? (
                                        <a href={`https://line.me/ti/p/~${inv.fromLineId}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-[#06C755] text-white rounded-lg text-xs font-bold hover:bg-[#05b34c] shadow-sm flex items-center gap-1"><MessageCircle size={14}/> LINE</a>
                                     ) : (
                                        <button className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-1"><MessageCircle size={14}/> 無 LINE</button>
                                     )}
                                     <button onClick={() => setShowContractModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1"><FileSignature size={14} /> 合約</button>
                                     
                                     {inv.creatorReview ? (
                                        <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold border border-yellow-200">
                                          <Star size={12} className="fill-yellow-500 text-yellow-500"/> {inv.creatorReview.rating} 已評價
                                        </div>
                                     ) : (
                                        <button 
                                          onClick={() => handleOpenReviewModal(inv.id)}
                                          className="px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-lg text-xs font-bold hover:bg-yellow-500 shadow-sm flex items-center gap-1"
                                        >
                                          <Crown size={14} /> 評價
                                        </button>
                                     )}
                                   </div>
                                 )}
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
        return role === 'creator' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">我的許願行程</h2>
              <button 
                onClick={() => setShowCreateTripModal(true)}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all bg-purple-600 text-white hover:bg-purple-700`}
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
                          <MapPin size={18} className="text-purple-500" /> {trip.destination}
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
                      <p className="text-4xl font-black text-purple-600 mb-1">{trip.offers}</p>
                      <p className="text-xs text-slate-500 font-medium">間廠商邀請</p>
                      <button 
                        onClick={() => setActiveTab('invitations')} 
                        className="mt-4 w-full py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors"
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
                      <Plane size={20} className="text-purple-500" /> 發布許願行程
                    </h3>
                    <button onClick={() => setShowCreateTripModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                    <form className="space-y-4" onSubmit={handleCreateTrip}>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">目的地 (城市/區域) <span className="text-red-500">*</span></label>
                        <input type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium" placeholder="例如：宜蘭礁溪、台南中西區" value={newTrip.destination} onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">出發日期 <span className="text-red-500">*</span></label>
                          <input type="date" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" value={newTrip.startDate} onChange={(e) => setNewTrip({...newTrip, startDate: e.target.value})} required />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">結束日期 <span className="text-red-500">*</span></label>
                          <input type="date" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" value={newTrip.endDate} onChange={(e) => setNewTrip({...newTrip, endDate: e.target.value})} required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">隨行人數</label>
                        <input type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" placeholder="例如：2大1小、單人" value={newTrip.partySize} onChange={(e) => setNewTrip({...newTrip, partySize: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">行程目的 (將產出什麼內容？)</label>
                        <textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-20 resize-none text-sm" placeholder="例如：家庭暑假旅遊，預計會拍攝兩支短影音介紹親子友善設施。" value={newTrip.purpose} onChange={(e) => setNewTrip({...newTrip, purpose: e.target.value})}></textarea>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">許願需求 (希望廠商提供什麼？)</label>
                        <textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-20 resize-none text-sm" placeholder="例如：尋求有溫泉設施的飯店住宿贊助兩晚，或周邊親子餐廳體驗。" value={newTrip.needs} onChange={(e) => setNewTrip({...newTrip, needs: e.target.value})}></textarea>
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                        <button type="submit" className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 active:scale-95 transition-all flex justify-center items-center gap-2">
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

      case 'contracts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">合約管理</h2>
              <button className="text-sky-600 font-bold text-sm hover:underline flex items-center gap-1">
                <Plus size={16}/> 建立新合約
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* ✨ 點擊預覽合約 */}
              <div onClick={() => setShowContractModal(true)} className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:scale-110 transition-transform"><FileSignature size={24}/></div>
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">暑期親子專案推廣合約 <span className="text-xs text-indigo-500 font-medium group-hover:underline">點擊預覽</span></h3>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <li className="flex items-center text-sm text-slate-400"><X className="w-4 h-4 text-slate-400 mr-2"/> 無法觀看及邀請 S/A 級網紅</li>
                    <li className="flex items-center text-sm text-slate-400"><X className="w-4 h-4 text-slate-400 mr-2"/> 無法查看網紅 LINE 聯繫方式</li>
                  </ul>
                </div>
                <div className="mt-auto">
                  <button className={`w-full py-2 font-bold rounded-xl ${providerPlan === 'free' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                    {providerPlan === 'free' ? '使用中' : '降級回免費版'}
                  </button>
                </div>
              </div>

              <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl relative overflow-hidden text-white flex flex-col">
                <div className="relative z-10 flex-grow">
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">專業版 Pro <span className="text-sm font-normal text-indigo-200">(月繳)</span></h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold">$1,200</span><span className="text-indigo-200 ml-2">/ 月</span>
                  </div>
                  <ul className="space-y-3 mb-6 text-indigo-100">
                    <li className="flex items-center text-sm"><Crown className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-2"/> 解鎖觀看及邀請 S/A 高流量網紅</li>
                    <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-2"/> 解鎖直接查看網紅 LINE ID</li>
                    <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 text-white mr-2"/> 無限發送合作邀請</li>
                    <li className="flex items-center text-sm"><BarChart3 className="w-4 h-4 text-white mr-2"/> 網紅深度數據解鎖 (受眾分析)</li>
                    <li className="flex items-center text-sm"><Shield className="w-4 h-4 text-white mr-2"/> 無限使用智能合約與數位簽署</li>
                  </ul>
                </div>
                <div className="mt-auto">
                  {providerPlan === 'pro' ? (
                    <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl cursor-not-allowed opacity-90">
                      您已升級此方案
                    </button>
                  ) : (
                    <button onClick={() => { setPurchaseItem({ id: 'pro', name: '專業版 Pro (月訂閱)', price: 1200, type: 'subscription' }); setPaymentStep('form'); }} className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg active:scale-95">
                      訂閱月方案
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-b from-slate-900 to-indigo-950 p-6 rounded-2xl shadow-xl relative overflow-hidden text-white flex flex-col border border-indigo-500/30">
                <div className="absolute top-0 right-0 bg-yellow-400 text-indigo-900 text-xs font-bold px-3 py-1 rounded-bl-lg">BEST VALUE</div>
                <div className="relative z-10 flex-grow">
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-yellow-400">尊榮年約 Pro <Crown size={20} className="fill-yellow-400"/></h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold text-white">$10,000</span><span className="text-indigo-200 ml-2">/ 年</span>
                  </div>
                  <p className="text-xs text-indigo-300 mb-4">(現省 $4,400，平均每月僅 $833)</p>
                  <ul className="space-y-3 mb-6 text-indigo-100">
                    <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 text-white mr-2"/> 包含月訂閱所有 Pro 權限</li>
                    <li className="flex items-center text-sm"><Crown className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-2"/> 解鎖觀看及邀請 S/A 高流量網紅</li>
                    <li className="flex items-center text-sm"><Zap className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-2"/> 每月免費贈送 1 次置頂推廣 ($300)</li>
                    <li className="flex items-center text-sm"><Rocket className="w-4 h-4 text-sky-400 fill-sky-400 mr-2"/> 案源優先曝光與尊榮標章</li>
                    <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 text-white mr-2"/> 專屬 1 對 1 優先客服</li>
                  </ul>
                </div>
                <div className="mt-auto">
                  <button onClick={() => { setPurchaseItem({ id: 'pro-year', name: '尊榮年約 Pro (年訂閱)', price: 10000, type: 'subscription' }); setPaymentStep('form'); }} className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-900 font-black rounded-xl hover:scale-[1.02] transition-transform shadow-lg active:scale-95">
                    立即解鎖年約
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Rocket className="text-indigo-600" size={20}/> 單次解鎖功能</h3>
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
                
                {/* ✨ 新增：單次高階邀約解鎖 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group cursor-pointer flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform"><Crown size={20} fill="currentColor"/></div>
                    <span className="font-bold text-slate-900">$150</span>
                  </div>
                  <h4 className="font-bold text-slate-900 flex-grow">單次解鎖高流量網紅</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">獲得 1 張「高階邀約券」，可單次解鎖查看並邀請 1 位 S 或 A 級創作者，免綁訂閱。</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-bold text-slate-400">擁有額度：{singleInvites} 張</span>
                    <button onClick={() => { setPurchaseItem({ id: 'boost-single-invite', name: '單次高流量解鎖券', price: 150, type: 'one-time' }); setPaymentStep('form'); }} className="text-xs font-bold text-indigo-600 hover:underline">
                      購買票券 &rarr;
                    </button>
                  </div>
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

             {/* ✨ 數據真實性警告 */}
             <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm flex items-start gap-3">
               <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
               <div>
                 <h4 className="font-bold text-amber-900 text-sm">數據真實性聲明</h4>
                 <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                   請務必確保您填寫的「粉絲數」、「平均觀看」及「合作報價」等資訊皆為真實數據。平台將進行人工與系統查核，若發現填寫不實數據以獲取高等級案源，為維護商家權益，<span className="font-bold text-red-600">平台有權永久關閉您的帳號與接案權限</span>。
                 </p>
               </div>
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
                       <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">LINE ID (廠商付費後可見)</label>
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

                   {/* ✨ 頻道連結 */}
                   <div className="pt-4 border-t border-slate-100">
                     <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><LinkIcon size={16} className="text-slate-400"/> 社群頻道連結 (將展示於履歷)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1.5"><Instagram size={14} className="inline mr-1 text-pink-600"/>Instagram 連結</label>
                         <input type="url" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none bg-slate-50" placeholder="https://instagram.com/..." value={creatorProfile.socialLinks?.ig || ''} onChange={(e) => setCreatorProfile(p => ({...p, socialLinks: {...p.socialLinks, ig: e.target.value}}))} />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1.5"><Youtube size={14} className="inline mr-1 text-red-600"/>YouTube 連結</label>
                         <input type="url" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none bg-slate-50" placeholder="https://youtube.com/..." value={creatorProfile.socialLinks?.yt || ''} onChange={(e) => setCreatorProfile(p => ({...p, socialLinks: {...p.socialLinks, yt: e.target.value}}))} />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1.5">TikTok 連結</label>
                         <input type="url" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none bg-slate-50" placeholder="https://tiktok.com/..." value={creatorProfile.socialLinks?.tiktok || ''} onChange={(e) => setCreatorProfile(p => ({...p, socialLinks: {...p.socialLinks, tiktok: e.target.value}}))} />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1.5">其他作品集網站</label>
                         <input type="url" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" placeholder="https://..." value={creatorProfile.socialLinks?.other || ''} onChange={(e) => setCreatorProfile(p => ({...p, socialLinks: {...p.socialLinks, other: e.target.value}}))} />
                       </div>
                     </div>
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
                   <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2 uppercase tracking-widest text-sm"><BarChart3 size={18} className="text-indigo-500"/> 社群數據與受眾分析</h3>
                   <div className="space-y-4">
                     {/* ✨ 新增粉絲數與觀看數的輸入欄位 */}
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5">粉絲總數 (Followers)</label>
                       <div className="flex items-center relative">
                          <Users size={16} className="absolute left-3 text-slate-400"/>
                          <input type="number" className="w-full pl-9 p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" 
                                 value={creatorProfile.followers} onChange={(e) => setCreatorProfile(p => ({...p, followers: Number(e.target.value)}))} />
                       </div>
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5">平均觀看數 (Average Views)</label>
                       <div className="flex items-center relative">
                          <Eye size={16} className="absolute left-3 text-slate-400"/>
                          <input type="number" className="w-full pl-9 p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" 
                                 value={creatorProfile.averageViews} onChange={(e) => setCreatorProfile(p => ({...p, averageViews: Number(e.target.value)}))} />
                       </div>
                     </div>
                     <div className="border-t border-slate-100 pt-4 mt-2">
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
          <div className="flex items-center gap-4">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${role === 'business' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'}`}>
                 {role === 'business' ? <Briefcase size={14}/> : <User size={14}/>}
                 {role === 'business' ? '業者後台' : '創作者中心'}
              </span>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-sm font-bold transition-colors">
                <LogOut size={18}/> 登出
              </button>
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
          
          {/* ✨ 合約預覽 Modal */}
          {showContractModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
                  <button onClick={() => setShowContractModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                     <div className="bg-green-100 text-green-600 p-2.5 rounded-xl"><FileSignature size={24}/></div>
                     <h3 className="text-xl font-bold text-slate-900">數位合約預覽</h3>
                  </div>
                  <div className="overflow-y-auto flex-grow text-sm text-slate-600 space-y-5 pr-2">
                     <div>
                       <h4 className="font-bold text-slate-900 text-lg mb-1">暑期親子專案推廣合約</h4>
                       <p className="text-xs text-slate-400">合約編號：CTR-{Date.now().toString().slice(-8)}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <div>
                         <p className="text-xs font-bold text-slate-400 mb-1">甲方 (提供者)</p>
                         <p className="font-bold text-slate-800">海角七號民宿</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 mb-1">乙方 (創作者)</p>
                         <p className="font-bold text-slate-800">林小美 (@may_travel)</p>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <h4 className="font-bold text-slate-900">合約條款與規範</h4>
                       <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-xs leading-relaxed border border-slate-100">
                         <p>1. 雙方同意於 <span className="font-bold">2024年06月01日 至 2024年06月30日</span> 期間進行互惠合作。</p>
                         <p>2. 乙方承諾產出：<span className="font-bold text-indigo-600">IG 圖文貼文 1 則、限時動態 3 則</span>。</p>
                         <p>3. 甲方承諾提供：<span className="font-bold text-indigo-600">海景雙人房免費住宿一晚（含雙人早餐）</span>。</p>
                         <p>4. 乙方需於體驗後 14 日內提供圖文草稿供甲方確認，並於確認後 3 日內發布至指定平台。</p>
                         <p>5. 若因不可抗力因素導致無法履約，雙方應盡速通知並協商延期。違約方需賠償本次體驗之等值金額。</p>
                       </div>
                     </div>
                     <div className="flex justify-between items-center bg-green-50 px-4 py-3 rounded-xl border border-green-200 text-green-700 text-xs font-bold mt-2">
                       <span>狀態：雙方已完成數位簽署</span>
                       <CheckCircle2 size={16} />
                     </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                     <button onClick={() => setShowContractModal(false)} className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors active:scale-95 shadow-lg">確認並關閉</button>
                  </div>
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
                        {viewProject.requiredTier === 'S' && <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold border border-amber-200">S級優先</span>}
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${viewProject.type === '付費推廣' ? 'bg-indigo-100 text-indigo-800' : 'bg-sky-50 text-sky-700'}`}>{viewProject.type}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /> {viewProject.location}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">{viewProject.title}</h2>
                      <div className="flex gap-2">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{viewProject.category}</span>
                        {/* ✨ 顯示平假日 */}
                        {viewProject.validDays && (
                           <span className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded border border-sky-100 flex items-center gap-1"><Calendar size={12}/> {viewProject.validDays}</span>
                        )}
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
                      <p className="text-sm text-slate-600 mb-4 leading-relaxed font-medium whitespace-pre-line">{viewProject.requirements}</p>
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

          {/* ✨ 查看申請者完整履歷 Modal */}
          {viewApplicant && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300 relative">
                
                {/* 封面圖與大頭貼 */}
                <div className="relative h-48 bg-slate-200 shrink-0">
                  <img 
                    src={viewApplicant.coverImage || "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80"} 
                    alt="Cover" 
                    className="w-full h-full object-cover" 
                  />
                  <button onClick={() => setViewApplicant(null)} className="absolute top-4 right-4 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"><X size={20} /></button>
                  <div className="absolute -bottom-10 left-6 sm:left-8">
                    <img 
                      src={viewApplicant.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                      alt="Avatar" 
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md bg-white object-cover" 
                    />
                  </div>
                </div>

                <div className="p-6 sm:p-8 pt-12 sm:pt-14 flex-grow overflow-y-auto bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 mb-1">
                        {viewApplicant.name} 
                        <TierBadge tier={viewApplicant.tier} />
                      </h2>
                      {viewApplicant.handle && <p className="text-sm font-medium text-slate-500 mb-2">{viewApplicant.handle}</p>}
                      
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><MapPin size={14}/> {viewApplicant.location || '台灣'}</span>
                      </div>

                      {/* ✨ 社群連結展示 */}
                      {viewApplicant.socialLinks && (
                        <div className="flex items-center gap-3 mt-3">
                          {viewApplicant.socialLinks.ig && <a href={viewApplicant.socialLinks.ig} target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-700 bg-pink-50 p-1.5 rounded-lg transition-colors"><Instagram size={18}/></a>}
                          {viewApplicant.socialLinks.yt && <a href={viewApplicant.socialLinks.yt} target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition-colors"><Youtube size={18}/></a>}
                          {viewApplicant.socialLinks.other && <a href={viewApplicant.socialLinks.other} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-900 bg-slate-100 p-1.5 rounded-lg transition-colors"><LinkIcon size={18}/></a>}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {viewApplicant.tags?.map ? viewApplicant.tags.map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">#{tag.trim()}</span>
                        )) : null}
                      </div>
                    </div>
                    {/* 數據概覽 */}
                    <div className="flex gap-4 mt-4 sm:mt-0 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 font-bold mb-1">粉絲數</p>
                        <p className="text-xl font-black text-slate-900">{viewApplicant.followers ? (viewApplicant.followers / 1000).toFixed(1) : '0'}k</p>
                      </div>
                      <div className="text-center border-l border-slate-100 pl-4">
                        <p className="text-xs text-slate-400 font-bold mb-1">平均觀看</p>
                        <p className="text-xl font-black text-slate-900">{viewApplicant.averageViews ? (viewApplicant.averageViews / 1000).toFixed(1) : '0'}k</p>
                      </div>
                      <div className="text-center border-l border-slate-100 pl-4">
                        <p className="text-xs text-slate-400 font-bold mb-1">信用評分</p>
                        <p className="text-xl font-black text-yellow-500 flex items-center justify-center gap-1">
                          {viewApplicant.completionScore || '5.0'} <Star size={14} fill="currentColor"/>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* 自我介紹 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><User size={18} className="text-indigo-500"/> 關於創作者</h4>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{viewApplicant.bio || "這位創作者尚未填寫簡介。"}</p>
                    </div>

                    {/* 數據與報價 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-sky-500"/> 受眾分析</h4>
                        <ul className="space-y-3 text-sm">
                          <li className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500">性別分佈</span>
                            <span className="font-bold text-slate-900">{viewApplicant.audience?.gender || 'N/A'}</span>
                          </li>
                          <li className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500">主力年齡</span>
                            <span className="font-bold text-slate-900">{viewApplicant.audience?.age || 'N/A'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-slate-500">熱門城市</span>
                            <span className="font-bold text-slate-900">{viewApplicant.audience?.topCity || 'N/A'}</span>
                          </li>
                        </ul>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><DollarSign size={18} className="text-green-600"/> 合作參考報價</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-xs font-bold text-slate-500">圖文貼文</span>
                            <span className="font-black text-slate-900">NT$ {viewApplicant.rates?.post?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-xs font-bold text-slate-500">限時動態</span>
                            <span className="font-black text-slate-900">NT$ {viewApplicant.rates?.story?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-xs font-bold text-slate-500">短影音 Reels</span>
                            <span className="font-black text-slate-900">NT$ {viewApplicant.rates?.reels?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 作品集 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ImageIcon size={18} className="text-purple-500"/> 近期作品</h4>
                      {viewApplicant.portfolio && viewApplicant.portfolio.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {viewApplicant.portfolio.map((img: string, i: number) => (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-100 relative group cursor-pointer border border-slate-200">
                              <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`Portfolio ${i}`} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">尚無作品集。</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6 border-t border-slate-200 bg-white sticky bottom-0 flex justify-end gap-3 z-20">
                   <button onClick={() => setViewApplicant(null)} className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">關閉</button>
                   {/* ✨ 履歷內的聯繫按鈕 (防跳島) */}
                   {providerPlan === 'pro' ? (
                      viewApplicant.lineId ? (
                        <a href={`https://line.me/ti/p/~${viewApplicant.lineId}`} target="_blank" rel="noreferrer" className="px-6 py-3 bg-[#06C755] text-white font-bold rounded-xl hover:bg-[#05b34c] shadow-lg active:scale-95 transition-all flex items-center gap-2">
                          <MessageCircle size={18}/> LINE 聯繫
                        </a>
                      ) : null
                   ) : (
                      <button onClick={() => { setViewApplicant(null); setShowApplicantsModal(false); setActiveTab('wallet'); }} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg active:scale-95 transition-all flex items-center gap-2">
                        <Lock size={16}/> 升級 Pro 解鎖聯繫方式
                      </button>
                   )}
                </div>
              </div>
            </div>
          )}

          {renderContent()}

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

          {/* --- Upgrade Alert Modal (動態升級 / 權限提示) --- */}
          {showUpgradeModal && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center scale-100 animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     {upgradeReason === 'limit' ? (
                        <AlertCircle size={32} className="text-red-500" />
                     ) : (
                        <Lock size={32} className="text-amber-500" />
                     )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                     {upgradeReason === 'limit' ? '免費額度已用完' : '付費會員專屬功能'}
                  </h2>
                  <p className="text-slate-500 text-sm mb-6 whitespace-pre-line leading-relaxed">
                     {upgradeReason === 'limit' 
                       ? `您本月的免費額度已達上限。\n升級至專業版即可解鎖無限邀請！`
                       : upgradeReason === 'tier'
                       ? `「查看及邀請 S/A 級高流量網紅」為專業版 (Pro) 專屬。\n升級後即可無限制邀約高影響力網紅！`
                       : `「直接查看網紅 LINE 聯繫方式」為專業版 (Pro) 專屬。\n升級後即可與創作者零距離洽談！`}
                  </p>
                  
                  <div className="space-y-3">
                     <button 
                       onClick={() => {
                           setActiveTab('wallet');
                           setShowUpgradeModal(false);
                       }}
                       className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                     >
                       <Zap size={18} fill="currentColor"/> 前往升級 Pro
                     </button>
                     
                     {/* ✨ 提示單次解鎖選項 (如果不是因為超過免費次數而擋) */}
                     {upgradeReason === 'tier' && (
                       <button 
                         onClick={() => {
                             setActiveTab('wallet');
                             setShowUpgradeModal(false);
                         }}
                         className="w-full py-3 bg-white text-amber-600 border border-amber-200 font-bold rounded-xl shadow-sm hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                       >
                         購買單次高階邀約 ($150)
                       </button>
                     )}

                     <button 
                       onClick={() => setShowUpgradeModal(false)}
                       className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 text-sm"
                     >
                       稍後再說
                     </button>
                  </div>
               </div>
            </div>
          )}

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