"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io as ClientIO, Socket } from "socket.io-client";
import { useCallStore } from "@/store/use-call-store";
import { useSession } from "next-auth/react";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

type IncomingCallPayload = {
  callerId?: string;
  callerName?: string;
  chatName: string;
  isGroup: boolean;
  roomId: string;
};

type ConversationsResponse = {
  conversations?: Array<{ id: string }>;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  // Use refs for call store actions to keep the effect dependency list stable
  const receiveIncomingCall = useCallStore((state) => state.receiveIncomingCall);
  const markCallAccepted = useCallStore((state) => state.markCallAccepted);
  const markCallRejected = useCallStore((state) => state.markCallRejected);
  const markCallEnded = useCallStore((state) => state.markCallEnded);
  const userId = session?.user?.id;

  // Track which call IDs we've already processed to prevent duplicate ringing
  const processedCallsRef = useRef(new Set<string>());

  useEffect(() => {
    // Only connect if the user is logged in
    if (!userId) return;

    let socketInstance: Socket | null = null;
    let cancelled = false;

    const initSocket = async () => {
      // Ping the socket endpoint to initialize it
      await fetch("/api/socket/io");
      if (cancelled) return;

      socketInstance = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || undefined, {
        path: "/api/socket/io",
        addTrailingSlash: false,
      });

      const joinConversationRooms = async () => {
        try {
          const response = await fetch("/api/conversations", {
            cache: "no-store",
          });

          if (!response.ok) {
            return;
          }

          const data = (await response.json()) as ConversationsResponse;
          data.conversations?.forEach((conversation) => {
            if (conversation.id) {
              socketInstance?.emit("join_chat", conversation.id);
            }
          });
        } catch (error) {
          console.error("Failed to join conversation rooms", error);
        }
      };

      socketInstance.on("connect", () => {
        console.log("[SocketProvider] Connected:", socketInstance?.id);
        setIsConnected(true);
        // Join a personal room for global direct routing (using user ID)
        socketInstance?.emit("join_personal_room", userId);
        void joinConversationRooms();
      });

      socketInstance.on("disconnect", () => {
        console.log("[SocketProvider] Disconnected");
        setIsConnected(false);
      });

      // Handle global call events
      socketInstance.on("incoming_call", (data: IncomingCallPayload) => {
        // Don't ring if you are the one who initiated it
        if (data.callerId === userId) return;

        // Deduplicate: the same incoming_call may arrive via room + personal room
        const callKey = `${data.roomId}:${data.callerId}`;
        if (processedCallsRef.current.has(callKey)) return;
        processedCallsRef.current.add(callKey);

        // Clear the key after 5s so a new call to the same room works
        setTimeout(() => {
          processedCallsRef.current.delete(callKey);
        }, 5000);

        console.log("[SocketProvider] Incoming call from", data.callerName, "in room", data.roomId);

        receiveIncomingCall({
          chatName: data.chatName,
          isGroup: data.isGroup,
          roomId: data.roomId,
          callerId: data.callerId,
          callerName: data.callerName
        });
      });

      socketInstance.on("call_accepted", () => {
        console.log("[SocketProvider] Call accepted by peer");
        markCallAccepted();
      });

      socketInstance.on("call_rejected", () => {
        console.log("[SocketProvider] Call rejected by peer");
        markCallRejected();
      });

      socketInstance.on("call_ended", () => {
        console.log("[SocketProvider] Call ended by peer");
        markCallEnded();
      });

      setSocket(socketInstance);
    };

    void initSocket();

    return () => {
      cancelled = true;
      socketInstance?.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [markCallAccepted, markCallEnded, markCallRejected, receiveIncomingCall, userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
