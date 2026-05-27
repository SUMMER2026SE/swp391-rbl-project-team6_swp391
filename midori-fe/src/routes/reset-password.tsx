import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryBtn } from "@/components/auth-shell";
import { useState } from "react";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function strength(p:string){
  let s=0; if(p.length>=8)s++; if(/[A-Z]/.test(p))s++; if(/\d/.test(p))s++; if(/[^A-Za-z0-9]/.test(p))s++;
  return s;
}

function Reset() {
  const [p, setP] = useState(""); const [c, setC] = useState("");
  const s = strength(p);
  const nav = useNavigate();
  const labels=["Too weak","Weak","Okay","Strong","Excellent"];
  const colors=["bg-destructive","bg-jp-red","bg-yellow-500","bg-sky-blue","bg-primary"];
  return (
    <AuthShell title="Create new password" subtitle="Make it strong — at least 8 characters.">
      <form onSubmit={(e)=>{e.preventDefault(); nav({to:"/reset-success"});}} className="space-y-3.5">
        <Field label="New password" type="password" required value={p} onChange={e=>setP(e.target.value)}/>
        <div className="flex gap-1">{[0,1,2,3].map(i=>(
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i<s?colors[s-1]:"bg-muted"}`}/>
        ))}</div>
        <div className="text-xs text-muted-foreground">{p?labels[Math.max(0,s-1)]:"Enter a password"}</div>
        <Field label="Confirm password" type="password" required value={c} onChange={e=>setC(e.target.value)}/>
        {c && c!==p && <div className="text-xs text-destructive">Passwords don't match</div>}
        <PrimaryBtn disabled={!p || p!==c || s<2}>Reset password</PrimaryBtn>
      </form>
    </AuthShell>
  );
}