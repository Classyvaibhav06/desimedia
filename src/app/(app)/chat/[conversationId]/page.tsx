import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { MessageComposer } from "@/components/chat/message-composer";
import { ChatHeaderActions } from "@/components/chat/chat-header-actions";
import { getRequiredUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

type ChatRoomPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const userId = await getRequiredUserId();
  if (!userId) {
    redirect("/auth/login");
  }

  const { conversationId } = await params;

  const membership = await (async () => {
    try {
      return await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });
    } catch {
      return null;
    }
  })();

  if (!membership) {
    redirect("/chat");
  }

  const conversation = await (async () => {
    try {
      return await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, displayName: true, username: true },
              },
            },
          },
          messages: {
            where: { deletedAt: null },
            include: {
              sender: {
                select: { id: true, displayName: true, username: true },
              },
            },
            orderBy: { createdAt: "asc" },
            take: 50,
          },
        },
      });
    } catch {
      return null;
    }
  })();

  if (!conversation) {
    redirect("/chat");
  }

  const chatName =
    conversation.type === "GROUP"
      ? conversation.groupName ?? "Unnamed group"
      : conversation.participants.find((p) => p.userId !== userId)?.user.displayName ?? "Direct message";

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#222] bg-black/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-1.5 -ml-1.5 rounded-full hover:bg-[#111] transition-colors text-[#888] hover:text-white md:hidden">
            <ChevronLeft size={24} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">{chatName}</h1>
            <p className="text-xs font-medium text-[#666]">
              {conversation.type === "GROUP" ? `${conversation.participants.length} members` : "Direct Message"}
            </p>
          </div>
        </div>
        <ChatHeaderActions chatName={chatName || "User"} isGroup={conversation.type === "GROUP"} roomId={conversationId} />
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {conversation.messages.length === 0 ? (
          <div className="m-auto text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-[#111] rounded-full flex items-center justify-center text-[#444] text-xl border border-[#222]">👋</div>
            <p className="text-sm font-medium text-[#888]">Say hello to start the chat.</p>
          </div>
        ) : (
          conversation.messages.map((message) => {
            const mine = message.senderId === userId;
            return (
              <div
                key={message.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-full`}
              >
                {!mine && conversation.type === "GROUP" && (
                  <Link
                    href={`/users/${message.senderId}`}
                    className="text-xs font-medium text-[#666] hover:text-[#888] transition-colors ml-2 mb-1 hover:underline"
                  >
                    {message.sender.displayName || message.sender.username}
                  </Link>
                )}
                <div
                  className={`relative max-w-[85%] sm:max-w-[70%] ${
                    mine ? "items-end" : "items-start"
                  }`}
                >
                  {/* Media Display */}
                  {message.mediaUrl && (
                    <div className={`rounded-2xl overflow-hidden border ${
                      mine 
                        ? "rounded-br-sm border-white" 
                        : "rounded-bl-sm border-[#333]"
                    } mb-1`}>
                      {message.messageType === "IMAGE" || message.messageType === "MEME" ? (
                        <img 
                          src={message.mediaUrl} 
                          alt="Message media" 
                          className="max-w-sm max-h-80 object-cover"
                        />
                      ) : message.messageType === "VIDEO" ? (
                        <video 
                          src={message.mediaUrl} 
                          controls 
                          className="max-w-sm max-h-80"
                        />
                      ) : null}
                    </div>
                  )}

                  {/* Text Display */}
                  {message.content && message.content !== `[${message.messageType}]` && (
                    <div
                      className={`px-4 py-2.5 text-[0.9375rem] leading-relaxed ${
                        mine
                          ? "bg-white text-black rounded-2xl rounded-br-sm"
                          : "bg-[#111] text-white rounded-2xl rounded-bl-sm border border-[#222]"
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-[#222] bg-[#0a0a0a]">
        <MessageComposer conversationId={conversation.id} />
      </div>
    </div>
  );
}