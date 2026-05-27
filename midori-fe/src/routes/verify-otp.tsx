import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, PrimaryBtn } from "@/components/auth-shell";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/verify-otp")({ component: Otp });

function Otp() {
  const [code, setCode] = useState<string[]>(["","","","","",""]);
  const refs = useRef<(HTMLInputElement|null)[]>([]);
  const [seconds, setSeconds] = useState(60);
  const nav = useNavigate();

  useEffect(()=>{ if(seconds<=0)return; const t=setInterval(()=>setSeconds(s=>s-1),1000); return ()=>clearInterval(t);},[seconds]);

  const setAt = (i:number, v:string)=>{
    if(!/^\d?$/.test(v))return;
    const next=[...code]; next[i]=v; setCode(next);
    if(v && i<5) refs.current[i+1]?.focus();
  };

  return (
    <AuthShell title="Verify your email" subtitle="Enter the 6-digit code we just sent.">
      <form onSubmit={(e)=>{e.preventDefault(); nav({to:"/reset-password"});}} className="space-y-5">
        <div className="flex justify-between gap-2">
          {code.map((c,i)=>(
            <input key={i} ref={(el)=>{refs.current[i]=el;}} value={c} onChange={e=>setAt(i,e.target.value)} maxLength={1} inputMode="numeric"
              className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 outline-none focus:ring-2 focus:ring-primary/50"/>
          ))}
        </div>
        <div className="text-center text-xs text-muted-foreground">
          {seconds>0 ? <>Resend code in <span className="font-semibold text-foreground">0:{seconds.toString().padStart(2,"0")}</span></>
            : <button type="button" onClick={()=>setSeconds(60)} className="text-primary font-semibold">Resend code</button>}
        </div>
        <PrimaryBtn disabled={code.some(c=>!c)}>Verify code</PrimaryBtn>
      </form>
    </AuthShell>
  );
}