"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, Mic, MicOff, PhoneOff, Users, PhoneIncoming } from "lucide-react";
import { useCallStore } from "@/store/use-call-store";
import { useSocket } from "@/components/providers/socket-provider";
import { useSession } from "next-auth/react";

export function GlobalCallUI() {
  const { data: session } = useSession();
  const { 
    status, callDetails, isMuted, 
    acceptCall, declineCall, endCall, toggleMute 
  } = useCallStore();
  const { socket } = useSocket();
  const userId = session?.user?.id;
  
  const [callDuration, setCallDuration] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Use refs for values needed inside socket handlers to avoid stale closures
  const callDetailsRef = useRef(callDetails);
  const socketRef = useRef(socket);
  useEffect(() => { callDetailsRef.current = callDetails; }, [callDetails]);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  const cleanupWebRTC = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  /**
   * Creates & returns an RTCPeerConnection with local mic tracks added.
   * Does NOT create an offer/answer — the caller is responsible for that.
   */
  const createPeerConnection = useCallback(async (): Promise<RTCPeerConnection> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microphone access is not supported. This normally happens if you test on mobile without HTTPS. Use localhost or ngrok.");
      throw new Error("navigator.mediaDevices is undefined");
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert("Failed to get microphone access. Please allow microphone permissions.");
      throw err;
    }
    
    streamRef.current = stream;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ]
    });
    peerRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      if (audioRef.current) {
        audioRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates — use refs to always get the latest values
    pc.onicecandidate = (event) => {
      const details = callDetailsRef.current;
      const sock = socketRef.current;
      if (event.candidate && details && sock) {
        sock.emit("webrtc_ice_candidate", {
          roomId: details.roomId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
    };

    return pc;
  }, []);

  const handleAccept = () => {
    if (!callDetails || !socket) return;
    socket.emit("call_accepted", { roomId: callDetails.roomId, callerId: callDetails.callerId });
    acceptCall();
  };

  const handleDecline = () => {
    if (!callDetails || !socket) return;
    socket.emit("call_rejected", { roomId: callDetails.roomId, callerId: callDetails.callerId });
    declineCall();
  };

  const handleEndCall = () => {
    if (!callDetails || !socket) return;
    socket.emit("end_call", { roomId: callDetails.roomId, callerId: callDetails.callerId });
    endCall();
  };

  // Handle WebRTC signaling messages
  useEffect(() => {
    if (!socket || !callDetails) return;

    const onOffer = async (payload: { roomId: string; offer: RTCSessionDescriptionInit }) => {
      if (payload.roomId !== callDetailsRef.current?.roomId) return;
      
      try {
        // Always create a fresh peer connection for the receiver
        if (peerRef.current) {
          peerRef.current.close();
        }
        const pc = await createPeerConnection();

        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit("webrtc_answer", { 
          roomId: callDetailsRef.current?.roomId, 
          answer 
        });
      } catch (err) {
        console.error("[WebRTC] Error handling offer:", err);
        endCall(); // Clean up call if microphone access fails for receiver
      }
    };

    const onAnswer = async (payload: { roomId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerRef.current;
      if (pc && pc.signalingState !== "stable") {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        } catch (err) {
          console.error("[WebRTC] Error handling answer:", err);
        }
      }
    };

    const onIceCandidate = async (payload: { roomId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerRef.current;
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error("[WebRTC] Error adding received ICE candidate", e);
        }
      }
    };

    socket.on("webrtc_offer", onOffer);
    socket.on("webrtc_answer", onAnswer);
    socket.on("webrtc_ice_candidate", onIceCandidate);

    return () => {
      socket.off("webrtc_offer", onOffer);
      socket.off("webrtc_answer", onAnswer);
      socket.off("webrtc_ice_candidate", onIceCandidate);
    };
  }, [callDetails, createPeerConnection, socket]);

  // Handle local state changes
  useEffect(() => {
    if (status === "connected") {
      // Reset the timer for new call
      setCallDuration(0);

      // The CALLER creates the offer, the receiver waits for it
      if (userId && callDetails && callDetails.callerId === userId) {
        // I'm the caller — create peer connection + offer
        (async () => {
          try {
            if (peerRef.current) {
              peerRef.current.close();
            }
            const pc = await createPeerConnection();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit("webrtc_offer", { roomId: callDetails.roomId, offer });
          } catch (err) {
            console.error("[WebRTC] Failed to create offer:", err);
            endCall(); // Clean up if failed
          }
        })();
      }
      // The RECEIVER does nothing here — they'll init when the offer arrives

      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } 
    else if (status === "rejected") {
      cleanupWebRTC();
      setTimeout(() => endCall(), 2000);
    }
    else if (status === "idle") {
      cleanupWebRTC();
      setCallDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [callDetails, cleanupWebRTC, createPeerConnection, endCall, socket, status, userId]);

  // Handle local mic mute when store isMuted changes
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  if (status === "idle" || !callDetails) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Main Call UI Box */}
      <div className="relative bg-[#111] border border-[#333] shadow-2xl rounded-3xl w-full max-w-sm p-8 flex flex-col items-center animate-in zoom-in-95 duration-200">
        
        {/* Avatar Area */}
        <div className="w-28 h-28 bg-[#222] rounded-full flex items-center justify-center mb-6 relative">
          {callDetails.isGroup ? (
            <Users size={48} className="text-white" />
          ) : (
            <Phone size={48} className="text-white" />
          )}

          {/* Pulse animation for calling/incoming */}
          {(status === "outgoing" || status === "incoming") && (
            <div className="absolute inset-0 border-4 border-[#00e676] rounded-full animate-ping opacity-20" />
          )}
        </div>

        {/* Name & Subtext */}
        <h2 className="text-2xl font-bold text-white mb-2 text-center max-w-full truncate px-4">
          {callDetails.chatName}
        </h2>

        <p className="text-[#888] mb-8 font-medium">
          {status === "incoming" && "Incoming Call..."}
          {status === "outgoing" && "Calling..."}
          {status === "connected" && formatTime(callDuration)}
          {status === "rejected" && "Call Declined"}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 w-full">
          
          {status === "incoming" ? (
            <>
              <button 
                onClick={handleDecline}
                className="w-16 h-16 rounded-full bg-[#ff3333] hover:bg-[#ff1a1a] text-white flex items-center justify-center transition-colors shadow-[0_0_20px_rgba(255,51,51,0.2)]"
              >
                <PhoneOff size={28} />
              </button>
              <button 
                onClick={handleAccept}
                className="w-16 h-16 rounded-full bg-[#00e676] hover:bg-[#00c853] text-black flex items-center justify-center transition-colors shadow-[0_0_20px_rgba(0,230,118,0.2)]"
              >
                <PhoneIncoming size={28} />
              </button>
            </>
          ) : (
            <>
              {/* Mute Button Active Only on Connect */}
              <button 
                onClick={toggleMute}
                disabled={status !== "connected"}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isMuted ? "bg-white text-black" : "bg-[#222] text-white hover:bg-[#333]"
                } ${status !== "connected" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button 
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-[#ff3333] hover:bg-[#ff1a1a] text-white flex items-center justify-center transition-colors shadow-[0_0_20px_rgba(255,51,51,0.2)]"
              >
                <PhoneOff size={28} />
              </button>
            </>
          )}

        </div>

      </div>
      {/* Hidden audio element for WebRTC tracks */}
      <audio ref={audioRef} autoPlay className="hidden" />
    </div>
  );
}
