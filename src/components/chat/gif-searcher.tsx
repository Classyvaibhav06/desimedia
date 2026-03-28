"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

type GifSearcherProps = {
  onSelectGif: (gifUrl: string) => void;
  disabled?: boolean;
};

export function GifSearcher({ onSelectGif, disabled }: GifSearcherProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchGifs = async (query: string = "trending") => {
    const searchTerm = query.trim() || "trending";

    setLoading(true);
    try {
      // Use our own API endpoint to avoid CORS issues
      const response = await fetch(`/api/gifs/search?q=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        console.error(`API error: ${response.status}`);
        setGifs([]);
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { data?: string[] };

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        setGifs(data.data);
      } else {
        setGifs([]);
      }
    } catch (error) {
      console.error("Failed to fetch GIFs:", error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If query is empty, show trending
    if (!query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchGifs("trending");
      }, 300);
    } else {
      searchTimeoutRef.current = setTimeout(() => {
        searchGifs(query);
      }, 300);
    }
  };

  const handleSelectGif = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    onSelectGif(gifUrl);
    setShowModal(false);
    setSearchQuery("");
    setGifs([]);
  };

  const openGifModal = () => {
    setShowModal(true);
    // Load popular/trending GIFs by default
    if (gifs.length === 0) {
      searchGifs("trending");
    }
  };

  return (
    <>
      <button
        onClick={openGifModal}
        disabled={disabled}
        className="p-2 text-[#888] hover:text-white rounded-full hover:bg-[#222] transition-colors shrink-0 disabled:opacity-50 text-xs font-bold"
        type="button"
        title="Search and send GIF"
      >
        GIF
      </button>

      {/* GIF Search Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#222] rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">GIF Search</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSearchQuery("");
                }}
                className="text-[#888] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
              <input
                type="text"
                placeholder="Search for GIFs..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                className="w-full bg-[#0a0a0a] border border-[#333] text-white rounded-lg pl-10 pr-4 py-3 placeholder:text-[#555] focus:outline-none focus:border-white transition-colors"
              />
            </div>

            {/* Popular GIFs or Search Results */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 pb-2 min-h-[300px] auto-rows-max">
              {loading ? (
                <div className="col-span-2 md:col-span-3 flex items-center justify-center h-40">
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                </div>
              ) : gifs.length > 0 ? (
                gifs.map((gif, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectGif(gif)}
                    className="relative rounded-lg overflow-hidden group hover:ring-2 hover:ring-white transition-all cursor-pointer bg-[#222]"
                  >
                    <img
                      src={gif}
                      alt="GIF"
                      loading="lazy"
                      onError={(e) => {
                        // Change to a placeholder if image fails to load
                        const img = e.currentTarget;
                        img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='14' fill='%23888' text-anchor='middle' dominant-baseline='middle'%3E[GIF]%3C/text%3E%3C/svg%3E";
                      }}
                      className="w-full h-auto object-cover group-hover:opacity-75 transition-opacity"
                    />
                  </button>
                ))
              ) : searchQuery && searchQuery !== "trending" ? (
                <div className="col-span-2 md:col-span-3 flex flex-col items-center justify-center h-40 gap-2">
                  <p className="text-sm text-[#888]">No GIFs found for "{searchQuery}"</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      searchGifs("trending");
                    }}
                    className="text-xs text-white px-3 py-1 rounded-lg bg-[#222] hover:bg-[#333] transition-colors"
                  >
                    View Trending
                  </button>
                </div>
              ) : (
                <div className="col-span-2 md:col-span-3 flex items-center justify-center h-40">
                  <p className="text-sm text-[#888]">Loading GIFs...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
