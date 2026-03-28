import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, User, MessageSquare } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getRequiredUserId } from "@/lib/auth/server";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const userId = await getRequiredUserId();
  if (!userId) {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-screen bg-black text-[#eaebec] overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#222] bg-[#000]">
        <div className="p-6">
          <Link href="/chat" className="text-xl font-bold tracking-tighter text-white">
            DesiMedia.
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#111] transition-colors font-medium text-sm text-[#888] hover:text-white">
            <MessageSquare size={18} />
            <span>Chats</span>
          </Link>
          <Link href="/discover" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#111] transition-colors font-medium text-sm text-[#888] hover:text-white">
            <Search size={18} />
            <span>Discover</span>
          </Link>
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#111] transition-colors font-medium text-sm text-[#888] hover:text-white">
            <User size={18} />
            <span>Profile</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-[#222]">
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col relative overflow-y-auto pb-16 md:pb-0 scrollbar-hide">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-20 border-b border-[#222] bg-black/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tighter text-white">DesiMedia.</span>
          <SignOutButton />
        </header>

        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#222] bg-black/95 backdrop-blur-lg z-30 pb-safe">
        <div className="flex items-center justify-around p-3">
          <Link href="/chat" className="flex flex-col items-center gap-1 text-[#888] hover:text-white transition-colors">
            <MessageSquare size={20} />
            <span className="text-[10px] font-medium tracking-wide">Chats</span>
          </Link>
          <Link href="/discover" className="flex flex-col items-center gap-1 text-[#888] hover:text-white transition-colors">
            <Search size={20} />
            <span className="text-[10px] font-medium tracking-wide">Search</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 text-[#888] hover:text-white transition-colors">
            <User size={20} />
            <span className="text-[10px] font-medium tracking-wide">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
