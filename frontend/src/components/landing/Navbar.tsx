"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between rounded-full border border-white/70 bg-white/58 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_18px_60px_rgba(29,29,31,0.08)] backdrop-blur-2xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 pl-1">
          <div className="flex size-9 items-center justify-center rounded-full border border-[#0066cc]/18 bg-[#0066cc]/8 text-[#0066cc]">
            <Zap className="size-4" strokeWidth={2} />
          </div>
          <span className="text-[19px] font-semibold tracking-[-0.3px] text-[#1d1d1f]">
            Synapse
          </span>
        </Link>

        {/* Centre nav */}
        <div className="hidden items-center gap-6 text-[13px] text-[#6e6e73] md:flex">
          <a href="#how-it-works" className="transition-colors hover:text-[#1d1d1f]">How it works</a>
          <a href="#teachers" className="transition-colors hover:text-[#1d1d1f]">Teachers</a>
          <a href="#students" className="transition-colors hover:text-[#1d1d1f]">Students</a>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Link
            href="/teacher"
            className="hidden h-9 items-center gap-1.5 rounded-full border border-[#0066cc]/30 px-4 text-[13px] font-medium text-[#0066cc] transition-all duration-150 hover:bg-[#0066cc]/5 active:scale-[0.97] sm:flex"
          >
            Teacher sign in
          </Link>
          <Link
            href="/student"
            className="flex h-9 items-center gap-1.5 rounded-full bg-[#0066cc] px-4 text-[13px] font-medium text-white shadow-none transition-all duration-150 hover:bg-[#0071e3] active:scale-[0.97]"
          >
            Join a class
          </Link>
        </div>
      </div>
    </nav>
  );
}
