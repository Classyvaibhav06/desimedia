"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

type AvatarUploaderProps = {
  onUploadComplete: (avatarUrl: string) => void;
};

export function AvatarUploader({ onUploadComplete }: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setUploading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: preview }),
      });

      if (res.ok) {
        onUploadComplete(preview);
        setShowUploadModal(false);
        setPreview(null);
      } else {
        alert("Failed to upload avatar");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setShowUploadModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowUploadModal(true)}
        className="absolute bottom-0 right-0 h-8 w-8 bg-[#222] border border-[#333] rounded-full flex items-center justify-center text-white hover:bg-[#333] transition-colors shadow-black"
      >
        <Upload size={14} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#222] rounded-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Change Avatar</h3>
              <button
                onClick={handleCancel}
                className="text-[#888] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {preview ? (
              <>
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#222] flex items-center justify-center mb-4">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
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
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#333] rounded-lg p-8 text-center cursor-pointer hover:border-[#555] transition-colors mb-4"
                >
                  <Upload size={32} className="mx-auto mb-2 text-[#888]" />
                  <p className="text-sm text-[#eaebec] font-medium">Click to select image</p>
                  <p className="text-xs text-[#888] mt-1">PNG, JPG or GIF (Max 5MB)</p>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#333] text-white text-sm font-medium hover:bg-[#222] transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
