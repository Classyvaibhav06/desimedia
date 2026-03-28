import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquarePlus, Hash, User, Inbox } from "lucide-react";

import { NewConversationForm } from "@/components/chat/new-conversation-form";
import { getRequiredUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

export default async function ChatHome() {
  const userId = await getRequiredUserId();
  if (!userId) {
    redirect("/auth/login");
  }

  const { conversations, dbFailed, dbError } = await (async () => {
    try {
      const convs = await prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId },
          },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, displayName: true },
              },
            },
          },
        },
      });
      return { conversations: convs, dbFailed: false, dbError: "" };
    } catch (e: unknown) {
      return { conversations: [], dbFailed: true, dbError: e instanceof Error ? e.message : String(e) || "Unknown error" };
    }
  })();

  if (dbFailed) {
    return (
      <div className="flex flex-col h-full bg-black p-4 md:p-8 justify-center items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight text-white">Database Error</h1>
        <p className="text-sm text-[#ea6a2a] max-w-sm text-center">Failed to load conversations: {dbError}</p>
        <div className="p-4 bg-[#111] border border-[#222] rounded-lg text-sm text-[#888]">
          <code>npx prisma db push</code> then restart the server.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black md:flex-row">
      <div className="w-full md:w-80 border-r-0 md:border-r border-[#222] flex flex-col h-full">
        <div className="p-4 border-b border-[#222]">
           <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
             <Inbox size={20} className="text-[#888]" />
             Inbox
           </h1>
        </div>

        <div className="p-4 flex flex-col gap-2 overflow-y-auto mt-2">
          {conversations.length === 0 ? (
             <div className="py-8 text-center text-sm text-[#555] flex flex-col items-center gap-3">
               <MessageSquarePlus size={24} />
               <span>No active conversations.</span>
             </div>
          ) : (
            conversations.map((conv) => {
              const otherParticipants = conv.participants.filter(
                (p) => p.userId !== userId
              );
              let chatTitle = conv.groupName;
              if (!chatTitle && conv.type !== "GROUP") {
                chatTitle = otherParticipants[0]?.user.displayName || "Unknown User";
              }

              return (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className="group flex flex-col p-3 rounded-lg border border-transparent hover:border-[#222] hover:bg-[#111]/50 transition-all gap-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center bg-[#111] border border-[#333] text-[#888] group-hover:text-white group-hover:bg-[#222] transition-colors">
                      {conv.type === "GROUP" ? <Hash size={18} /> : <User size={18} />}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-semibold truncate text-[#eaebec]">
                        {chatTitle || "Unnamed Chat"}
                      </span>
                      {conv.type === "GROUP" && (
                        <span className="text-xs text-[#666]">Group</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 bg-black">
        <div className="max-w-md w-full border border-[#222] rounded-xl p-6 bg-[#111]">
          <h2 className="text-lg font-bold text-white mb-2">Start a new connection</h2>
          <p className="text-sm text-[#888] mb-6">Create a group or DM to start sharing media.</p>
          <NewConversationForm currentUserId={userId} />
        </div>
      </div>

    </div>
  );
}
