// app/layout.tsx 範例
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer'; // 引入 Footer
import './globals.css';

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