import { Inter } from "next/font/google";
import "./globals.css";
import UserSync from "@/components/UserSync";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Galeri Mahasiswa TI",
  description: "Tempat berbagi karya mahasiswa Teknik Informatika",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <UserSync /> {/* Tambahkan ini */}
        {children}
      </body>
    </html>
  );
}