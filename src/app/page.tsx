import Link from "next/link";
import { ArrowRight, MessageSquare, Zap, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-[#eaebec] selection:bg-white selection:text-black">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-6xl mx-auto">
        <div className="text-xl font-bold tracking-tighter">DesiMedia.</div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-medium text-[#888] hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/auth/signup" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-[#ccc] transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#222] bg-[#111] text-xs font-medium text-[#888] mb-8">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          DesiMedia Beta is live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter max-w-4xl leading-tight mb-6">
          Chat that moves as <span className="text-[#888]">fast as you do.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[#888] max-w-2xl mb-10 leading-relaxed">
          A brutalist minimal platform for communities. DMs, instant groups, and deep social connections built for speed and aesthetics. 
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/chat"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-[#ccc] transition-all transform hover:scale-105"
          >
            Open App <ArrowRight size={16} />
          </Link>
          <Link
            href="/discover"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#111] border border-[#333] text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-[#222] transition-colors"
          >
            Explore Community
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left">
          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-[#222]">
            <div className="w-12 h-12 bg-[#111] rounded-full flex items-center justify-center mb-6 text-white">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold mb-2">Instant Sync</h3>
            <p className="text-sm text-[#888] leading-relaxed">Built on modern infrastructure for zero-delay message delivery and fast page transitions.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-[#222]">
            <div className="w-12 h-12 bg-[#111] rounded-full flex items-center justify-center mb-6 text-white">
              <Users size={20} />
            </div>
            <h3 className="text-lg font-bold mb-2">Smart Groups</h3>
            <p className="text-sm text-[#888] leading-relaxed">Organize your circles smoothly with deeply integrated profiles and follower tracking.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-[#222]">
            <div className="w-12 h-12 bg-[#111] rounded-full flex items-center justify-center mb-6 text-white">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-lg font-bold mb-2">Minimal UI</h3>
            <p className="text-sm text-[#888] leading-relaxed">Zero clutter. A high-contrast dark theme focused purely on your content and conversations.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
