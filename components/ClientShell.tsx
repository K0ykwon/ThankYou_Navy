"use client";

import React from "react";
import Navigation from "@/components/Navigation";
import { useCreative } from "@/context/CreativeContext";

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentProject } = useCreative();

  return (
    <div className="flex min-h-screen">
      {currentProject && <Navigation />}
      <main className={currentProject ? "ml-64 flex-1" : "flex-1"}>
        {children}
      </main>
    </div>
  );
}
