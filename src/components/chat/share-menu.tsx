"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, X } from "lucide-react";

type ShareMenuProps = {
  conversationId: string;
  onShareMeme?: () => void;
  onShareProfile?: () => void;
  onShareLink?: () => void;
};

export function ShareMenu({ conversationId, onShareMeme, onShareProfile, onShareLink }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#888] hover:text-white rounded-full hover:bg-[#222] transition-colors shrink-0"
        title="Share content"
      >
        <Share2 size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden shadow-xl z-50 w-48">
          <button
            onClick={() => {
              onShareMeme?.();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-[#eaebec] hover:bg-[#222] transition-colors"
          >
            Share a Meme
          </button>
          <button
            onClick={() => {
              onShareProfile?.();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-[#eaebec] hover:bg-[#222] transition-colors border-t border-[#333]"
          >
            Share Profile
          </button>
          <button
            onClick={() => {
              onShareLink?.();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-[#eaebec] hover:bg-[#222] transition-colors border-t border-[#333]"
          >
            Share Link
          </button>
        </div>
      )}
    </div>
  );
}
