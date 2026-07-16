import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { useQueryClient } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ArrowLeft, ArrowRight, GraduationCap, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SuccessBanner } from "@/components/teacher/dialogs";
import { LevelBadge } from "@/components/teacher/badges";

export const Route = createFileRoute("/teacher/classes/create")({
  head: () => ({ meta: [{ title: "Create class — MIDORI Teacher" }] }),
  component: CreateClass,
});

const steps = ["Identity", "Level & Schedule", "Capacity", "Review"] as const;

function CreateClass() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [created, setCreated] = useState(false);
  const [form, setForm] = useState({
    name: "",
    jpName: "",
    description: "",
    level: "N5",
    schedule: "",
    startDate: "",
    capacity: 20,
  });

  const handleBack = () => {
    if (step === 0) {
      navigate({ to: "/teacher/classes" });
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  if (created) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <SuccessBanner title="Class created" onDismiss={() => setCreated(false)}>
          {form.name} is ready. You can now invite students and manage the class. Lessons will be assigned automatically based on the class level.
        </SuccessBanner>
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3">
              <LevelBadge level={form.level as any} />
              <div className="font-display text-xl font-semibold">{form.name}</div>
            </div>
            <p className="text-sm text-muted-foreground">{form.description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => navigate({ to: "/teacher/classes" })}>Back to classes</Button>
              <Button variant="outline" onClick={() => navigate({ to: "/teacher/homework/create" })}>Assign Homework</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 2;
    if (step === 1) return true;
    if (step === 2) return form.capacity > 0;
    return true;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Classroom" title="Create a new class" subtitle="Set up a class so you can invite students and track progress. Lessons are assigned automatically by class level." />

      <Card>
        <CardContent className="p-6">
          <ol className="mb-6 flex items-center justify-between gap-2">
            {steps.map((label, i) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-colors",
                    i < step
                      ? "bg-success text-success-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:inline",
                    i === step ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                {i < steps.length - 1 && <div className="ml-2 h-px flex-1 bg-border" />}
              </li>
            ))}
          </ol>

          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Class name *</Label>
                <Input
                  placeholder="e.g. N5 Beginner – Group A"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Japanese name</Label>
                <Input
                  className="font-jp"
                  placeholder="例：初級 N5 グループA"
                  value={form.jpName}
                  onChange={(e) => setForm({ ...form, jpName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  placeholder="What this class covers and who it's for…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>JLPT level *</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start date *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Schedule *</Label>
                <Input
                  placeholder="Mon · Wed · Fri · 18:00–19:30"
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Maximum students *</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 12–22 students for balanced participation.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <LevelBadge level={form.level as any} />
                  <span className="font-display text-lg font-semibold">{form.name}</span>
                </div>
                {form.jpName && (
                  <p className="font-jp mt-1 text-sm text-muted-foreground">{form.jpName}</p>
                )}
                <p className="mt-3 text-sm">
                  {form.description || <em className="text-muted-foreground">No description</em>}
                </p>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Schedule</dt>
                    <dd>{form.schedule}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Start date</dt>
                    <dd>{form.startDate}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Capacity</dt>
                    <dd>{form.capacity} students</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              aria-label={step === 0 ? "Back to My Classes" : "Previous step"}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step === 0 ? "Back to My Classes" : "Back"}
            </Button>
            {step < steps.length - 1 ? (
              <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  try {
                    await classesApi.createClass({
                      name: form.name,
                      level: form.level,
                      maxStudents: form.capacity,
                      description: form.description,
                    });
                    queryClient.invalidateQueries({ queryKey: ["teacherAllClasses"] });
                    toast.success("Class created");
                    setCreated(true);
                  } catch (e) {
                    toast.error("Failed to create class");
                  }
                }}
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                Create class
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
