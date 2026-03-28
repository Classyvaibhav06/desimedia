"use client";

import { useState } from "react";
import { Zap, Upload, AlertCircle } from "lucide-react";

type MemeShareProps = {
  conversationId: string;
  onShared?: () => void;
};

export function MemeShare({ conversationId, onShared }: MemeShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    if (!content.trim() && !imageUrl) {
      setError("Add some content or an image");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content || "Shared a meme",
          messageType: imageUrl ? "IMAGE" : "MEME",
          mediaUrl: imageUrl,
        }),
      });

      if (response.ok) {
        setContent("");
        setImageUrl("");
        setIsOpen(false);
        onShared?.();
      } else {
        setError("Failed to share meme");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#333] rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 p-6 border-b border-[#333]">
          <Zap size={20} className="text-[#ffd700]" />
          <h2 className="text-lg font-bold text-white">Share a Meme</h2>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#888]">Caption</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a caption or description..."
              rows={3}
              className="w-full bg-[#222] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#888]">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/meme.jpg"
              className="w-full bg-[#222] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#333]">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 border border-[#333] text-white rounded-lg hover:border-[#555] transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={uploading || (!content.trim() && !imageUrl)}
              className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-[#ccc] disabled:opacity-50 disabled:bg-[#333] disabled:text-[#666] transition-colors text-sm font-medium"
            >
              {uploading ? "Sharing..." : "Share"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
