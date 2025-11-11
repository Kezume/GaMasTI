import { Inter } from "next/font/google";
import "./globals.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "react-toastify/dist/ReactToastify.css";
import UserSyncSafe from "@/components/UserSyncSafe"; // Ganti dengan yang aman
import { ToastContainer } from "react-toastify";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Galeri Mahasiswa TI",
  description: "Tempat berbagi karya mahasiswa Teknik Informatika",
  icons: {
    icon: "/LogoHMPTI.png", // Simple version
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <UserSyncSafe /> {/* Pakai yang aman */}
        {children}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      </body>
    </html>
  );
}
