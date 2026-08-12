"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Briefcase,
  Headphones,
  Headset,
  Lock,
  RefreshCw,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { GoPasalLogo } from "@/components/brand/GoPasalLogo";
import { adminSendOtp, adminVerifyOtp } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const OTP_LEN = 6;

function formatErr(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const b = e.response?.data as { error?: { message?: string } } | undefined;
    return b?.error?.message ?? e.message;
  }
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const { ready, user, loading, signInOtp } = useAuth();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LEN).fill(""));
  const [resendSec, setResendSec] = useState(0);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const phone = phoneDigits.startsWith("+977") ? phoneDigits : `+977${phoneDigits}`;

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  useEffect(() => {
    if (resendSec <= 0 || step !== "code") return;
    const id = window.setInterval(() => setResendSec((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendSec, step]);

  const handleSend = async () => {
    setError("");
    const d = phoneDigits.replace(/\D/g, "");
    if (d.length < 10) {
      setError("Enter a valid 10-digit number");
      return;
    }
    try {
      await adminSendOtp(phone);
      setStep("code");
      setOtp(Array(OTP_LEN).fill(""));
      setResendSec(30);
    } catch (e) {
      setError(formatErr(e));
    }
  };

  const otpValue = otp.join("");

  const verify = async () => {
    setError("");
    if (otpValue.length !== OTP_LEN) {
      setError("Enter the 6-digit code");
      return;
    }
    try {
      const res = await adminVerifyOtp(phone, otpValue);
      await signInOtp(res.tokens);
      router.replace("/dashboard");
    } catch (e) {
      setError(formatErr(e));
    }
  };

  const handleDigit = useCallback((i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const n = [...prev];
      n[i] = d;
      return n;
    });
    if (d && i < OTP_LEN - 1) inputRefs.current[i + 1]?.focus();
  }, []);

  const maskedPhone = phone.length > 6 ? `${phone.slice(0, 5)}···${phone.slice(-3)}` : phone;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gp-navy">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gp-navy">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[12%] h-[420px] w-[420px] rounded-full bg-violet-600/14 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[18%] h-[480px] w-[480px] rounded-full bg-sky-500/12 blur-[130px]" />
        <div className="bg-grain absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 pb-14 pt-8 lg:px-10">
        <div className="mb-10 flex justify-between gap-6">
          <GoPasalLogo />
          <a
            href="mailto:support@gopasal.com"
            className="flex items-center gap-2 text-[14px] font-medium text-white/45 hover:text-sky-300"
          >
            <Headphones className="h-4 w-4 text-sky-400/80" /> Need help? Contact Support
          </a>
        </div>

        <div className="grid gap-10 xl:grid-cols-[1fr,minmax(0,440px),1fr] xl:items-start">
          <section className="space-y-6">
            <h1 className="font-display text-3xl font-bold leading-tight text-white lg:text-4xl">
              Secure your{" "}
              <span className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-transparent">
                admin access
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.1] bg-black/30 px-5 py-3.5 text-[14px] text-white/70">
              <span className="text-white/40">OTP to</span>
              <span className="font-mono text-[14px] text-white">{step === "code" ? maskedPhone : "—"}</span>
              {step === "code" ? (
                <button
                  type="button"
                  className="ml-auto font-medium text-sky-300 hover:text-sky-200"
                  onClick={() => setStep("phone")}
                >
                  Change
                </button>
              ) : null}
            </div>

            <ul className="space-y-3 pt-4">
              {[
                {
                  icon: Shield,
                  title: "Two-Factor Authentication",
                  sub: "Extra layer of security",
                },
                { icon: Briefcase, title: "Role-Based Access", sub: "Super Admin privileges" },
                {
                  icon: ShieldCheck,
                  title: "Real-time Protection",
                  sub: "Encrypted & secured",
                },
              ].map((f) => (
                <li
                  key={f.title}
                  className="flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                    <f.icon className="h-5 w-5 text-sky-300" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-white">{f.title}</p>
                    <p className="text-[14px] text-white/45">{f.sub}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3.5 text-[14px] text-emerald-200/95">
              <ShieldCheck className="h-4 w-4" />
              Your session is protected
            </div>
          </section>

          <div className="glass-panel mx-auto w-full max-w-[440px] rounded-3xl p-8 sm:p-9">
            {step === "phone" ? (
              <>
                <Link
                  href="/login"
                  className="mb-6 inline-flex items-center gap-2 text-[14px] font-medium text-sky-300 hover:text-sky-200"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Link>
                <h2 className="font-display text-2xl font-bold text-white">OTP Login</h2>
                <p className="mt-2 text-[14px] text-white/50">
                  Codes are only sent when this number belongs to platform staff.
                </p>
                <div className="mt-8 flex rounded-xl border border-white/12 bg-black/35">
                  <span className="flex items-center px-4 text-[14px] font-medium text-white/60">
                    🇳🇵 +977
                  </span>
                  <input
                    type="tel"
                    className="min-h-[52px] flex-1 bg-transparent px-3 py-3 text-[15px] text-white outline-none"
                    placeholder="98XXXXXXXX"
                    value={phoneDigits}
                    maxLength={10}
                    onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                {error ? <p className="mt-4 text-[14px] text-rose-300">{error}</p> : null}
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={loading}
                  className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-gp-blue to-gp-cyan font-display text-[15px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
                >
                  Send code
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="mb-6 inline-flex items-center gap-2 text-[14px] font-medium text-sky-300 hover:text-sky-200"
                  onClick={() => {
                    setStep("phone");
                    setError("");
                  }}
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <h2 className="font-display text-2xl font-bold text-white">Verify OTP</h2>
                <p className="mt-2 text-[14px] text-white/50">Enter the 6-digit code sent to your phone.</p>

                <div className="mt-8 grid grid-cols-6 gap-2 sm:gap-3">
                  {otp.map((c, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={c}
                      onChange={(e) => handleDigit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
                      }}
                      className="glass-input aspect-square w-full rounded-xl border border-white/[0.12] bg-black/35 text-center font-display text-xl font-semibold tracking-widest"
                    />
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between text-[14px]">
                  <span className="text-white/40">
                    {resendSec > 0 ? `Resend code in 00:${String(resendSec).padStart(2, "0")}` : "You can resend now"}
                  </span>
                  <button
                    type="button"
                    disabled={resendSec > 0 || loading}
                    onClick={() => void handleSend()}
                    className="inline-flex items-center gap-2 font-semibold text-sky-300 disabled:opacity-40 hover:enabled:text-sky-200"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Resend OTP
                  </button>
                </div>

                {error ? <p className="mt-4 text-[14px] text-rose-300">{error}</p> : null}

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void verify()}
                  className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-gp-blue to-gp-cyan font-display text-[15px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
                >
                  Verify & Continue →
                </button>

                <p className="mt-10 flex justify-center gap-2 text-[13px] text-white/40">
                  <Lock className="h-4 w-4 shrink-0" /> Your data is encrypted and secure.
                </p>
              </>
            )}
          </div>

          <section className="space-y-6 xl:flex xl:flex-col xl:items-end">
            <div className="glass-panel relative w-full overflow-hidden rounded-3xl border-sky-500/20 bg-gradient-to-b from-white/[0.06] to-transparent p-10 xl:max-w-[360px]">
              <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
                <div className="absolute inset-0 animate-pulse-soft rounded-full bg-sky-500/20 blur-2xl" />
                <div className="relative flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500/80 to-indigo-600 shadow-2xl shadow-sky-900/50">
                  <ShieldCheck className="h-16 w-16 text-white" strokeWidth={1.5} />
                </div>
                <Headset className="absolute bottom-6 right-2 h-7 w-7 text-white/40" aria-hidden />
                <Lock className="absolute left-4 top-6 h-6 w-6 text-white/35" aria-hidden />
              </div>
              <p className="text-center font-display text-sm font-semibold text-white/70">Integrity checks on every gate</p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[360px]">
              {[
                { label: "99.9% Uptime", sub: "SLA-backed" },
                { label: "256-bit Encryption", sub: "In transit / at rest" },
                { label: "24/7 Monitoring", sub: "Operational health" },
              ].map((b) => (
                <div
                  key={b.label}
                  className="rounded-2xl border border-white/[0.08] bg-black/30 px-5 py-3.5 text-[13px]"
                >
                  <p className="font-semibold text-white">{b.label}</p>
                  <p className="mt-1 text-[12px] text-white/40">{b.sub}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
