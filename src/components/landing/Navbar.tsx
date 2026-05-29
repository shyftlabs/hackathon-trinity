"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between rounded-full border border-white/70 bg-white/58 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_18px_60px_rgba(29,29,31,0.08)] backdrop-blur-2xl">
        <Link href="/" className="flex items-center gap-2.5 pl-1">
          <div className="flex size-9 items-center justify-center rounded-full border border-[#0066cc]/18 bg-[#0066cc]/8 text-[#0066cc]">
            <BookOpenText className="size-4.5" strokeWidth={1.8} />
          </div>
          <span className="text-[19px] font-semibold text-[#1d1d1f]">Flux</span>
        </Link>

        <div className="hidden items-center gap-6 text-[13px] text-[#6e6e73] md:flex">
          <span>Notes</span>
          <span>Cards</span>
          <span>Maps</span>
        </div>

        <Link
          href="/dashboard"
          className={buttonVariants({
            variant: "default",
            className:
              "h-10 rounded-full bg-[#1d1d1f] px-4 text-[14px] font-medium text-white shadow-none transition hover:bg-[#2d2d2f] active:scale-95 sm:px-5",
          })}
        >
          Library
          <ArrowRight className="size-3.5" strokeWidth={1.8} />
        </Link>
      </div>
    </nav>
  );
}
