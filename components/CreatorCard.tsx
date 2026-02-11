import { CheckCircle, TrendingUp, MapPin } from 'lucide-react';

// 定義資料型別 (TypeScript Interface)
export interface Creator {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  tags: string[];
  followers: number;
  engagement: number;
  location: string;
  bio: string;
  images?: string[]; // 設為可選
}

interface CreatorCardProps {
  creator: Creator;
}

export default function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer h-full flex flex-col">
      {/* 卡片頂部背景與頭像 */}
      <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-500 shrink-0">
        <div className="absolute -bottom-10 left-6">
          <img 
            src={creator.avatar} 
            alt={creator.name} 
            className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-sm object-cover"
          />
        </div>
      </div>

      {/* 卡片內容 */}
      <div className="pt-12 pb-6 px-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1">
              {creator.name} 
              <span className="text-blue-500">
                <CheckCircle size={14} fill="currentColor" className="text-white" />
              </span>
            </h3>
            <p className="text-sm text-slate-500">{creator.handle}</p>
          </div>
          <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
            <TrendingUp size={12} />
            {creator.engagement}% 互動率
          </div>
        </div>
        
        <p className="text-slate-600 text-sm line-clamp-2 mb-4 flex-1">{creator.bio}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {creator.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        {/* 底部數據列 */}
        <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100 text-center mt-auto">
          <div>
            <p className="text-xs text-slate-400">粉絲數</p>
            <p className="font-bold text-slate-800">
              {(creator.followers/1000).toFixed(1)}k
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">觸及</p>
            <p className="font-bold text-slate-800">High</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">所在地</p>
            <p className="font-bold text-slate-800 flex justify-center items-center gap-1">
               <MapPin size={10} /> {creator.location}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}