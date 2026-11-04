import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eminent Phone Clinic - Repair Management",
  description: "Manage repairs, customers, and sales - Eminent Phone Clinic",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#EFF6FF] font-sans">{children}</body>
    </html>
  );
}