import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { CreativeProvider } from "@/context/CreativeContext";

export const metadata: Metadata = {
  title: "창작 스튜디오 - 창작 보조 도구",
  description: "텍스트 에디터, 캐릭터 관리, 스토리보드를 한곳에서 관리하는 창작 보조 도구",
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
          <div className="flex min-h-screen">
            <Navigation />
            <main className="ml-64 flex-1">
              {children}
            </main>
          </div>
        </CreativeProvider>
      </body>
    </html>
  );
}
