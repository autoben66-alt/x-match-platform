'use client';

import { useState, useEffect } from 'react';
import { Instagram, Youtube, Star, Gift, ShieldCheck, Info } from 'lucide-react';

export default function CalculatorPage() {
  const [platform, setPlatform] = useState<'instagram' | 'youtube' | 'tiktok'>('instagram');
  const [followers, setFollowers] = useState(15000);
  const [engagement, setEngagement] = useState(3.5);
  
  // 計算結果狀態
  const [tier, setTier] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [color, setColor] = useState('bg-slate-100');

  // 自動計算邏輯 (監聽數值變更)
  useEffect(() => {
    // 簡易權重計算：IG 為基準，YT 權重較高
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
  }, [followers, engagement, platform]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">互惠標準參考工具</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          避免報價爭議，建立市場共識。輸入您的社群數據，系統將建議適合爭取的「互惠規格」。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* 左側：輸入面板 */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
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
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>1k</span>
                <span>50k</span>
                <span>100k+</span>
              </div>
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
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>0.5%</span>
                <span>5%</span>
                <span>10%+</span>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 leading-relaxed border border-slate-100">
               <p className="font-bold mb-1 text-slate-700">如何計算互動率？</p>
               (貼文平均按讚數 + 留言數) ÷ 粉絲總數 × 100%。<br/>
               此數據通常比單純的粉絲數更能代表帶貨能力。
            </div>
          </div>
        </div>

        {/* 右側：結果面板 */}
        <div className={`text-white p-8 rounded-2xl shadow-xl relative overflow-hidden bg-gradient-to-br ${color} transition-colors duration-500 h-full flex flex-col justify-center`}>
          {/* 背景裝飾 */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur-md rounded-full mb-6 ring-1 ring-white/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-lg font-medium text-white/80 mb-2 uppercase tracking-widest text-xs">
              System Assessment
            </h3>
            <div className="text-2xl font-bold text-white mb-8 border-b border-white/20 pb-6">
              {tier}
            </div>

            <div className="space-y-6 text-left bg-black/20 p-6 rounded-xl backdrop-blur-sm border border-white/10">
              <div>
                <p className="text-xs text-indigo-200 font-bold uppercase mb-2 flex items-center gap-2">
                  <Gift size={14} /> 
                  建議交換內容
                </p>
                <p className="text-lg font-bold leading-relaxed shadow-sm">
                  {suggestion}
                </p>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-indigo-200 font-bold uppercase mb-2">
                  合作小撇步
                </p>
                <p className="text-sm text-white/80 leading-relaxed">
                  建議在合作信中附上過去的類似案例數據（如：單篇貼文觸及人數），能大幅增加廠商的信任度與成交率。
                </p>
              </div>
            </div>

            <button className="w-full mt-8 bg-white text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-lg">
              下載我的履歷小卡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}