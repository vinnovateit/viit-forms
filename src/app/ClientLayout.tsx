"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { FormProvider } from "./context/FormContext";
import SidePanel from "./components/SidePanel";
import styles from "./components/SidePanel.module.css";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <FormProvider>
      <div className="flex h-screen w-full bg-black overflow-hidden relative">
        {/* --- LEFT PANEL (Persists & Animates) --- */}
        <div
          className={`
            flex-shrink-0 h-full bg-neutral-900 border-r border-white/10 relative z-20
            ${styles.panelContainer}
            ${isHome ? "w-full" : "w-full md:w-[40%] lg:w-[35%]"} 
          `}
        >
          <SidePanel variant={isHome ? "home" : "form"} />
        </div>

        {/* --- RIGHT PANEL (Content) --- */}
        <div
          className={`
            flex-grow h-full overflow-y-auto relative z-10 bg-black
            ${styles.contentContainer}
            ${
              isHome
                ? "opacity-0 translate-x-20 pointer-events-none w-0"
                : "opacity-100 translate-x-0 w-full"
            }
          `}
        >
          {children}
        </div>
      </div>
    </FormProvider>
  );
}
