"use client";
import React from "react";
import { User, Layers, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useFormContext } from "../context/FormContext";
import styles from "./SidePanel.module.css";

interface SidePanelProps {
  variant: "home" | "form";
}

// Fixed: Interface for section content
interface SectionData {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export default function SidePanel({ variant }: SidePanelProps) {
  const { activeSection } = useFormContext();
  const isHome = variant === "home";

  // Fixed: Replaced 'any' with Record<string, SectionData>
  const sectionContent: Record<string, SectionData> = {
    personal: {
      title: "Personal Details",
      desc: "Let's start with the basics. We need your updated contact information.",
      icon: <User className="w-8 h-8 md:w-10 md:h-10 text-white" />,
    },
    domain: {
      title: "Domain & Work",
      desc: "Tell us about your role and what you've built.",
      icon: <Layers className="w-8 h-8 md:w-10 md:h-10 text-white" />,
    },
    commitment: {
      title: "Commitment",
      desc: "We value dedication. How committed are you to the club's future?",
      icon: <Heart className="w-8 h-8 md:w-10 md:h-10 text-white" />,
    },
  };

  const homeContent = {
    title: "VinnovateIT 2026",
    desc: "Join the most innovative technical club at VIT. Update your profile to get started.",
    icon: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="https://raw.githubusercontent.com/vinnovateit/.github/main/assets/whiteLogoViit.png"
        alt="Logo"
        className="w-12 h-12 opacity-90"
      />
    ),
  };

  const currentData = isHome
    ? homeContent
    : sectionContent[activeSection] || sectionContent.personal;

  return (
    <div className="flex flex-col justify-center h-full p-8 md:p-12 lg:p-16 relative overflow-hidden">
      {/* Background Blob */}
      <div
        className={`${styles.blob} ${
          isHome ? styles.blobHome : styles.blobForm
        }`}
      />

      {/* Logo */}
      <div
        className={`relative z-10 mb-20 transition-all duration-700 ease-in-out ${
          isHome ? "scale-125 origin-center" : "scale-100 origin-left"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://raw.githubusercontent.com/vinnovateit/.github/main/assets/whiteLogoViit.png"
          alt="VinnovateIT"
          className={`h-auto opacity-90 ${isHome ? "w-48 mx-auto" : "w-32"}`}
        />
      </div>

      {/* Dynamic Content */}
      <div
        key={isHome ? "home" : activeSection}
        className={`relative z-10 ${styles.animateSlideUp}`}
      >
        {!isHome && (
          <div className="mb-6 inline-block p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
            {currentData.icon}
          </div>
        )}

        <h2
          className={`font-extrabold text-white mb-6 leading-tight tracking-tight transition-all duration-500
          ${
            isHome
              ? "text-4xl md:text-6xl text-center bg-clip-text text-transparent bg-linear-to-b from-white to-neutral-400"
              : "text-3xl md:text-5xl"
          }
        `}
        >
          {currentData.title}
        </h2>

        <p
          className={`text-neutral-400 leading-relaxed transition-all duration-500
          ${
            isHome
              ? "text-lg md:text-2xl text-center max-w-xl mx-auto"
              : "text-base md:text-lg max-w-sm"
          }
        `}
        >
          {currentData.desc}
        </p>

        {isHome && (
          <div className="mt-12 text-center">
            <Link href="/forms">
              <button className="btn-primary group">
                <span>GO</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        )}
      </div>

      {!isHome && (
        <div className="mt-auto pt-12 flex items-center gap-3 text-sm text-neutral-600 font-medium tracking-widest uppercase">
          <div className="h-px w-8 bg-neutral-700"></div>
          2025 Member Profile
        </div>
      )}
    </div>
  );
}
