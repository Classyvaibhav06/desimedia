"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        username,
        email,
        password,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setLoading(false);
      setError(payload?.error ?? "Signup failed");
      return;
    }

    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (login?.error) {
      router.push("/auth/login");
      return;
    }

    router.push("/chat");
  }

  async function onGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/chat" });
    setGoogleLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-[#222] bg-[#111] p-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-sm text-[#888] mt-2">
            Join groups, chat in DMs, and share memes instantly.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#eaebec]">Display name</span>
          <input
            className="w-full rounded-lg border border-[#333] bg-[#0a0a0a] text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#eaebec]">Username</span>
          <input
            className="w-full rounded-lg border border-[#333] bg-[#0a0a0a] text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="username"
            required
            minLength={3}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#eaebec]">Email</span>
          <input
            className="w-full rounded-lg border border-[#333] bg-[#0a0a0a] text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#eaebec]">Password</span>
          <input
            className="w-full rounded-lg border border-[#333] bg-[#0a0a0a] text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
            minLength={8}
          />
        </label>

        {error ? <p className="text-sm text-red-500 font-medium">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white text-black px-4 py-3 font-semibold hover:bg-[#eee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#111] text-[#888]">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={googleLoading}
          className="w-full rounded-lg border border-[#333] bg-[#0a0a0a] text-white px-4 py-3 font-semibold hover:border-[#555] hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <p className="text-center text-sm text-[#888]">
          Already have an account?{" "}
          <a href="/auth/login" className="font-semibold text-white hover:text-[#ccc] transition-colors">
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}
