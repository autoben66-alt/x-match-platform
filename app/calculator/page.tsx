'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  FileText, PenTool, CheckCircle, Download, Shield, ChevronRight, Calendar, 
  User, Building2, Printer, ArrowLeft, X, Eraser, Copy, Share2, Users, Clock, CheckCircle2, MessageCircle, ExternalLink, Loader2, Eye
} from 'lucide-react';

export default function SmartContractPage() {
  // 流程狀態: 1:業者填寫 -> 2:業者預覽與簽名 -> 3:分享連結 -> 4:網紅預覽與簽名(模擬) -> 5:完成
  const [step, setStep] = useState(1); 
  const [isSigning, setIsSigning] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  
  // 雙方簽名檔狀態
  const [initiatorSignature, setInitiatorSignature] = useState<string | null>(null);
  const [recipientSignature, setRecipientSignature] = useState<string | null>(null);
  
  const [isCopied, setIsCopied] = useState(false); 
  
  // Canvas 相關 Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const [formData, setFormData] = useState({
    businessName: '海角七號民宿',
    creatorName: '林小美',
    collabType: '住宿體驗互惠',
    startDate: '',
    endDate: '',
    deliveryDays: 7, 
    deliverables: {
      post: 1,
      story: 3,
      reels: 1,
      video: 0,
      blog: 0
    },
    authorization: '僅限官方社群轉發 (Repost)',
  });

  // 設定預設日期為今天起算
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    setFormData(prev => ({
      ...prev,
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0]
    }));
  }, []);

  const handleDeliverableChange = (type: keyof typeof formData.deliverables, delta: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: {
        ...prev.deliverables,
        [type]: Math.max(0, prev.deliverables[type] + delta)
      }
    }));
  };

  const handleCopyLink = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- 簽名板功能邏輯 ---
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (showSignModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const parent = canvas.parentElement;
      if(parent && ctx) {
          canvas.width = parent.clientWidth;
          canvas.height = 300;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#000';
      }
    }
  }, [showSignModal]);

  const handleConfirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    
    // 判斷當前是誰在簽名
    if (step === 2) {
      setInitiatorSignature(dataUrl);
    } else if (step === 4) {
      setRecipientSignature(dataUrl);
    }
    
    setShowSignModal(false);
    setIsSigning(true);
    
    setTimeout(() => {
      setIsSigning(false);
      // 簽名完進入下一個狀態
      if (step === 2) setStep(3); // 業者簽完，進入產生連結畫面
      if (step === 4) setStep(5); // 網紅簽完，進入完成畫面
    }, 1500);
  };

  const handleSignClick = () => {
    setShowSignModal(true);
  };

  // 重置合約狀態 (重新發起)
  const resetContract = () => {
    setStep(1);
    setInitiatorSignature(null);
    setRecipientSignature(null);
  };

  // 共用的合約預覽組件 (Step 2, Step 4, Step 5 都會用到)
  const ContractPaper = () => (
    <div className="bg-white border border-slate-200 shadow-sm p-8 sm:p-12 mx-auto max-w-3xl w-full flex-grow overflow-y-auto rounded-lg text-slate-800 leading-relaxed text-sm sm:text-base mb-6">
      <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">互惠合作備忘錄</h1>
        <p className="text-slate-500 text-sm">Agreement of Mutual Cooperation</p>
      </div>

      <div className="space-y-6">
        <p>
          <strong>立合約書人</strong><br/>
          甲方：<span className="underline decoration-dotted font-bold mx-1">{formData.businessName || '__________'}</span> (以下簡稱甲方)<br/>
          乙方：<span className="underline decoration-dotted font-bold mx-1">{formData.creatorName || '__________'}</span> (以下簡稱乙方)
        </p>
        
        <p>
          茲因甲方委託乙方進行 <strong>{formData.collabType}</strong> 之推廣事宜，雙方同意訂定本合約，條款如下：
        </p>

        <div>
          <h3 className="font-bold mb-2">第一條、合作期間</h3>
          <p>自中華民國 <span className="font-bold mx-1">{formData.startDate || 'YYYY/MM/DD'}</span> 起至 <span className="font-bold mx-1">{formData.endDate || 'YYYY/MM/DD'}</span> 止。</p>
        </div>

        <div>
          <h3 className="font-bold mb-2">第二條、乙方應交付內容 (Deliverables)</h3>
          <p>乙方應於體驗結束後 <strong>{formData.deliveryDays}</strong> 日內，於其經營之社群平台發布以下內容：</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {formData.deliverables.post > 0 && <li>Instagram/Facebook 圖文貼文：<strong>{formData.deliverables.post}</strong> 則</li>}
            {formData.deliverables.story > 0 && <li>限時動態 (需保留 24 小時)：<strong>{formData.deliverables.story}</strong> 則</li>}
            {formData.deliverables.reels > 0 && <li>短影音 Reels (15-60秒)：<strong>{formData.deliverables.reels}</strong> 支</li>}
            {formData.deliverables.blog > 0 && <li>部落格文章 (含 SEO 關鍵字)：<strong>{formData.deliverables.blog}</strong> 篇</li>}
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-2">第三條、授權範圍</h3>
          <p>乙方同意將產出之內容授權予甲方使用，範圍如下：<br/>
          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">{formData.authorization}</span>
          </p>
        </div>
        
        <div className="pt-8 mt-8 border-t border-slate-200 grid grid-cols-2 gap-12">
          <div>
            <p className="mb-8 font-bold">甲方簽署 (業者)：</p>
            <div className="h-16 border-b border-slate-300 relative">
              {initiatorSignature && (
                <img src={initiatorSignature} alt="Signature" className="absolute bottom-0 left-0 max-h-16 object-contain" />
              )}
            </div>
          </div>
          <div>
            <p className="mb-8 font-bold">乙方簽署 (創作者)：</p>
            <div className="h-16 border-b border-slate-300 relative">
              {recipientSignature && (
                <img src={recipientSignature} alt="Signature" className="absolute bottom-0 left-0 max-h-16 object-contain" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4">
           <Shield className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">智能互惠合約</h1>
        <p className="text-slate-600 max-w-2xl mx-auto mb-2">
          數位化簽署，將合作條款化為白紙黑字。保障雙方權益，讓合作更安心、專業。
        </p>
      </div>

      {/* Progress Steps (僅在業者視角 Step 1-3 顯示) */}
      {step <= 3 && (
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>1</span>
              填寫條款
            </div>
            <div className="w-8 sm:w-12 h-0.5 bg-slate-200"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>2</span>
              預覽與簽署
            </div>
            <div className="w-8 sm:w-12 h-0.5 bg-slate-200"></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>3</span>
              發送合約
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col relative">
        
        {/* --- Step 1: Input Form (發起方填寫) --- */}
        {step === 1 && (
          <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
               <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <PenTool className="text-indigo-500" /> 設定合作參數 (甲方視角)
               </h2>
               <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full">業者後台</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">甲方 (商家名稱)</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="例如：海角七號民宿"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">乙方 (預計發送之創作者)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="例如：林小美"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.creatorName}
                      onChange={(e) => setFormData({...formData, creatorName: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">合作類型</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.collabType}
                    onChange={(e) => setFormData({...formData, collabType: e.target.value})}
                  >
                    <option>住宿體驗互惠</option>
                    <option>餐飲美食推廣</option>
                    <option>商品開箱體驗</option>
                    <option>景點/活動推廣</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">體驗開始日</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">體驗結束日</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-500" />
                    內容交付期限
                  </label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.deliveryDays}
                    onChange={(e) => setFormData({...formData, deliveryDays: Number(e.target.value)})}
                  >
                    <option value="3">體驗結束後 3 日內</option>
                    <option value="7">體驗結束後 7 日內 (標準)</option>
                    <option value="14">體驗結束後 14 日內</option>
                    <option value="30">體驗結束後 30 日內</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Deliverables & Terms */}
              <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-4">約定交付內容 (Deliverables)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: 'post', label: 'IG/FB 貼文', icon: '🖼️' },
                        { id: 'story', label: '限時動態', icon: '⏱️' },
                        { id: 'reels', label: '短影音 Reels', icon: '🎬' },
                        { id: 'blog', label: '部落格文章', icon: '📝' },
                      ].map((item) => (
                        <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <span>{item.icon}</span> {item.label}
                          </span>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleDeliverableChange(item.id as any, -1)}
                              className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-slate-100 flex items-center justify-center pb-0.5"
                            >-</button>
                            <span className="font-bold w-4 text-center">{formData.deliverables[item.id as keyof typeof formData.deliverables]}</span>
                            <button 
                              onClick={() => handleDeliverableChange(item.id as any, 1)}
                              className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-600 hover:bg-indigo-200 flex items-center justify-center pb-0.5"
                            >+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">素材授權範圍</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.authorization}
                    onChange={(e) => setFormData({...formData, authorization: e.target.value})}
                  >
                    <option>僅限官方社群轉發 (Repost)</option>
                    <option>授權官方網站使用 (Web only)</option>
                    <option>全通路授權 (含廣告投放)</option>
                    <option>買斷 (永久使用權)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    * 設定完成後，下一步將為您產生合約預覽並請您進行數位簽署。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <button 
                onClick={() => setStep(2)}
                disabled={!formData.businessName || !formData.creatorName}
                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                下一步：預覽與簽署 <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* --- Step 2: Contract Preview & Initiator Sign --- */}
        {step === 2 && (
          <div className="p-0 sm:p-8 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 relative bg-slate-50">
             <div className="flex justify-between items-center mb-6 px-4 sm:px-0 mt-4 sm:mt-0">
               <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
                 <ArrowLeft size={16} /> 返回修改條款
               </button>
               <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <FileText className="text-indigo-500" /> 合約預覽與簽署
               </h2>
               <div className="w-20"></div> {/* Spacer for centering */}
             </div>

             {/* 共用合約紙本 UI */}
             <ContractPaper />

             <div className="flex justify-center w-full mt-auto pb-4">
               <button 
                 onClick={handleSignClick}
                 disabled={isSigning}
                 className="w-full max-w-md py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
               >
                 {isSigning ? <><Loader2 className="animate-spin" size={20}/> 處理中...</> : <><PenTool size={20} /> 甲方 (業者) 確認並簽署</>}
               </button>
             </div>
          </div>
        )}

        {/* --- Step 3: Link Generated (Share) --- */}
        {step === 3 && (
          <div className="p-8 h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
               <CheckCircle2 className="w-10 h-10 text-green-600" />
             </div>
             <h2 className="text-3xl font-bold text-slate-900 mb-2">合約已建立！</h2>
             <p className="text-slate-600 max-w-md mb-8 leading-relaxed">
               您已完成甲方簽署。系統已為您生成專屬的安全簽署連結。<br/>
               請將此連結傳送給 <span className="font-bold text-slate-900">{formData.creatorName}</span> 進行乙方簽署，合約將在對方簽名後正式生效。
             </p>
             
             <div className="w-full max-w-md bg-slate-50 p-4 rounded-xl flex items-center justify-between mb-8 border border-slate-200">
               <div className="flex items-center gap-2 text-slate-500 truncate mr-4">
                  <ExternalLink size={16} className="shrink-0"/>
                  <code className="text-sm truncate">https://x-match.com/sign/ctr-8a72b...</code>
               </div>
               <button 
                 onClick={handleCopyLink}
                 className="text-indigo-600 font-bold text-sm hover:text-indigo-700 flex items-center gap-1 shrink-0 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
               >
                 {isCopied ? <CheckCircle size={16}/> : <Copy size={16} />}
                 {isCopied ? '已複製' : '複製'}
               </button>
             </div>

             <div className="flex flex-col gap-3 w-full max-w-md">
                <button className="w-full py-3.5 bg-[#06C755] text-white font-bold rounded-xl hover:bg-[#05b34c] shadow-lg shadow-green-200/50 flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <MessageCircle size={20} /> 透過 LINE 傳送給網紅
                </button>
                <div className="my-2 border-b border-slate-200 relative">
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-slate-400 font-bold">測試功能</span>
                </div>
                <button 
                  onClick={() => setStep(4)} 
                  className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Eye size={18}/> 模擬網紅點擊連結 (切換視角)
                </button>
             </div>
          </div>
        )}

        {/* --- Step 4: Creator View (網紅預覽與簽署) --- */}
        {step === 4 && (
          <div className="p-0 sm:p-8 h-full flex flex-col animate-in fade-in zoom-in-95 duration-500 relative bg-slate-50">
             
             {/* 模擬網紅視角的 Banner */}
             <div className="bg-indigo-600 text-white p-4 sm:p-6 mb-6 rounded-b-2xl sm:rounded-2xl shadow-md flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-full shrink-0"><Shield size={24} className="text-white"/></div>
                <div>
                   <h3 className="font-bold text-lg mb-1">您收到一份合作合約待簽署</h3>
                   <p className="text-indigo-100 text-sm leading-relaxed">
                     <span className="font-bold text-white">{formData.businessName}</span> 已經透過 X-Match 向您發送了互惠合作備忘錄。請確認下方條款，若無異議請點擊最下方按鈕進行數位簽署。
                   </p>
                </div>
             </div>

             {/* 共用合約紙本 UI */}
             <ContractPaper />

             <div className="flex justify-center w-full mt-auto pb-4">
               <button 
                 onClick={handleSignClick}
                 disabled={isSigning}
                 className="w-full max-w-md py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
               >
                 {isSigning ? <><Loader2 className="animate-spin" size={20}/> 處理中...</> : <><PenTool size={20} /> 乙方 (創作者) 同意並簽署</>}
               </button>
             </div>
          </div>
        )}

        {/* --- Step 5: Final Success --- */}
        {step === 5 && (
          <div className="p-0 sm:p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 relative bg-slate-50">
             
             <div className="bg-green-500 text-white p-6 sm:p-8 mb-6 rounded-b-2xl sm:rounded-2xl shadow-lg text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                   <CheckCircle2 size={32} className="text-white"/>
                </div>
                <h3 className="font-black text-2xl mb-2 tracking-wide">合約正式生效！</h3>
                <p className="text-green-50 text-sm font-medium">雙方皆已完成數位簽署，系統已將具備法律效力的副本發送至雙方信箱。</p>
             </div>

             {/* 共用合約紙本 UI (展示雙方簽名) */}
             <ContractPaper />

             <div className="flex flex-col sm:flex-row justify-center w-full mt-auto pb-4 gap-4">
               <button onClick={resetContract} className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">返回首頁</button>
               <button className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                 <Download size={18} /> 下載合約 PDF
               </button>
             </div>
          </div>
        )}

        {/* --- Signature Modal --- */}
        {showSignModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900">
                  {step === 2 ? '甲方 (業者) 簽名' : '乙方 (創作者) 簽名'}
                </h3>
                <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-grow bg-white relative cursor-crosshair touch-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[300px] block bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-10"
                />
                <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
                  <p className="text-slate-300 text-sm font-bold tracking-widest">請在此處手寫簽名</p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button 
                  onClick={clearCanvas}
                  className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-white flex items-center justify-center gap-2"
                >
                  <Eraser size={18} /> 清除重寫
                </button>
                <button 
                  onClick={handleConfirmSignature}
                  className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> 確認簽名
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}