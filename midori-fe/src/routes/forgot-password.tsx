import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryBtn } from "@/components/auth-shell";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({ component: Forgot });

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const nav = useNavigate();
  return (
    <AuthShell title="Forgot password?" subtitle="Enter your email and we'll send a verification code.">
      {!sent ? (
        <form onSubmit={(e)=>{e.preventDefault(); setSent(true); setTimeout(()=>nav({to:"/verify-otp"}), 1200);}} className="space-y-3.5">
          <Field label="Email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@midori.jp"/>
          <PrimaryBtn>Send reset code</PrimaryBtn>
          <Link to="/login" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary justify-center"><ArrowLeft className="w-3 h-3"/>Back to sign in</Link>
        </form>
      ):(
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 grid place-items-center mx-auto mb-3"><MailCheck className="w-6 h-6 text-primary"/></div>
          <div className="font-display font-bold text-lg">Code sent!</div>
          <div className="text-sm text-muted-foreground mt-1">Check {email} for your verification code.</div>
        </div>
      )}
    </AuthShell>
  );
}