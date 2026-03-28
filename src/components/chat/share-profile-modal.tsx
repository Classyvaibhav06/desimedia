"use client";

import { useState } from "react";
import { X, Users } from "lucide-react";

type ShareProfileModalProps = {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (userId: string) => void;
};

export function ShareProfileModal({ isOpen, onClose, onShare }: ShareProfileModalProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#333] rounded-2xl max-w-sm w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-white" />
            <h2 className="text-lg font-bold text-white">Share Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#888] hover:text-white rounded-lg hover:bg-[#222] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-[#888]">Select a profile to share with this conversation</p>

          {/* Coming Soon Placeholder */}
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center border border-dashed border-[#444] rounded-lg">
            <Users size={32} className="text-[#555]" />
            <div>
              <p className="text-sm font-medium text-[#888]">Profile Sharing Coming Soon</p>
              <p className="text-xs text-[#666] mt-1">Share your contact with friends</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#333]">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#333] text-white rounded-lg hover:border-[#555] transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              disabled={!selectedUser}
              className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-[#ccc] disabled:opacity-50 disabled:bg-[#333] disabled:text-[#666] transition-colors text-sm font-medium"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
