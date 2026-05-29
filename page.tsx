"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  FileText, Layers, Volume2, Check, Sparkles, 
  Loader2, RefreshCw, ChevronLeft, Clock 
} from "lucide-react";
import Link from "next/link";

export default function StudentSessionView() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchSession = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Session not found. Double check your code.");
        throw new Error("Failed to load study material.");
      }
      
      const data = await res.json();
      setSession(data);
      setLastSync(new Date());

      // Auto-trigger generation if content is "raw" (just uploaded) or missing
      const isRaw = data.notes?.includes("[EXTRACTION_ONLY]");
      const hasModes = data.activeModes && data.activeModes.length > 0;
      
      if (isRaw && !isGenerating && hasModes) {
        handleAutoUpdate(data);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [sessionId, isGenerating]);

  const handleAutoUpdate = async (sessionData: any) => {
    setIsGenerating(true);
    try {
      console.log(`[Synapse] Teacher updated files. Re-generating materials for ${sessionData.id}...`);
      
      // Resolve modes array
      const modes = Array.isArray(sessionData.activeModes) 
        ? sessionData.activeModes 
        : JSON.parse(sessionData.activeModes || '["notes", "flashcards"]');

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.id,
          modes: modes,
          topic: sessionData.title,
          complexity: 60
        })
      });

      if (!res.ok) throw new Error("Auto-generation failed");
    } catch (err) {
      console.error("[Synapse] Auto-update error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Implementation: Background polling every 5 seconds to catch teacher updates
    const interval = setInterval(() => {
      fetchSession(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchSession]);

  if (loading && !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="size-10 text-[#0066cc] animate-spin mb-4" />
        <p className="text-[#6e6e73] font-medium">Connecting to your class...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f7] p-6 text-center">
        <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-[#6e6e73] mb-8 max-w-sm">{error}</p>
        <Link href="/student" className="px-8 py-3 bg-[#1d1d1f] text-white rounded-full font-medium">
          Try another code
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Status Bar */}
      <div className="bg-[#1d1d1f] text-white py-2 px-6 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            Live Session: {sessionId}
          </span>
        </div>
        <span className="flex items-center gap-1 opacity-60">
          <RefreshCw className="size-3 animate-spin-slow" />
          Last sync: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* AI Update Notification */}
      {isGenerating && (
        <div className="bg-[#0066cc] text-white py-1 px-6 text-center text-[10px] font-bold uppercase tracking-widest animate-pulse">
          Teacher updated the material. AI is re-building your study guide...
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-[#1d1d1f]/5 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/student')} className="p-2 -ml-2 hover:bg-[#1d1d1f]/5 rounded-full transition-colors">
              <ChevronLeft className="size-5" />
            </button>
            <h1 className="text-xl font-semibold tracking-tight">{session.title}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Sidebar: Files & Stats */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-[#1d1d1f]/5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#86868b] mb-4 flex items-center gap-2">
                <FileText className="size-4" />
                Course Materials
              </h2>
              <div className="space-y-3">
                {session.files?.length > 0 ? (
                  session.files.map((file: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[#f5f5f7] border border-[#1d1d1f]/5 transition-all hover:border-[#0066cc]/20">
                      <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <FileText className="size-5 text-[#0066cc]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{file.name}</p>
                        <p className="text-[11px] text-[#86868b] uppercase">{file.type.split('/')[1] || 'document'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-[#d2d2d7] rounded-2xl">
                    <p className="text-sm text-[#86868b]">Waiting for teacher to upload files...</p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <ModeStatus icon={Sparkles} label="Notes" active={!!session.notes && !session.notes.includes("[EXTRACTION_ONLY]")} />
              <ModeStatus icon={Layers} label="Cards" active={!!session.flashcards} />
              <ModeStatus icon={Volume2} label="Audio" active={!!session.podcast} />
              <ModeStatus icon={Check} label="Quiz" active={!!session.quiz} />
            </div>

            <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-[#1d1d1f]/5 min-h-[400px]">
              {session.notes && !session.notes.includes("[EXTRACTION_ONLY]") ? (
                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap text-[#1d1d1f] text-lg leading-relaxed">
                    {session.notes}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="size-16 rounded-3xl bg-[#f5f5f7] flex items-center justify-center mb-6">
                    <Clock className="size-8 text-[#86868b]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Study guide is being prepared</h3>
                  <p className="text-[#86868b] max-w-xs">The AI is processing your teacher&apos;s materials. This page will update automatically.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ModeStatus({ icon: Icon, label, active }: { icon: any, label: string, active: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${active ? 'bg-white border-[#1d1d1f]/5 shadow-sm' : 'bg-transparent border-dashed border-[#d2d2d7] opacity-40'}`}>
      <div className={`size-8 rounded-lg flex items-center justify-center ${active ? 'bg-[#0066cc] text-white' : 'bg-[#86868b]/10 text-[#86868b]'}`}>
        <Icon className="size-4" />
      </div>
      <span className="text-sm font-bold uppercase tracking-tight">{label}</span>
    </div>
  );
}