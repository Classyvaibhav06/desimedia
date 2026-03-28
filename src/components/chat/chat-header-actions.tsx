"use client";

import { useEffect } from "react";
import { Info, Phone } from "lucide-react";
import { useCallStore } from "@/store/use-call-store";
import { useSocket } from "@/components/providers/socket-provider";
import { useSession } from "next-auth/react";

type ChatHeaderActionsProps = {
  chatName: string;
  isGroup: boolean;
  roomId: string;
};

export function ChatHeaderActions({ chatName, isGroup, roomId }: ChatHeaderActionsProps) {
  const { startOutgoingCall, status } = useCallStore();
  const { socket } = useSocket();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const callerName = session?.user?.name || "Someone";

  // Make sure we join the signaling room for this chat
  useEffect(() => {
    if (socket && roomId) {
      socket.emit("join_chat", roomId);
    }
  }, [socket, roomId]);

  const handleStartCall = async () => {
    if (status !== "idle" || !socket || !userId) return;
    
    // FETCH MIC HERE immediately upon starting the call
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert("Failed to access microphone. Please allow permissions.");
      return;
    }
    
    // 1. Tell local state we are calling
    startOutgoingCall({
      chatName,
      isGroup,
      roomId,
      callerId: userId,
      callerName,
    }, stream);
    
    // 2. Tell the server to broadcast the ring
    socket.emit("start_call", {
      roomId,
      chatName,
      isGroup,
      callerId: userId,
      callerName
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleStartCall}
        className={`p-2 rounded-full transition-colors ${
          status !== "idle" 
            ? "text-[#00e676] bg-[#111]" 
            : "text-[#888] hover:text-[#00e676] hover:bg-[#111]"
        }`}
        title={isGroup ? "Start Group Call" : "Start Voice Call"}
      >
        <Phone size={20} />
      </button>
      <button 
        className="p-2 text-[#888] hover:text-white rounded-full hover:bg-[#111] transition-colors"
        title="Info"
      >
        <Info size={20} />
      </button>
    </div>
  );
}
