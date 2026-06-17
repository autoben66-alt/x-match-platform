import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer'; // 引入 Footer
import './globals.css';

// 👇 新增這段 metadata 設定，控制 LINE/FB 分享時顯示的圖文
export const metadata = {
  title: 'X-Match | 網紅與旅宿的互惠媒合平台',
  description: '將閒置空房化為高轉換流量。X-Match 連結在地旅宿與優質創作者，開啟您的互惠旅程，零成本變現閒置資產。',
  openGraph: {
    title: 'X-Match | 網紅與旅宿的互惠媒合平台',
    description: '將閒置空房化為高轉換流量。X-Match 連結在地旅宿與優質創作者，開啟您的互惠旅程，零成本變現閒置資產。',
    url: 'https://www.x-match.tw', // 您的正式網域
    siteName: 'X-Match',
    images: [
      {
        url: '/og-image.jpg', // 對應您放在 public 資料夾內的圖片
        width: 1200,
        height: 630,
        alt: 'X-Match 互惠媒合平台',
      },
    ],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'X-Match | 網紅與旅宿的互惠媒合平台',
    description: '將閒置空房化為高轉換流量。X-Match 連結在地旅宿與優質創作者，開啟您的互惠旅程。',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer /> {/* 加在這裡 */}
      </body>
    </html>
  );
}