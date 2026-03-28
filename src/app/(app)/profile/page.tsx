"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

import { ProfileEditor } from "@/components/profile/profile-editor";
import { AvatarUploader } from "@/components/profile/avatar-uploader";

type UserData = {
  displayName: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  followers: number;
  following: number;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/auth/login";
            return;
          }
          throw new Error("Failed to fetch user");
        }
        const data = await res.json();
        setUser({
          displayName: data.user.displayName,
          username: data.user.username,
          email: data.user.email,
          bio: data.user.bio,
          avatarUrl: data.user.avatarUrl,
          followers: data.user._count.followers,
          following: data.user._count.following,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleAvatarUpload = (newAvatarUrl: string) => {
    if (user) {
      setUser({ ...user, avatarUrl: newAvatarUrl });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-black p-4 md:p-8 justify-center items-center gap-4">
        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
        <p className="text-sm text-[#888]">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-black p-4 md:p-8 justify-center items-center gap-4">
        <h1 className="text-xl font-bold text-white">Error</h1>
        <p className="text-sm text-[#ea6a2a]">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-full bg-black p-4 md:p-8 justify-center items-center gap-4">
        <h1 className="text-xl font-bold text-white">Profile not found</h1>
        <p className="text-sm text-[#888]">User account creation is still pending or failed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto p-4 md:p-8 pb-20">
        
        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 md:p-8 rounded-2xl bg-[#111] border border-[#222]">
           <div className="relative">
             <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-gradient-to-tr from-[#222] to-[#333] border-4 border-[#111] text-white flex items-center justify-center text-4xl font-bold shadow-xl">
               {user.avatarUrl ? (
                 <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
               ) : (
                 user.displayName?.charAt(0).toUpperCase() || "U"
               )}
             </div>
             <AvatarUploader 
               onUploadComplete={handleAvatarUpload}
             />
           </div>
           
           <div className="flex-1 min-w-0">
             <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight truncate">
               {user.displayName || user.username}
             </h1>
             <p className="text-sm md:text-base text-[#888] font-medium mt-1 truncate">
               @{user.username}
             </p>
             
             <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#222]/50">
               <div className="flex flex-col items-center sm:items-start">
                 <span className="text-xl font-bold text-white">{user.followers}</span>
                 <span className="text-xs text-[#888] font-medium uppercase tracking-wider">Followers</span>
               </div>
               <div className="flex flex-col items-center sm:items-start">
                 <span className="text-xl font-bold text-white">{user.following}</span>
                 <span className="text-xs text-[#888] font-medium uppercase tracking-wider">Following</span>
               </div>
             </div>
           </div>
        </div>

        {/* Edit Section */}
        <div className="mt-8">
           <div className="flex items-center gap-2 mb-4 px-2">
             <Settings size={18} className="text-[#888]" />
             <h2 className="text-lg font-semibold text-white">Account Info</h2>
           </div>
           <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-[#222]">
             <ProfileEditor 
               initialDisplayName={user.displayName || ""} 
               initialBio={user.bio || ""} 
             />
           </div>
        </div>

      </div>
    </div>
  );
}
