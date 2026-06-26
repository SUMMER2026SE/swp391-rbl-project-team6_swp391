import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DistValue {
  easy: number;
  medium: number;
  hard: number;
}

export function DifficultyDistribution({
  value,
  onChange,
  total,
  available,
}: {
  value: DistValue;
  onChange: (v: DistValue) => void;
  total: number;
  available: { easy: number; medium: number; hard: number };
}) {
  const sum = value.easy + value.medium + value.hard;
  const valid = sum === 100;
  const counts = {
    easy: Math.round((value.easy / 100) * total),
    medium: Math.round((value.medium / 100) * total),
    hard: total - Math.round((value.easy / 100) * total) - Math.round((value.medium / 100) * total),
  };

  const shortages = useMemo(() => {
    const out: { diff: keyof DistValue; required: number; available: number }[] = [];
    (["easy", "medium", "hard"] as const).forEach((d) => {
      if (counts[d] > available[d])
        out.push({ diff: d, required: counts[d], available: available[d] });
    });
    return out;
  }, [counts, available]);

  const set = (k: keyof DistValue, v: number) => {
    onChange({ ...value, [k]: Math.max(0, Math.min(100, v)) });
  };

  const rows: { k: keyof DistValue; label: string; color: string; tone: string }[] = [
    { k: "easy", label: "Easy", color: "bg-success", tone: "text-success" },
    {
      k: "medium",
      label: "Medium",
      color: "bg-warning",
      tone: "text-foreground dark:text-warning",
    },
    { k: "hard", label: "Hard", color: "bg-destructive", tone: "text-destructive" },
  ];

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Difficulty distribution</div>
            <div className="text-xs text-muted-foreground">
              Easy + Medium + Hard must equal 100%.
            </div>
          </div>
          <div
            className={cn(
              "rounded-md px-2 py-1 text-xs font-bold",
              valid ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
            )}
          >
            Total: {sum}%
          </div>
        </div>

        <div className="grid gap-3">
          {rows.map((r) => (
            <div
              key={r.k}
              className="grid grid-cols-[80px_minmax(0,1fr)_auto_auto] items-center gap-3"
            >
              <Label className={cn("font-medium", r.tone)}>{r.label}</Label>
              <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full transition-all", r.color)}
                  style={{ width: `${value[r.k]}%` }}
                />
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={value[r.k]}
                  onChange={(e) => set(r.k, Number(e.target.value) || 0)}
                  className="h-8 w-16 text-center"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <div className="w-20 text-right text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{counts[r.k]}</span> / {available[r.k]}{" "}
                avail
              </div>
            </div>
          ))}
        </div>

        {!valid && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Percentages currently total {sum}%. Adjust so Easy + Medium + Hard equals exactly
              100%.
            </span>
          </div>
        )}

        {valid && shortages.length === 0 && (
          <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Enough questions available in the selected topics. Ready to generate.</span>
          </div>
        )}

        {shortages.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs">
            <div className="mb-1 flex items-center gap-2 font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Not enough questions in the bank
            </div>
            <ul className="ml-5 list-disc text-destructive">
              {shortages.map((s) => (
                <li key={s.diff}>
                  Not enough <b>{s.diff}</b> questions. Required: {s.required} &middot; Available:{" "}
                  {s.available}.
                </li>
              ))}
            </ul>
            <p className="mt-2 text-muted-foreground">
              Please select more topics or reduce the percentage for these difficulties.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function isDistValid(
  v: DistValue,
  total: number,
  avail: { easy: number; medium: number; hard: number },
) {
  const sum = v.easy + v.medium + v.hard;
  if (sum !== 100) return false;
  const e = Math.round((v.easy / 100) * total);
  const m = Math.round((v.medium / 100) * total);
  const h = total - e - m;
  return e <= avail.easy && m <= avail.medium && h <= avail.hard;
}
