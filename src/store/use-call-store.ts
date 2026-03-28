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
  
  startOutgoingCall: (details: CallDetails) => void;
  receiveIncomingCall: (details: CallDetails) => void;
  acceptCall: () => void;
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

  startOutgoingCall: (details) => set({
    status: "outgoing",
    callDetails: details,
    isMuted: false,
  }),

  receiveIncomingCall: (details) => set((state) => {
    // Prevent overriding an active call
    if (state.status !== "idle") return state;
    return {
      status: "incoming",
      callDetails: details,
      isMuted: false,
    };
  }),

  acceptCall: () => set({ status: "connected" }),
  
  declineCall: () => set({ status: "idle", callDetails: null }),
  
  endCall: () => set({ status: "idle", callDetails: null, isMuted: false }),

  markCallAccepted: () => set((state) => {
    if (state.status === "outgoing") return { status: "connected" };
    return state;
  }),
  
  markCallRejected: () => set({ status: "rejected" }),
  
  markCallEnded: () => set({ status: "idle", callDetails: null, isMuted: false }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}));
