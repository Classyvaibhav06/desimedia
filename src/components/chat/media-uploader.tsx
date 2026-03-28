"use client";

import { useRef, useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";

type MediaUploaderProps = {
  onUpload: (mediaUrl: string, messageType: "IMAGE" | "VIDEO") => void;
  disabled?: boolean;
};

export function MediaUploader({ onUpload, disabled }: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("Please select an image or video file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setUploading(true);
    const isVideo = preview.startsWith("data:video/");
    
    try {
      onUpload(preview, isVideo ? "VIDEO" : "IMAGE");
      setPreview(null);
      setShowModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading media");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setShowModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="p-2 text-[#888] hover:text-white rounded-full hover:bg-[#222] transition-colors shrink-0 disabled:opacity-50"
        type="button"
        title="Upload image or video"
      >
        <ImageIcon size={20} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#222] rounded-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Send Media</h3>
              <button
                onClick={handleCancel}
                className="text-[#888] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {preview && (
              <>
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#222] flex items-center justify-center mb-4 max-h-96">
                  {preview.startsWith("data:video/") ? (
                    <video src={preview} className="w-full h-full object-cover" />
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[#333] text-white text-sm font-medium hover:bg-[#222] transition-colors"
                  >
                    Choose Different
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Sending..." : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
