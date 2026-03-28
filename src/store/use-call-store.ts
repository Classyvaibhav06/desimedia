import { create } from 'zustand';

type CallStatus = "idle" | "incoming" | "outgoing" | "connected" | "rejected";

export interface CallDetails {
  chatName: string;
  isGroup: boolean;
  roomId: string;
  callerId?: string;
  callerName?: string;
}

interface CallStore {
  status: CallStatus;
  callDetails: CallDetails | null;
  isMuted: boolean;
  localStream: MediaStream | null;
  
  startOutgoingCall: (details: CallDetails, stream: MediaStream) => void;
  receiveIncomingCall: (details: CallDetails) => void;
  acceptCall: (stream: MediaStream) => void;
  declineCall: () => void;
  endCall: () => void;
  
  // Socket triggered handlers
  markCallAccepted: () => void;
  markCallRejected: () => void;
  markCallEnded: () => void;
  
  toggleMute: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  status: "idle",
  callDetails: null,
  isMuted: false,
  localStream: null,

  startOutgoingCall: (details, stream) => set({
    status: "outgoing",
    callDetails: details,
    isMuted: false,
    localStream: stream,
  }),

  receiveIncomingCall: (details) => set((state) => {
    // Prevent overriding an active call
    if (state.status !== "idle") return state;
    return {
      status: "incoming",
      callDetails: details,
      isMuted: false,
      localStream: null,
    };
  }),

  acceptCall: (stream) => set({ status: "connected", localStream: stream }),
  
  declineCall: () => set({ status: "idle", callDetails: null, localStream: null }),
  
  endCall: () => set({ status: "idle", callDetails: null, isMuted: false, localStream: null }),

  markCallAccepted: () => set((state) => {
    if (state.status === "outgoing") return { status: "connected" };
    return state;
  }),
  
  markCallRejected: () => set({ status: "rejected" }),
  
  markCallEnded: () => set({ status: "idle", callDetails: null, isMuted: false, localStream: null }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}));
