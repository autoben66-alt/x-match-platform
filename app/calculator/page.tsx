'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, PenTool, CheckCircle, Download, Shield, ChevronRight, Calendar, User, Building2, Printer, ArrowLeft, X, Eraser, Copy, Share2, Users, Clock } from 'lucide-react';

export default function SmartContractPage() {
  const [step, setStep] = useState(1); // 1: Input, 2: Preview, 3: Success
  const [role, setRole] = useState<'initiator' | 'recipient'>('initiator'); // 角色狀態
  const [isSigning, setIsSigning] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureImg, setSignatureImg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false); // 連結複製狀態
  
  // Canvas 相關 Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const [formData, setFormData] = useState({
    businessName: '',
    creatorName: '',
    collabType: '住宿體驗互惠',
    startDate: '',
    endDate: '',
    deliveryDays: 7, // 新增：交付天數
    deliverables: {
      post: 1,
      story: 3,
      reels: 0,
      video: 0,
      blog: 0
    },
    authorization: '僅限官方社群轉發 (Repost)',
  });

  // 當切換為接收者時，自動帶入模擬資料
  useEffect(() => {
    if (role === 'recipient') {
      setFormData({
        businessName: '海角七號民宿',
        creatorName: '林小美',
        collabType: '住宿體驗互惠',
        startDate: '2024-06-10',
        endDate: '2024-06-12',
        deliveryDays: 14,
        deliverables: { post: 1, story: 3, reels: 1, video: 0, blog: 0 },
        authorization: '僅限官方社群轉發 (Repost)',
      });
    } else {
      // 切回發起人時清空
      setFormData(prev => ({ ...prev, businessName: '', creatorName: '' }));
    }
    setStep(1); // 切換角色時回到第一步
    setSignatureImg(null);
  }, [role]);

  const handleDeliverableChange = (type: keyof typeof formData.deliverables, delta: number) => {
    if (role === 'recipient') return; // 接收者不可修改
    setFormData(prev => ({
      ...prev,
      deliverables: {
        ...prev.deliverables,
        [type]: Math.max(0, prev.deliverables[type] + delta)
      }
    }));
  };

  // 模擬複製連結
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
    setSignatureImg(dataUrl);
    setShowSignModal(false);
    
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      setStep(3);
    }, 1500);
  };

  const handleSignClick = () => {
    setShowSignModal(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header & Role Switcher */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4">
           <Shield className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">智能互惠合約產生器</h1>
        <p className="text-slate-600 max-w-2xl mx-auto mb-8">
          口說無憑，一鍵簽約。保障雙方權益，讓合作更安心、專業。
        </p>

        {/* 角色切換開關 (模擬演示用) */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button 
            onClick={() => setRole('initiator')}
            className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              role === 'initiator' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 size={16} /> 我是發起人 (甲方)
          </button>
          <button 
            onClick={() => setRole('recipient')}
            className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              role === 'recipient' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={16} /> 我是接收者 (乙方)
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>1</span>
            {role === 'initiator' ? '填寫條件' : '審閱條件'}
          </div>
          <div className="w-12 h-0.5 bg-slate-200"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>2</span>
            確認內容
          </div>
          <div className="w-12 h-0.5 bg-slate-200"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>3</span>
            {role === 'initiator' ? '發送簽署' : '簽署完成'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col relative">
        
        {/* --- Step 1: Input Form --- */}
        {step === 1 && (
          <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PenTool className="text-indigo-500" /> 
              {role === 'initiator' ? '設定合作參數' : '審閱合作內容'}
            </h2>
            
            {role === 'recipient' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-start gap-3">
                <Shield className="shrink-0 mt-0.5" size={18}/>
                <p>您正在以「接收者」身份瀏覽。欄位已鎖定，請確認內容無誤後進行下一步。</p>
              </div>
            )}
            
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
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      disabled={role === 'recipient'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">乙方 (創作者名稱)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="例如：林小美"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      value={formData.creatorName}
                      onChange={(e) => setFormData({...formData, creatorName: e.target.value})}
                      disabled={role === 'recipient'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">合作類型</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.collabType}
                    onChange={(e) => setFormData({...formData, collabType: e.target.value})}
                    disabled={role === 'recipient'}
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
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      disabled={role === 'recipient'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">體驗結束日</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      disabled={role === 'recipient'}
                    />
                  </div>
                </div>

                {/* 新增：交付期限選擇 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-500" />
                    內容交付期限
                  </label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.deliveryDays}
                    onChange={(e) => setFormData({...formData, deliveryDays: Number(e.target.value)})}
                    disabled={role === 'recipient'}
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
                    <label className="block text-sm font-bold text-slate-700 mb-4">應交付互惠內容 (Deliverables)</label>
                    <div className="grid grid-cols-2 gap-4">
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
                              disabled={role === 'recipient'}
                              className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-slate-100 flex items-center justify-center pb-0.5 disabled:opacity-50"
                            >-</button>
                            <span className="font-bold w-4 text-center">{formData.deliverables[item.id as keyof typeof formData.deliverables]}</span>
                            <button 
                              onClick={() => handleDeliverableChange(item.id as any, 1)}
                              disabled={role === 'recipient'}
                              className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-600 hover:bg-indigo-200 flex items-center justify-center pb-0.5 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400"
                            >+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">素材授權範圍</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.authorization}
                    onChange={(e) => setFormData({...formData, authorization: e.target.value})}
                    disabled={role === 'recipient'}
                  >
                    <option>僅限官方社群轉發 (Repost)</option>
                    <option>授權官方網站使用 (Web only)</option>
                    <option>全通路授權 (含廣告投放)</option>
                    <option>買斷 (永久使用權)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">
                    * 不同的授權範圍可能會影響互惠價值，請與創作者確認。
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
                {role === 'initiator' ? '生成合約預覽' : '確認無誤，下一步'} <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* --- Step 2: Contract Preview --- */}
        {step === 2 && (
          <div className="p-0 sm:p-8 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 relative">
             <div className="flex justify-between items-center mb-6 px-4 sm:px-0 mt-4 sm:mt-0">
               <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
                 <ArrowLeft size={16} /> 返回{role === 'initiator' ? '修改' : '上一步'}
               </button>
               <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <FileText className="text-indigo-500" /> 合約預覽模式
               </h2>
               <button className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium">
                 <Printer size={16} /> 列印
               </button>
             </div>

             {/* Contract Paper UI */}
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
                    <p>自中華民國 <span className="underline mx-1">{formData.startDate || 'YYYY/MM/DD'}</span> 起至 <span className="underline mx-1">{formData.endDate || 'YYYY/MM/DD'}</span> 止。</p>
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
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{formData.authorization}</span>
                    </p>
                  </div>

                  {/* 移除了第四條 履約保證金 */}
                  
                  <div className="pt-8 mt-8 border-t border-slate-200 grid grid-cols-2 gap-12">
                     <div>
                       <p className="mb-8">甲方簽署：</p>
                       <div className="h-16 border-b border-slate-300 relative">
                         {role === 'recipient' && (
                           // 模擬甲方已經簽好的狀態
                           <div className="absolute bottom-2 left-0 text-slate-400 font-script text-2xl rotate-[-5deg] opacity-70">
                             {formData.businessName} (已簽署)
                           </div>
                         )}
                         {role === 'initiator' && signatureImg && (
                           <img src={signatureImg} alt="Signature" className="absolute bottom-0 left-0 max-h-16 object-contain" />
                         )}
                       </div>
                     </div>
                     <div>
                       <p className="mb-8">乙方簽署：</p>
                       <div className="h-16 border-b border-slate-300 relative">
                         {role === 'recipient' && signatureImg && (
                           <img src={signatureImg} alt="Signature" className="absolute bottom-0 left-0 max-h-16 object-contain" />
                         )}
                       </div>
                     </div>
                  </div>
                </div>
             </div>

             <div className="flex justify-center w-full mt-auto pb-8">
               <button 
                 onClick={handleSignClick}
                 disabled={isSigning}
                 className="w-full max-w-md py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
               >
                 {isSigning ? (
                   <>處理中...</>
                 ) : (
                   <>
                     <PenTool size={20} /> 同意並進行數位簽署
                   </>
                 )}
               </button>
             </div>
          </div>
        )}

        {/* --- Signature Modal (New) --- */}
        {showSignModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900">請在下方區域簽名</h3>
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
                  className="w-full h-[300px] block"
                />
                <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
                  <p className="text-slate-300 text-sm">在此處手寫簽名</p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button 
                  onClick={clearCanvas}
                  className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-white flex items-center justify-center gap-2"
                >
                  <Eraser size={18} /> 清除
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

        {/* --- Step 3: Success --- */}
        {step === 3 && (
          <div className="p-8 h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
             
             {/* 根據角色顯示不同的完成訊息 */}
             {role === 'initiator' ? (
                <>
                  <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center mb-6">
                    <Share2 className="w-12 h-12 text-sky-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">合約連結已生成！</h2>
                  <p className="text-slate-600 max-w-md mb-8">
                    您已完成發起。請複製下方連結並傳送給 <strong>{formData.creatorName}</strong> 進行簽署，合約將在對方簽名後正式生效。
                  </p>
                  
                  <div className="w-full max-w-md bg-slate-100 p-4 rounded-xl flex items-center justify-between mb-8 border border-slate-200">
                    <code className="text-sm text-slate-600 truncate mr-4">https://x-match.com/c/8a72b...</code>
                    <button 
                      onClick={handleCopyLink}
                      className="text-sky-600 font-bold text-sm hover:text-sky-700 flex items-center gap-1"
                    >
                      {isCopied ? <CheckCircle size={16}/> : <Copy size={16} />}
                      {isCopied ? '已複製' : '複製'}
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setStep(1);
                      setFormData({...formData, businessName: '', creatorName: ''});
                      setSignatureImg(null);
                    }}
                    className="w-full max-w-md py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
                  >
                    <FileText size={20} /> 建立下一份合約
                  </button>
                </>
             ) : (
                <>
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">合約已簽署完成！</h2>
                  <p className="text-slate-600 max-w-md mb-8">
                    系統已將具備法律效力的合約副本發送至雙方 Email。
                    <br/>您也可以隨時在「會員中心 &gt; 我的合約」中查看。
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                      <Download size={20} /> 下載合約 PDF
                    </button>
                  </div>
                </>
             )}
          </div>
        )}
      </div>
    </div>
  );
}