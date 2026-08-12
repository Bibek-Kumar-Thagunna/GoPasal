"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { GoPasalLogo } from "@/components/brand/GoPasalLogo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/lib/auth";

function formatErr(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const b = e.response?.data as { error?: { message?: string } } | undefined;
    return b?.error?.message ?? e.message;
  }
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

export default function LoginPage() {
  const router = useRouter();
  const { ready, user, loading, signInEmail, signInGoogle } = useAuth();
  const [email, setEmail] = useState("admin@gopasal.com");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signInEmail(email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      setError(formatErr(err));
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gp-navy">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gp-navy">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[12%] top-[-18%] h-[560px] w-[560px] rounded-full bg-sky-500/15 blur-[130px]" />
        <div className="absolute bottom-[-22%] right-[-8%] h-[620px] w-[620px] rounded-full bg-violet-600/14 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-38deg, transparent, transparent 120px, rgba(56,189,248,0.5) 120px, rgba(56,189,248,0.5) 122px)",
          }}
        />
        <div className="bg-grain absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16 xl:max-w-[1100px]">
        <div className="max-w-xl flex-1 pt-8 lg:pt-0">
          <GoPasalLogo className="mb-10" />
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white lg:text-[2.75rem] lg:leading-[1.15]">
            Manage your marketplace with power and precision.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/65">
            Sign in to the admin panel to access and control your platform.
          </p>
          <p className="mt-16 text-[13px] text-white/35">© 2026 GoPasal. All rights reserved.</p>
        </div>

        <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-glass sm:p-10">
          <h2 className="font-display text-2xl font-bold text-white">Admin Sign In</h2>
          <p className="mt-2 text-[14px] text-white/50">Enter credentials or use Secure OTP Login</p>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-[14px]">
            <div className="flex items-center gap-2 text-sky-200">
              <span className="font-semibold">Super Admin:</span> admin@gopasal.com / pass1234
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@gopasal.com");
                setPassword("pass1234");
              }}
              className="rounded-lg bg-sky-500/20 px-2.5 py-1 text-[12px] font-semibold text-sky-200 hover:bg-sky-500/30"
            >
              Fill Demo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-[14px] font-medium text-white/75">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input h-12 w-full px-4 text-[15px]"
                placeholder="admin@gopasal.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-[14px] font-medium text-white/75">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input h-12 w-full px-4 pr-12 text-[15px]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-sky-300 hover:text-sky-200"
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-[14px]">
              <label className="flex cursor-pointer items-center gap-2 text-white/80">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 bg-black/30 text-sky-500 focus:ring-sky-500/40"
                />
                Remember me
              </label>
              <Link href="/verify-otp" className="font-medium text-sky-300 hover:text-sky-200">
                🛡️ Secure Mobile OTP Login
              </Link>
            </div>

            {error ? <p className="text-[14px] text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-gp-blue to-gp-cyan font-display text-[15px] font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <Link href="/verify-otp" className="shrink-0 text-[13px] font-medium text-white/45 transition hover:text-sky-300">
              or OTP Login
            </Link>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <GoogleSignInButton
            disabled={loading}
            onError={(msg) => setError(msg)}
            onCredential={async (idToken) => {
              setError("");
              try {
                await signInGoogle(idToken);
                router.replace("/dashboard");
              } catch (err) {
                setError(formatErr(err));
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
