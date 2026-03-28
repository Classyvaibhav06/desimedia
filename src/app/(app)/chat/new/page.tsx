import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getRequiredUserId } from "@/lib/auth/server";
import { NewConversationForm } from "@/components/chat/new-conversation-form";

export default async function NewChatPage() {
  const userId = await getRequiredUserId();
  if (!userId) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="p-4 border-b border-[#222] flex items-center gap-3">
        <Link href="/chat" className="p-2 -ml-2 text-[#888] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-white">New Connection</h1>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <p className="text-sm text-[#888] mb-6">Create a group or DM to start sharing media.</p>
          <NewConversationForm currentUserId={userId} />
        </div>
      </div>
    </div>
  );
}
