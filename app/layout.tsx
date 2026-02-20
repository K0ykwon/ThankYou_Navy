import type { Metadata } from "next";
import "./globals.css";
import { CreativeProvider } from "@/context/CreativeContext";
import ClientShell from '@/components/ClientShell';

export const metadata: Metadata = {
  title: "Scripto - ScriptoImagination turns words into worlds.",
  description: "소설 작가와 창작자를 위한 통합 ScriptoImagination turns words into worlds.. 스토리보드, 캐릭터 관리, 타임라인 등 모든 기능을 한곳에서",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50">
        <CreativeProvider>
          <ClientShell>
            {children}
          </ClientShell>
        </CreativeProvider>
      </body>
    </html>
  );
}
