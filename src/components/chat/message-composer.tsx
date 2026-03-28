"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { ShareMenu } from "./share-menu";
import { MediaUploader } from "./media-uploader";
import { GifSearcher } from "./gif-searcher";

type MessageComposerProps = {
  conversationId: string;
};

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareWarn, setShowShareWarn] = useState<string | null>(null);
  const [mediaData, setMediaData] = useState<{ url: string; type: "IMAGE" | "VIDEO" } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  async function onSubmit() {
    const trimmed = content.trim();
    if ((!trimmed && !mediaData) || isSending) return;

    setIsSending(true);
    setError(null);

    const payload: { content: string; messageType?: "IMAGE" | "VIDEO"; mediaUrl?: string } = { content: "" };
    
    if (mediaData) {
      payload.messageType = mediaData.type;
      payload.mediaUrl = mediaData.url;
      payload.content = trimmed || `[${mediaData.type}]`;
    } else {
      payload.content = trimmed;
    }

    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSending(false);

    if (response.ok) {
      setContent("");
      setMediaData(null);
      router.refresh(); // Refresh page to see new message
    } else {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Failed to send message");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full max-w-4xl mx-auto">
      {error && <p className="text-xs text-red-500 px-2">{error}</p>}
      {showShareWarn && (
        <p className="text-xs text-[#888] px-2 py-1 bg-[#222] rounded border border-[#333]">
          {showShareWarn}
        </p>
      )}
      
      {/* Media Preview */}
      {mediaData && (
        <div className="relative px-2 py-2">
          <div className="relative inline-block">
            {mediaData.type === "IMAGE" ? (
              <img src={mediaData.url} alt="Preview" className="max-h-40 rounded-lg" />
            ) : (
              <video src={mediaData.url} className="max-h-40 rounded-lg" />
            )}
            <button
              onClick={() => setMediaData(null)}
              className="absolute top-1 right-1 bg-black/80 rounded-full p-1 text-white hover:bg-black transition-colors"
            >
              <span className="text-xs">✕</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 bg-[#111] p-2 rounded-2xl border border-[#222]">
        <MediaUploader 
          onUpload={(url, type) => {
            setMediaData({ url, type });
          }}
          disabled={isSending}
        />

        <GifSearcher 
          onSelectGif={(gifUrl) => {
            setMediaData({ url: gifUrl, type: "IMAGE" });
          }}
          disabled={isSending}
        />

        <ShareMenu
          conversationId={conversationId}
          onShareMeme={() => setShowShareWarn("✨ Coming soon: Share memes to this chat")}
          onShareProfile={() => setShowShareWarn("🔗 Coming soon: Share profiles with a quick link")}
          onShareLink={() => setShowShareWarn("📎 Coming soon: Share links and embeds")}
        />
        
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          className="flex-1 max-h-[120px] min-h-[40px] bg-transparent text-white border-0 resize-none px-2 py-2.5 focus:outline-none focus:ring-0 placeholder:text-[#555] scrollbar-hide"
        />

        <button
          onClick={onSubmit}
          disabled={(!content.trim() && !mediaData) || isSending}
          className="p-2 bg-white text-black rounded-full hover:bg-[#ccc] disabled:opacity-50 disabled:bg-[#333] disabled:text-[#666] transition-colors shrink-0"
        >
          <Send size={18} className={isSending ? "animate-pulse" : ""} />
        </button>
      </div>
    </div>
  );
}
