/* eslint-disable @next/next/no-img-element */
'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Heart,
  Hotel,
  MapPin,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Video,
} from 'lucide-react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { collection, getFirestore, onSnapshot } from 'firebase/firestore';

type Role = 'business' | 'creator';

interface CreatorMatch {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  coverImage: string;
  location: string;
  tags: string[];
  followers: number;
  averageViews: number;
  engagement: number;
  completionScore: number;
  audienceTopCity: string;
}

interface OpportunityMatch {
  id: string;
  business: string;
  title: string;
  image: string;
  location: string;
  category: string;
  tags: string[];
  totalValue: string;
  spotsLeft: number;
  validDays: string;
  requirements: string;
}

const fallbackCreators: CreatorMatch[] = [
  {
    id: 'creator-hana',
    name: 'hana',
    handle: '@hana.travel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hana',
    coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    location: '高雄市',
    tags: ['旅遊', '玩樂', '美食'],
    followers: 50000,
    averageViews: 30000,
    engagement: 5.2,
    completionScore: 5,
    audienceTopCity: '高雄／台南',
  },
  {
    id: 'creator-duncan',
    name: 'DUNCAN大師',
    handle: '@may_travel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Duncan',
    coverImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
    location: '屏東縣',
    tags: ['旅遊', '住宿', '短影音'],
    followers: 15000,
    averageViews: 5000,
    engagement: 4.8,
    completionScore: 5,
    audienceTopCity: '高雄／屏東',
  },
  {
    id: 'creator-jason',
    name: 'Jason 攝影',
    handle: '@jason.shot',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jason',
    coverImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
    location: '墾丁',
    tags: ['攝影', '戶外', 'Reels'],
    followers: 120000,
    averageViews: 45000,
    engagement: 4.5,
    completionScore: 5,
    audienceTopCity: '台中／高雄',
  },
];

const fallbackOpportunities: OpportunityMatch[] = [
  {
    id: 'opportunity-liuqiu',
    business: '小琉球海景 Villa',
    title: '海島雙人住宿開箱合作',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    location: '小琉球',
    category: '住宿',
    tags: ['海景', '旅遊', '情侶'],
    totalValue: 'NT$ 8,800',
    spotsLeft: 3,
    validDays: '平日優先',
    requirements: '1 支 Reels＋3 則限時動態',
  },
  {
    id: 'opportunity-food',
    business: '島嶼風味餐桌',
    title: '雙人海鮮套餐體驗',
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80',
    location: '高雄市',
    category: '餐飲',
    tags: ['美食', '探店', '短影音'],
    totalValue: 'NT$ 3,600',
    spotsLeft: 4,
    validDays: '週日至週四',
    requirements: '1 支短影音＋店家標記',
  },
  {
    id: 'opportunity-outdoor',
    business: '南國水上體驗',
    title: '夕陽 SUP 體驗拍攝',
    image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1200&q=80',
    location: '屏東縣',
    category: '體驗',
    tags: ['戶外', '玩水', '攝影'],
    totalValue: 'NT$ 4,800',
    spotsLeft: 2,
    validDays: '依海況預約',
    requirements: '1 支 Reels＋原始素材授權',
  },
];

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

const internalAppId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'x-match-a83f0';

const compactNumber = (value: number) => {
  if (value >= 10000) return `${(value / 10000).toFixed(value % 10000 === 0 ? 0 : 1)}萬`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString('zh-TW');
};

const stringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;
  const result = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return result.length > 0 ? result : fallback;
};

const readNestedString = (value: unknown, key: string, fallback: string) => {
  if (!value || typeof value !== 'object') return fallback;
  const nested = (value as Record<string, unknown>)[key];
  return typeof nested === 'string' && nested.trim() ? nested : fallback;
};

export default function Home() {
  const [role, setRole] = useState<Role>('business');
  const [location, setLocation] = useState('小琉球');
  const [date, setDate] = useState('');
  const [businessType, setBusinessType] = useState('旅宿');
  const [goal, setGoal] = useState('Reels 短影音');
  const [creatorTheme, setCreatorTheme] = useState('旅遊');
  const [creatorNeed, setCreatorNeed] = useState('住宿體驗');
  const [hasSearched, setHasSearched] = useState(false);
  const [creators, setCreators] = useState<CreatorMatch[]>(fallbackCreators);
  const [opportunities, setOpportunities] = useState<OpportunityMatch[]>(fallbackOpportunities);

  useEffect(() => {
    if (!firebaseConfig.apiKey) return;

    let database: ReturnType<typeof getFirestore>;
    try {
      const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
      database = getFirestore(firebaseApp);
    } catch (error) {
      console.error('Firebase 初始化失敗', error);
      return;
    }

    const unsubscribeCreators = onSnapshot(
      collection(database, 'artifacts', internalAppId, 'public', 'data', 'users'),
      (snapshot) => {
        const mapped = snapshot.docs
          .map((document) => {
            const data = document.data();
            if (data.role !== '創作者') return null;
            const fallback = fallbackCreators[document.id.length % fallbackCreators.length];
            return {
              id: document.id,
              name: String(data.name || fallback.name),
              handle: String(data.handle || fallback.handle),
              avatar: String(data.avatar || fallback.avatar),
              coverImage: String(data.coverImage || fallback.coverImage),
              location: String(data.location || fallback.location),
              tags: stringArray(data.tags, fallback.tags),
              followers: Number(data.followers || fallback.followers),
              averageViews: Number(data.averageViews || fallback.averageViews),
              engagement: Number(data.engagement || fallback.engagement),
              completionScore: Number(data.completionScore || data.rating || fallback.completionScore),
              audienceTopCity: readNestedString(data.audience, 'topCity', fallback.audienceTopCity),
            } satisfies CreatorMatch;
          })
          .filter((item): item is CreatorMatch => item !== null)
          .slice(0, 6);
        if (mapped.length > 0) setCreators(mapped);
      },
      (error) => console.error('讀取創作者失敗', error),
    );

    const unsubscribeOpportunities = onSnapshot(
      collection(database, 'artifacts', internalAppId, 'public', 'data', 'projects'),
      (snapshot) => {
        const mapped = snapshot.docs.slice(0, 6).map((document) => {
          const data = document.data();
          const fallback = fallbackOpportunities[document.id.length % fallbackOpportunities.length];
          return {
            id: document.id,
            business: String(data.business || fallback.business),
            title: String(data.title || fallback.title),
            image: String(data.image || fallback.image),
            location: String(data.location || fallback.location),
            category: String(data.category || fallback.category),
            tags: stringArray(data.tags, fallback.tags),
            totalValue: String(data.totalValue || fallback.totalValue),
            spotsLeft: Number(data.spotsLeft ?? fallback.spotsLeft),
            validDays: String(data.validDays || fallback.validDays),
            requirements: String(data.requirements || fallback.requirements),
          } satisfies OpportunityMatch;
        });
        if (mapped.length > 0) setOpportunities(mapped);
      },
      (error) => console.error('讀取合作案失敗', error),
    );

    return () => {
      unsubscribeCreators();
      unsubscribeOpportunities();
    };
  }, []);

  const creatorResults = useMemo(
    () => creators.slice(0, 3).map((creator, index) => ({
      ...creator,
      matchScore: Math.max(82, 96 - index * 4),
      reasons: [
        creator.tags.includes('旅遊') ? '內容風格符合旅遊品牌' : `擅長${creator.tags[0] || '生活風格'}內容`,
        `主要受眾位於${creator.audienceTopCity}`,
        creator.engagement > 0 ? `互動率 ${creator.engagement.toFixed(1)}%` : '具穩定內容表現',
      ],
    })),
    [creators],
  );

  const opportunityResults = useMemo(
    () => opportunities.slice(0, 3).map((opportunity, index) => ({
      ...opportunity,
      matchScore: Math.max(80, 94 - index * 5),
      reasons: [
        `${opportunity.location}符合目的地偏好`,
        `合作內容：${opportunity.requirements.split('\n')[0]}`,
        `${opportunity.validDays}，剩餘 ${opportunity.spotsLeft} 個名額`,
      ],
    })),
    [opportunities],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSearched(true);
    window.setTimeout(() => document.querySelector('#match-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const switchRole = (nextRole: Role) => {
    setRole(nextRole);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(14,165,233,0.22),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(99,102,241,0.18),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-200">
              <Sparkles size={16} /> 旅宿 × 餐飲 × 創作者精準媒合
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              找到真正適合品牌的創作者，<span className="text-sky-400">不再只看粉絲數</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              輸入地區、日期與合作目標，立即看見推薦原因。從配對、邀請、條件確認到成果追蹤，一個平台完成。
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-slate-300">
              {['免費查看推薦', '合作條件標準化', '雙方信用可追蹤'].map((item) => (
                <span key={item} className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-400" /> {item}</span>
              ))}
            </div>
          </div>

          <div id="quick-match" className="scroll-mt-24 rounded-[2rem] border border-white/10 bg-white p-4 shadow-2xl shadow-sky-950/30 sm:p-6">
            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5" aria-label="選擇身分">
              <button
                type="button"
                onClick={() => switchRole('business')}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${role === 'business' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                aria-pressed={role === 'business'}
              >
                <Building2 size={18} /> 我是業者
              </button>
              <button
                type="button"
                onClick={() => switchRole('creator')}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${role === 'creator' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                aria-pressed={role === 'creator'}
              >
                <Video size={18} /> 我是創作者
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">Quick match</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {role === 'business' ? '用 4 個條件找合作人選' : '查看適合你的合作機會'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">不用先註冊，先看看平台能為你找到誰。</p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              {role === 'business' ? (
                <>
                  <Field label="品牌類型" icon={<Hotel size={16} />}>
                    <select value={businessType} onChange={(event) => setBusinessType(event.target.value)} className="field-control">
                      <option>旅宿</option><option>餐飲</option><option>體驗活動</option>
                    </select>
                  </Field>
                  <Field label="合作地區" icon={<MapPin size={16} />}>
                    <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="例如：小琉球" className="field-control" />
                  </Field>
                  <Field label="可合作日期" icon={<CalendarDays size={16} />}>
                    <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field-control" />
                  </Field>
                  <Field label="期待內容" icon={<Target size={16} />}>
                    <select value={goal} onChange={(event) => setGoal(event.target.value)} className="field-control">
                      <option>Reels 短影音</option><option>IG／FB 圖文</option><option>限時動態</option><option>部落格文章</option>
                    </select>
                  </Field>
                </>
              ) : (
                <>
                  <Field label="預計前往地區" icon={<MapPin size={16} />}>
                    <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="例如：小琉球" className="field-control" />
                  </Field>
                  <Field label="預計日期" icon={<CalendarDays size={16} />}>
                    <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field-control" />
                  </Field>
                  <Field label="內容主題" icon={<Video size={16} />}>
                    <select value={creatorTheme} onChange={(event) => setCreatorTheme(event.target.value)} className="field-control">
                      <option>旅遊</option><option>美食</option><option>親子</option><option>攝影</option><option>戶外活動</option>
                    </select>
                  </Field>
                  <Field label="希望合作" icon={<Heart size={16} />}>
                    <select value={creatorNeed} onChange={(event) => setCreatorNeed(event.target.value)} className="field-control">
                      <option>住宿體驗</option><option>餐飲體驗</option><option>活動體驗</option><option>付費合作</option>
                    </select>
                  </Field>
                </>
              )}
              <button type="submit" className="group mt-1 flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-4 font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 sm:col-span-2">
                <Search size={19} /> {role === 'business' ? '查看推薦創作者' : '查看適合我的合作案'}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: BadgeCheck, title: '資料驗證', text: '重要數據標示來源與更新時間' },
            { icon: FileCheck2, title: '條件清楚', text: '交付內容、價值與日期先說明' },
            { icon: ShieldCheck, title: '合作可追蹤', text: '邀請、確認、交付都有狀態' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-5 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sky-600 shadow-sm"><item.icon size={20} /></span>
              <div><h2 className="font-black text-slate-900">{item.title}</h2><p className="mt-0.5 text-sm text-slate-500">{item.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="match-results" className="scroll-mt-20 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-600">{hasSearched ? 'Your matches' : 'Match preview'}</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {role === 'business' ? `${location || '指定地區'}的推薦創作者` : `${location || '指定地區'}的合作機會`}
              </h2>
              <p className="mt-3 text-slate-600">
                {hasSearched
                  ? `已依${role === 'business' ? `${businessType}、${goal}` : `${creatorTheme}、${creatorNeed}`}條件排序。`
                  : '先看推薦理由，再決定是否查看完整資料或發出邀請。'}
              </p>
            </div>
            <a href={role === 'business' ? '/creators' : '/opportunities'} className="inline-flex items-center gap-1 self-start rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 hover:border-sky-300 hover:text-sky-700 md:self-auto">
              查看全部 <ArrowRight size={16} />
            </a>
          </div>

          {role === 'business' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {creatorResults.map((creator) => <CreatorMatchCard key={creator.id} creator={creator} />)}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {opportunityResults.map((opportunity) => <OpportunityMatchCard key={opportunity.id} opportunity={opportunity} />)}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-600">How it works</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">從需求到確認合作，每一步都清楚</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, step: '01', title: '建立條件', text: '設定地區、日期、客群與期待內容。' },
              { icon: Sparkles, step: '02', title: '看見推薦理由', text: '不只看粉絲數，了解受眾與內容適配度。' },
              { icon: Send, step: '03', title: '發出邀請', text: '用標準需求單邀請，減少來回溝通。' },
              { icon: FileCheck2, step: '04', title: '確認與追蹤', text: '雙方確認後再建立合約並追蹤交付。' },
            ].map((item) => (
              <div key={item.step} className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="absolute right-5 top-5 text-sm font-black text-slate-300">{item.step}</span>
                <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-600"><item.icon size={23} /></span>
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-400">Better decisions</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">配對分數要能解釋，合作才容易開始</h2>
            <p className="mt-5 max-w-xl leading-8 text-slate-300">
              X‑Match 將日期、地區、受眾、內容風格、交付項目與合作價值整理成清楚的推薦理由，讓雙方在第一次聯絡前就有共識。
            </p>
            <a href="/calculator" className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-black hover:border-sky-400 hover:text-sky-300">
              了解合作條件工具 <ChevronRight size={16} />
            </a>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div><p className="text-sm text-slate-400">配對範例</p><h3 className="mt-1 text-xl font-black">小琉球旅宿 × 旅遊創作者</h3></div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-sm font-black text-emerald-300">92% 適合</span>
            </div>
            <div className="space-y-3">
              {[
                '創作者受眾集中於高雄、台南，符合主要出發市場',
                '近期有離島與住宿 Reels 作品',
                '可合作日期與旅宿平日空房吻合',
              ].map((reason) => (
                <div key={reason} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 text-sm leading-6 text-slate-200">
                  <Check size={18} className="mt-0.5 shrink-0 text-emerald-400" /> {reason}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sky-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-200"><MessageSquareText size={25} /></span>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">先看看誰適合，再決定要不要合作</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">免費建立第一筆需求，查看推薦名單與配對理由；需要聯絡、邀請或管理合作時再登入。</p>
          <a href="#quick-match" className="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 font-black text-white shadow-lg transition hover:bg-sky-600">
            立即開始配對 <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1.5 text-xs font-black text-slate-600">{icon}{label}</span>
      {children}
    </label>
  );
}

function CreatorMatchCard({ creator }: { creator: CreatorMatch & { matchScore: number; reasons: string[] } }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-40 overflow-hidden bg-slate-200">
        <img src={creator.coverImage} alt={`${creator.name}作品封面`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
        <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-sm font-black text-emerald-700 shadow-sm">{creator.matchScore}% 適合</span>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <img src={creator.avatar} alt={creator.name} className="-mt-12 h-16 w-16 rounded-2xl border-4 border-white bg-white object-cover shadow-md" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-black text-slate-950">{creator.name}</h3>
            <p className="truncate text-sm text-slate-500">{creator.handle}</p>
          </div>
          <BadgeCheck size={20} className="shrink-0 text-sky-500" aria-label="已驗證" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center">
          <Metric label="粉絲" value={compactNumber(creator.followers)} />
          <Metric label="平均觀看" value={compactNumber(creator.averageViews)} />
          <Metric label="完案信用" value={creator.completionScore.toFixed(1)} icon={<Star size={11} className="fill-amber-400 text-amber-400" />} />
        </div>
        <div className="mt-5 space-y-2.5">
          {creator.reasons.map((reason) => <p key={reason} className="flex items-start gap-2 text-sm leading-5 text-slate-600"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />{reason}</p>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{creator.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">#{tag}</span>)}</div>
        <div className="mt-6 grid grid-cols-[auto_1fr] gap-3 border-t border-slate-100 pt-5">
          <button type="button" aria-label={`收藏 ${creator.name}`} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"><Heart size={18} /></button>
          <a href="/creators" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white hover:bg-sky-600">查看完整資料 <ArrowRight size={15} /></a>
        </div>
      </div>
    </article>
  );
}

function OpportunityMatchCard({ opportunity }: { opportunity: OpportunityMatch & { matchScore: number; reasons: string[] } }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden bg-slate-200">
        <img src={opportunity.image} alt={opportunity.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
        <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-sm font-black text-emerald-700 shadow-sm">{opportunity.matchScore}% 適合</span>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="mb-1 flex items-center gap-1 text-xs font-bold text-white/80"><Building2 size={12} /> {opportunity.business}</p>
          <h3 className="text-xl font-black">{opportunity.title}</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sky-50 p-3"><p className="text-xs font-bold text-sky-600">合作價值</p><p className="mt-1 font-black text-slate-950">{opportunity.totalValue}</p></div>
          <div className="rounded-2xl bg-amber-50 p-3"><p className="text-xs font-bold text-amber-700">剩餘名額</p><p className="mt-1 font-black text-slate-950">{opportunity.spotsLeft} 位</p></div>
        </div>
        <div className="mt-5 space-y-2.5">
          {opportunity.reasons.map((reason) => <p key={reason} className="flex items-start gap-2 text-sm leading-5 text-slate-600"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />{reason}</p>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{opportunity.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">#{tag}</span>)}</div>
        <div className="mt-6 grid grid-cols-[auto_1fr] gap-3 border-t border-slate-100 pt-5">
          <button type="button" aria-label={`收藏 ${opportunity.title}`} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"><Heart size={18} /></button>
          <a href="/opportunities" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white hover:bg-sky-600">查看合作詳情 <ArrowRight size={15} /></a>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div><p className="text-[10px] font-bold text-slate-400">{label}</p><p className="mt-1 flex items-center justify-center gap-1 text-sm font-black text-slate-900">{value}{icon}</p></div>;
}
