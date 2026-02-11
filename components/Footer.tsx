import { MapPin } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
               <div className="bg-indigo-600 p-1.5 rounded mr-2">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">X-Match</span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              X-Match 是連結台灣在地旅宿與優質創作者的媒合平台。<br/>
              我們致力於讓每一次的體驗與分享，都轉化為真實的品牌價值。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">平台功能</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/creators" className="hover:text-indigo-600">搜尋創作者</Link></li>
              <li><Link href="/opportunities" className="hover:text-indigo-600">廠商案源</Link></li>
              <li><Link href="/trips" className="hover:text-indigo-600">行程許願池</Link></li>
              <li><Link href="/calculator" className="hover:text-indigo-600">互惠計算機</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">關於我們</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-indigo-600">關於 X-Islands</a></li>
              <li><a href="#" className="hover:text-indigo-600">聯絡我們</a></li>
              <li><a href="#" className="hover:text-indigo-600">隱私權政策</a></li>
              <li><a href="#" className="hover:text-indigo-600">服務條款</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 mt-12 pt-8 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} X-Match. All rights reserved. Part of the X-Islands Network.
        </div>
      </div>
    </footer>
  );
}