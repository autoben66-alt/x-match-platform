import { MapPin, Eye, Star } from 'lucide-react';

export interface Creator {
  id: number | string;
  name: string;
  handle: string;
  avatar: string;
  tags: string[];
  followers: number;
  averageViews?: number;
  completionScore?: number;
  location: string;
  bio: string;
  coverImage?: string;
}

export default function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full flex flex-col">
      {/* ✨ 修正：將高度從 h-24 改為 h-40，讓圖片展示更完整 */}
      <div className="h-40 bg-slate-100 relative overflow-hidden">
        {creator.coverImage && (
          <img 
            src={creator.coverImage} 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
            alt="cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
      </div>
      
      <div className="px-6 pb-6 pt-0 flex-1 flex flex-col">
        <div className="relative -mt-10 mb-3 flex justify-between items-end">
          <img src={creator.avatar} alt={creator.name} className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-white object-cover" />
          <div className="flex flex-col items-end">
             <span className="text-xs text-slate-400 font-bold mb-0.5">粉絲數</span>
             <span className="font-black text-slate-900 text-lg">{(creator.followers / 1000).toFixed(1)}k</span>
          </div>
        </div>
        
        <h3 className="font-bold text-lg text-slate-900 mb-0.5 flex items-center gap-1">{creator.name}</h3>
        <p className="text-sm text-slate-400 mb-3 font-medium">{creator.handle}</p>
        
        <div className="flex items-center gap-4 mb-4 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
           <div className="flex items-center gap-1.5">
             <Eye size={14} className="text-sky-500"/>
             <span>{creator.averageViews ? (creator.averageViews/1000).toFixed(1)+'k' : 'N/A'} 觀看</span>
           </div>
           <div className="w-px h-3 bg-slate-300"></div>
           <div className="flex items-center gap-1.5">
             <Star size={14} className="text-yellow-400 fill-yellow-400"/>
             <span>{creator.completionScore || '5.0'} 信用</span>
           </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {creator.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">#{tag}</span>
          ))}
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1"><MapPin size={12}/> {creator.location}</span>
          <span className="text-indigo-600 font-bold group-hover:underline">查看履歷 &rarr;</span>
        </div>
      </div>
    </div>
  );
}