"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b border-blue-100/40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center border border-blue-200 dark:border-blue-800 shadow-sm">
          <Brain className="text-blue-600 dark:text-blue-400 w-4 h-4" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Synapse <span className="text-blue-600 dark:text-blue-400">AI</span>
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className={buttonVariants({
            variant: "default",
            className:
              "bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 font-medium shadow-sm",
          })}
        >
          My Learning
        </Link>
      </div>
    </nav>
  );
}
