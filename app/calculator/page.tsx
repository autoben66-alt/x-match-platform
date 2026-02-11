'use client';

import { useState, useEffect } from 'react';
import { Instagram, Youtube, Star, Gift, ShieldCheck, Info, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

export default function CalculatorPage() {
  const [platform, setPlatform] = useState<'instagram' | 'youtube' | 'tiktok'>('instagram');
  const [followers, setFollowers] = useState(15000);
  const [engagement, setEngagement] = useState(3.5);
  const [cost, setCost] = useState(2500); // 新增：互惠成本
  
  // 計算結果狀態
  const [tier, setTier] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [color, setColor] = useState('bg-slate-100');
  
  // ROI 分析狀態
  const [estReach, setEstReach] = useState(0);
  const [cpm, setCpm] = useState(0);
  const [verdict, setVerdict] = useState({ text: '', color: '' });

  // 自動計算邏輯 (監聽數值變更)
  useEffect(() => {
    // 1. 簡易權重計算 (Tier 判斷)
    let score = followers * (engagement / 100);
    if (platform === 'youtube') score *= 2.5;

    // 根據分數判定等級與建議
    if (score < 500) {
      setTier('Level 1: 潛力體驗員 (Rising Star)');
      setSuggestion('適合互惠：餐飲體驗 / 門票 / 單項商品 (價值約 $500-$1,500)');
      setColor('from-slate-500 to-slate-700');
    } else if (score < 1500) {
      setTier('Level 2: 區域推廣大使 (Micro Influencer)');
      setSuggestion('適合互惠：雙人下午茶 / 豪華晚餐 / 體驗課程 (價值約 $1,500-$3,000)');
      setColor('from-green-500 to-teal-600');
    } else if (score < 5000) {
      setTier('Level 3: 專業體驗官 (Pro Creator)');
      setSuggestion('適合互惠：平日雙人房住宿一晚 (含早餐) / 全套式體驗 (價值約 $3,000-$6,000)');
      setColor('from-blue-500 to-indigo-600');
    } else {
      setTier('Level 4: 年度影響力夥伴 (Top Tier)');
      setSuggestion('適合互惠：假日住宿 / 一泊二食 / 住宿 + 稿酬 (價值 $6,000 以上)');
      setColor('from-purple-500 to-pink-600');
    }

    // 2. ROI / CPM 計算邏輯 (新增)
    // 假設自然觸及率：IG 約 60% 粉絲, YT 約 40%, TikTok 約 80% (粗估模型)
    let reachRatio = 0.6;
    if (platform === 'youtube') reachRatio = 0.4;
    if (platform === 'tiktok') reachRatio = 0.8;

    // 加上互動率加成 (互動越高，演算法推播越多)
    const engagementBonus = 1 + (engagement / 100);
    
    const calculatedReach = Math.round(followers * reachRatio * engagementBonus);
    setEstReach(calculatedReach);

    // CPM = (成本 / 觸及人數) * 1000
    const calculatedCpm = Math.round((cost / calculatedReach) * 1000);
    setCpm(calculatedCpm);

    // 評語判定 (一般 FB 廣告 CPM 約 $300-$500)
    if (calculatedCpm < 300) {
      setVerdict({ text: '超划算！低於一般廣告行情', color: 'text-green-400' });
    } else if (calculatedCpm <= 500) {
      setVerdict({ text: '合理行情，與投放廣告相當', color: 'text-yellow-400' });
    } else {
      setVerdict({ text: '成本稍高，建議爭取更多授權(如圖片使用權)', color: 'text-orange-400' });
    }

  }, [followers, engagement, platform, cost]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">互惠標準參考工具</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          避免報價爭議，建立市場共識。輸入您的社群數據與成本，系統將協助評估「互惠規格」與「ROI」。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* 左側：輸入面板 */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="space-y-8">
            {/* 平台選擇 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">經營平台</label>
              <div className="flex gap-2">
                {[
                  { id: 'instagram', icon: Instagram, label: 'Instagram' },
                  { id: 'youtube', icon: Youtube, label: 'YouTube' },
                  { id: 'tiktok', icon: Star, label: 'TikTok' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id as any)}
                    className={`flex-1 py-3 px-2 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      platform === p.id 
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold ring-2 ring-indigo-200 ring-offset-1' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p.icon size={18} />
                    <span className="text-sm">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 粉絲數滑桿 */}
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-4">
                <span>粉絲追蹤數 (Followers)</span>
                <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                  {followers.toLocaleString()}
                </span>
              </label>
              <input 
                type="range" 
                min="1000" 
                max="100000" 
                step="1000" 
                value={followers} 
                onChange={(e) => setFollowers(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* 互動率滑桿 */}
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-4">
                <span className="flex items-center gap-1">
                  平均互動率 (Engagement)
                  <Info size={14} className="text-slate-400" />
                </span>
                <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                  {engagement}%
                </span>
              </label>
              <input 
                type="range" 
                min="0.5" 
                max="10" 
                step="0.1" 
                value={engagement} 
                onChange={(e) => setEngagement(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* 新增：互惠成本輸入 */}
            <div className="pt-6 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <DollarSign size={16} className="text-green-600" />
                您的互惠成本估算 (NT$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input 
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                * 請輸入房間定價、餐飲售價或體驗門票價值
              </p>
            </div>
          </div>
        </div>

        {/* 右側：結果面板 */}
        <div className={`text-white p-8 rounded-2xl shadow-xl relative overflow-hidden bg-gradient-to-br ${color} transition-colors duration-500 flex flex-col`}>
          {/* 背景裝飾 */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            {/* 上半部：等級與建議 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-2 bg-white/20 backdrop-blur-md rounded-full mb-4 ring-1 ring-white/30">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest mb-2">
                System Assessment
              </h3>
              <div className="text-xl font-bold text-white mb-4">
                {tier}
              </div>
              <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-left">
                <p className="text-xs text-indigo-200 font-bold uppercase mb-1 flex items-center gap-1">
                  <Gift size={12} /> 建議規格
                </p>
                <p className="text-sm font-medium leading-relaxed shadow-sm">
                  {suggestion}
                </p>
              </div>
            </div>

            {/* 下半部：ROI 分析 (新功能) */}
            <div className="mt-auto bg-white/95 text-slate-900 rounded-xl p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                <BarChart3 size={18} className="text-indigo-600" />
                <h4 className="font-bold text-sm">行銷價值反推 (ROI Estimator)</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">預估觸及人數</p>
                  <p className="text-lg font-bold text-slate-900">{estReach.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">預估 CPM (每千次成本)</p>
                  <p className="text-lg font-bold text-indigo-600">${cpm}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                <TrendingUp size={16} className={`mt-0.5 shrink-0 ${
                  cpm < 300 ? 'text-green-500' : cpm <= 500 ? 'text-yellow-500' : 'text-orange-500'
                }`} />
                <div>
                   <p className={`text-sm font-bold ${verdict.color}`}>
                     {verdict.text}
                   </p>
                   <p className="text-xs text-slate-400 mt-0.5">
                     (一般 FB/IG 廣告 CPM 行情約 $300-$500)
                   </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}