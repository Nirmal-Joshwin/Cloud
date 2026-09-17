import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ExamVault - Decentralized Time-Locked Exam Paper Security",
  description: "Secure, tamper-proof exam distribution using AES-256 local encryption, IPFS decentralized storage, and Solidity time-locks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          ExamVault © {new Date().getFullYear()} — Zero-Trust Decentralized Exam Security with Solidity & AES-256
        </footer>
      </body>
    </html>
  );
}

