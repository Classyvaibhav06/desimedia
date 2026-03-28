import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIo } from "@/types/socket";
import { prisma } from "@/lib/db/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  const socketServer = res.socket.server as NetServer & {
    io?: ServerIO;
  };

  if (!socketServer.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = socketServer;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });
    console.log("[Socket] Socket.IO server initialized");
    const connectedUsers = new Map<string, Set<string>>();

    const registerUserSocket = (userId: string, socketId: string) => {
      const socketIds = connectedUsers.get(userId) ?? new Set<string>();
      socketIds.add(socketId);
      connectedUsers.set(userId, socketIds);
    };

    const unregisterUserSocket = (userId: string | undefined, socketId: string) => {
      if (!userId) return;

      const socketIds = connectedUsers.get(userId);
      if (!socketIds) return;

      socketIds.delete(socketId);
      if (socketIds.size === 0) {
        connectedUsers.delete(userId);
      }
    };

    const emitToUser = (userId: string, event: string, payload: unknown) => {
      const socketIds = connectedUsers.get(userId);
      if (!socketIds?.size) {
        console.log(`[Socket] No connected sockets found for user ID: ${userId}`);
        return;
      }

      console.log(`[Socket] Emitting "${event}" to user ${userId} (${socketIds.size} socket(s))`);
      socketIds.forEach((socketId) => {
        io.to(socketId).emit(event, payload);
      });
    };
    
    // Core signaling for calls
    io.on("connection", (socket) => {
      console.log(`[Socket] New connection: ${socket.id}`);

      // 0. Join personal room for global direct routing
      socket.on("join_personal_room", (userId) => {
        console.log(`[Socket] User ${userId} joined personal room (socket: ${socket.id})`);
        socket.data.userId = userId;
        socket.join(userId);
        registerUserSocket(userId, socket.id);
      });

      // 1. Join a specific chat's signaling room
      socket.on("join_chat", (conversationId) => {
        console.log(`[Socket] Socket ${socket.id} joined chat room: ${conversationId}`);
        socket.join(conversationId);
      });

      // 2. Transmit the ring!
      socket.on("start_call", async (data) => {
        console.log(`[Socket] ── start_call ──────────────────────────`);
        console.log(`[Socket]   caller: ${data.callerId}, room: ${data.roomId}`);

        // Emit to the conversation room (for anyone already in the chat)
        socket.to(data.roomId).emit("incoming_call", data);
        
        // Also globally notify participants via their personal rooms
        try {
          const conversation = await prisma.conversation.findUnique({
            where: { id: data.roomId },
            include: {
              participants: {
                include: { user: { select: { id: true } } }
              }
            }
          });
          
          if (conversation) {
            const notifiedIds = new Set<string>();
            conversation.participants.forEach(p => {
              // Skip the caller, and avoid double-emitting
              if (p.user.id !== data.callerId && !notifiedIds.has(p.user.id)) {
                notifiedIds.add(p.user.id);
                emitToUser(p.user.id, "incoming_call", data);
              }
            });
            console.log(`[Socket] Notified ${notifiedIds.size} participant(s) globally`);
          } else {
            console.log(`[Socket] Could not find conversation ${data.roomId} in DB.`);
          }
        } catch (error) {
          console.error("[Socket] Error looking up conversation for call ringing:", error);
        }
      });

      // 3. Let others know it was answered
      socket.on("call_accepted", (data: { roomId: string; callerId?: string }) => {
        console.log(`[Socket] call_accepted for room ${data.roomId}, notifying caller ${data.callerId}`);
        // Broadcast to room (catches caller if they are still in the room)
        socket.to(data.roomId).emit("call_accepted");
        // Also directly notify the caller via personal room (fallback if they left the room)
        if (data.callerId) {
          emitToUser(data.callerId, "call_accepted", null);
        }
      });

      // 4. Let the caller know it was declined
      socket.on("call_rejected", (data: { roomId: string; callerId?: string }) => {
        console.log(`[Socket] call_rejected for room ${data.roomId}, notifying caller ${data.callerId}`);
        socket.to(data.roomId).emit("call_rejected");
        if (data.callerId) {
          emitToUser(data.callerId, "call_rejected", null);
        }
      });

      // 5. Hang up
      socket.on("end_call", (data: { roomId: string; callerId?: string }) => {
        console.log(`[Socket] end_call for room ${data.roomId}`);
        socket.to(data.roomId).emit("call_ended");
        // For end_call, try notifying the caller if they exist
        if (data.callerId) {
          emitToUser(data.callerId, "call_ended", null);
        }
      });

      // 6. WebRTC Signaling
      socket.on("webrtc_offer", (payload) => {
        console.log(`[Socket] Relaying webrtc_offer for room ${payload.roomId}`);
        socket.to(payload.roomId).emit("webrtc_offer", payload);
      });
      socket.on("webrtc_answer", (payload) => {
        console.log(`[Socket] Relaying webrtc_answer for room ${payload.roomId}`);
        socket.to(payload.roomId).emit("webrtc_answer", payload);
      });
      socket.on("webrtc_ice_candidate", (payload) => {
        socket.to(payload.roomId).emit("webrtc_ice_candidate", payload);
      });

      socket.on("disconnect", () => {
        console.log(`[Socket] Disconnected: ${socket.id} (user: ${socket.data.userId})`);
        unregisterUserSocket(socket.data.userId, socket.id);
      });
    });

    socketServer.io = io;
  }

  res.end();
};

export default ioHandler;
