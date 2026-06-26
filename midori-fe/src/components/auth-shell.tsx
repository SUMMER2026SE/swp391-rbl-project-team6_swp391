import { Link } from "@tanstack/react-router";
import { SakuraBg } from "./sakura-bg";
import { Logo } from "./logo";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <SakuraBg count={16} />
      {/* Left visual panel */}
      <div className="hidden lg:flex relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-hero opacity-95" />
        <div
          className="absolute inset-6 rounded-[2.5rem] opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, white 1.5px, transparent 1.5px), radial-gradient(circle at 70% 60%, white 1.5px, transparent 1.5px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Decorative floating card */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-12 w-40 h-24 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-2xl font-bold font-display text-white">N5–N1</div>
            <div className="text-xs text-white/80 mt-0.5">JLPT Ready</div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-24 right-10 w-36 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-2xl font-bold font-display text-white">AI</div>
            <div className="text-xs text-white/80 mt-0.5">Shadowing</div>
          </div>
        </motion.div>

        <div className="relative text-white max-w-md">
          <h2 className="text-[2.6rem] font-extrabold font-display leading-[1.1] tracking-tight">
            Learn Japanese the{" "}
            <span className="relative inline-block">
              <span className="relative z-10">smart</span>
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-white/30 rounded" />
            </span>{" "}
            way 🌸
          </h2>
          <p className="mt-4 text-white/85 leading-relaxed text-base">
            AI shadowing, listening dictation, grammar lessons and JLPT exam prep — all in one
            elegant platform.
          </p>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="mt-12 p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/20"
          >
            <div className="text-[10px] uppercase tracking-widest opacity-80 font-semibold">
              Featured grammar
            </div>
            <div className="font-display font-bold text-3xl mt-2">〜たことがあります</div>
            <div className="text-sm opacity-85 mt-1.5 leading-relaxed">
              "have the experience of doing something"
            </div>
          </motion.div>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { num: "50K+", label: "Students" },
              { num: "500+", label: "Lessons" },
              { num: "N5–N1", label: "All Levels" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-extrabold font-display">{s.num}</div>
                <div className="text-xs text-white/70 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-md glass rounded-3xl p-8 md:p-10"
        >
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 hover:scale-[1.01]"
          >
            <Logo size={44} />
            <span className="font-display font-extrabold text-2xl tracking-[0.12em] text-foreground transition-colors duration-200 group-hover:text-primary/90">
              MIDORI
            </span>
          </Link>

          <div className="mt-5 text-center">
            <h1 className="mx-auto w-full whitespace-nowrap text-center text-3xl md:text-4xl font-extrabold font-display leading-tight tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
                {subtitle}
              </p>
            )}
          </div>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-7 text-sm text-center">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}

export function Field({
  label,
  endAdornment,
  className,
  ...props
}: {
  label: string;
  endAdornment?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">{label}</span>
      <div className="relative">
        <input
          {...props}
          className={
            "mt-1.5 w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 text-sm transition-all pr-12" +
            (className ? " " + className : "")
          }
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">{endAdornment}</div>
        )}
      </div>
    </label>
  );
}

export function PrimaryBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full px-4 py-3.5 rounded-xl bg-gradient-hero text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export function GoogleBtn({
  onSuccess,
  onError,
  disabled,
}: {
  onSuccess: (credential: string) => void;
  onError?: (error: Error | null) => void;
  disabled?: boolean;
}) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-border font-semibold text-sm flex items-center justify-center gap-3 text-gray-400 cursor-not-allowed"
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.3 0-11.5-5.2-11.5-11.5S17.7 12.5 24 12.5c2.9 0 5.5 1.1 7.5 2.9l5.7-5.7C33.5 6.5 28.9 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.5 1.1 7.5 2.9l5.7-5.7C33.5 6.5 28.9 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 43.5c4.8 0 9.2-1.8 12.5-4.8l-5.8-4.9C28.9 35.4 26.6 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.3 43.5 24 43.5z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l5.8 4.9C40.1 35.6 43.5 30.2 43.5 24c0-1.2-.1-2.4-.4-3.5z"
          />
        </svg>
        Google not configured
      </button>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) {
              onSuccess(response.credential);
            }
          }}
          onError={() => {
            if (onError) onError(null);
          }}
          useOneTap={false}
          theme="outline"
          size="large"
          text="signin_with"
          shape="rectangular"
          logo_alignment="left"
        />
      </div>
    </div>
  );
}
