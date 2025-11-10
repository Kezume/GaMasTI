import { Inter } from "next/font/google";
import "./globals.css";
import UserSyncSafe from "@/components/UserSyncSafe"; // Ganti dengan yang aman

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Galeri Mahasiswa TI",
  description: "Tempat berbagi karya mahasiswa Teknik Informatika",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <UserSyncSafe /> {/* Pakai yang aman */}
        {children}
      </body>
    </html>
  );
}