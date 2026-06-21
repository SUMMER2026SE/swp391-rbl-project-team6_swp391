import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getClasses, getDataBankResources, getDataBankResourceById } from "@/data/teacher-data";
import { LevelBadge } from "@/components/teacher/badges";
import { PreviewSheet, SuccessBanner } from "@/components/teacher/dialogs";
import { ArrowLeft, BookOpen, Library, Save, Send, Eye, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/lessons/create")({
  head: () => ({ meta: [{ title: "Create lesson — MIDORI Teacher" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    classId: typeof s.classId === "string" ? s.classId : undefined,
    source: s.source === "data-bank" ? "data-bank" as const : undefined,
    resourceId: typeof s.resourceId === "string" ? s.resourceId : undefined,
  }),
  component: CreateLesson,
});

function CreateLesson() {
  const navigate = useNavigate();
  const { classId, source: initSource, resourceId } = Route.useSearch();
  const classes = getClasses();
  const lockedClass = classId ? classes.find((c) => c.id === classId) : null;
  const initial = initSource === "data-bank" ? "data-bank" : null;
  const [method, setMethod] = useState<"manual" | "data-bank" | null>(initial);

  if (!method) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader eyebrow="New lesson" title="How do you want to create this lesson?" subtitle="Choose a starting point. You can switch later." />
        <div className="grid gap-4 md:grid-cols-2">
          <MethodCard
            icon={BookOpen}
            title="Manual lesson"
            desc="Write the lesson yourself with full control over content, objectives and materials."
            badge="Editor / Builder"
            onClick={() => setMethod("manual")}
          />
          <MethodCard
            icon={Library}
            title="From Data Bank"
            desc="Pick a ready-made resource created by the Center and attach it to your lesson."
            badge="Picker / Generator"
            onClick={() => setMethod("data-bank")}
          />
        </div>
        {lockedClass && <p className="text-center text-xs text-muted-foreground">Class locked: <b>{lockedClass.name}</b></p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => setMethod(null)} className="-ml-2">
        <ArrowLeft className="mr-1 h-4 w-4" />Change method
      </Button>
      {method === "manual" ? (
        <ManualLesson navigate={navigate} lockedClass={lockedClass} />
      ) : (
        <DataBankLesson navigate={navigate} lockedClass={lockedClass} resourceId={resourceId} />
      )}
    </div>
  );
}

function MethodCard({ icon: Icon, title, desc, badge, onClick }: {
  icon: React.ElementType; title: string; desc: string; badge: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group rounded-2xl border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-md">
      <div className="mb-3 inline-flex items-center gap-2">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-success/15 text-primary group-hover:from-primary group-hover:to-success group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{badge}</span>
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </button>
  );
}

function ManualLesson({ navigate, lockedClass }: {
  navigate: ReturnType<typeof useNavigate>;
  lockedClass: ReturnType<typeof getClasses>[number] | null;
}) {
  const classes = getClasses();
  const [form, setForm] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    level: lockedClass?.level ?? "N5",
    skill: "Grammar",
    title: "",
    jpTitle: "",
    topic: "",
    objective: "",
    content: "",
    materials: "",
    duration: 45,
  });
  const [done, setDone] = useState<"draft" | "published" | null>(null);
  const [preview, setPreview] = useState(false);

  if (done) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <SuccessBanner title={`Lesson ${done === "draft" ? "saved as draft" : "published"}`}>
          {form.title || "Your lesson"} is {done === "draft" ? "saved in your library" : "now available to your class"}.
        </SuccessBanner>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDone(null)}><BookOpen className="mr-2 h-4 w-4" />Create another</Button>
          <Button asChild variant="outline"><Link to="/teacher/lessons">Back to lessons</Link></Button>
        </div>
      </div>
    );
  }

  const valid = form.title.trim().length > 2 && form.objective.trim().length > 5;

  return (
    <div>
      <PageHeader eyebrow="Manual lesson builder" title="Build your lesson" subtitle="Editor mode — full control over content and structure." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Lesson content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Target class</Label>
                {lockedClass ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                    <LevelBadge level={lockedClass.level} />
                    <span className="text-sm">{lockedClass.name}</span>
                    <span className="ml-auto text-[10px] uppercase text-muted-foreground">Locked</span>
                  </div>
                ) : (
                  <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Skill</Label>
                <Select value={form.skill} onValueChange={(v) => setForm({ ...form, skill: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Vocabulary", "Grammar", "Kanji", "Reading", "Listening", "Speaking", "Writing", "Mixed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Lesson title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Te-form Basics" /></div>
            <div className="space-y-2"><Label>Japanese title</Label><Input className="font-jp" value={form.jpTitle} onChange={(e) => setForm({ ...form, jpTitle: e.target.value })} placeholder="例：て形の基本" /></div>
            <div className="space-y-2"><Label>Topic</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Verb conjugation, daily verbs" /></div>
            <div className="space-y-2"><Label>Learning objective *</Label><Textarea rows={2} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="By the end, students can…" /></div>
            <div className="space-y-2"><Label>Main content / outline</Label><Textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Lesson sections, key vocabulary, example sentences…" /></div>
            <div className="space-y-2"><Label>Materials & notes</Label><Textarea rows={3} value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} placeholder="Textbook pp.42–48, handouts, audio files…" /></div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>JLPT level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["N5", "N4", "N3", "N2", "N1"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) || 0 })} /></div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => setPreview(true)} variant="outline"><Eye className="mr-2 h-4 w-4" />Preview lesson</Button>
            <Button className="w-full" variant="outline" disabled={!valid} onClick={() => { toast.success("Draft saved"); setDone("draft"); }}><Save className="mr-2 h-4 w-4" />Save draft</Button>
            <Button className="w-full" disabled={!valid} onClick={() => { toast.success("Lesson published"); setDone("published"); }}><Send className="mr-2 h-4 w-4" />Publish lesson</Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">{valid ? "Ready to save" : "Add title and learning objective to continue"}</p>
        </div>
      </div>

      <PreviewSheet open={preview} onOpenChange={setPreview} title={form.title || "Untitled lesson"} description={form.jpTitle}>
        <div className="space-y-3 text-sm">
          <p><b>Skill:</b> {form.skill} · <b>Level:</b> {form.level} · <b>Duration:</b> {form.duration} min</p>
          <p><b>Objective:</b> {form.objective || <em className="text-muted-foreground">—</em>}</p>
          <div className="rounded-lg border bg-muted/30 p-3 whitespace-pre-wrap text-sm">{form.content || <em className="text-muted-foreground">No content</em>}</div>
        </div>
      </PreviewSheet>
    </div>
  );
}

function DataBankLesson({ navigate, lockedClass, resourceId }: {
  navigate: ReturnType<typeof useNavigate>;
  lockedClass: ReturnType<typeof getClasses>[number] | null;
  resourceId?: string;
}) {
  const classes = getClasses();
  const resources = getDataBankResources();
  const initial = resourceId && getDataBankResourceById(resourceId) ? getDataBankResourceById(resourceId) : null;
  if (resourceId && !initial) toast.warning("Resource not found in Data Bank");
  const [selected, setSelected] = useState<string | null>(initial?.id ?? null);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string>("All");
  const [classIdSel, setClassIdSel] = useState(lockedClass?.id ?? classes[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [objective, setObjective] = useState(initial?.description ?? "");
  const [done, setDone] = useState<"draft" | "published" | null>(null);
  const [previewRes, setPreviewRes] = useState<string | null>(null);

  const filtered = resources.filter((r) =>
    (level === "All" || r.level === level) &&
    (r.title + r.jpTitle + r.type).toLowerCase().includes(q.toLowerCase())
  );
  const res = resources.find((r) => r.id === selected);
  const previewItem = resources.find((r) => r.id === previewRes);

  if (done) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <SuccessBanner title={`Lesson ${done === "draft" ? "saved as draft" : "published"}`}>
          {title || res?.title || "Your lesson"} is {done === "draft" ? "saved in your library" : "now available to your class"}.
        </SuccessBanner>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDone(null)}><BookOpen className="mr-2 h-4 w-4" />Create another</Button>
          <Button asChild variant="outline"><Link to="/teacher/lessons">Back to lessons</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Data Bank · Resource picker" title="Pick a resource, attach it as a lesson" subtitle="Browse the Center's library, preview, and configure." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Choose a resource</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
              </div>
              {["All", "N5", "N4", "N3", "N2", "N1"].map((l) => (
                <Button key={l} size="sm" variant={level === l ? "default" : "outline"} onClick={() => setLevel(l)}>{l}</Button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.map((r) => (
                <div key={r.id} className={cn("relative rounded-lg border p-3 transition-all", selected === r.id ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40")}>
                  <button
                    onClick={() => { setSelected(r.id); if (!title) setTitle(r.title); if (!objective) setObjective(r.description); }}
                    className="block w-full text-left"
                  >
                    <div className="mb-1 flex items-center gap-2"><LevelBadge level={r.level} /><span className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.type}</span></div>
                    <div className="truncate text-sm font-semibold">{r.title}</div>
                    <div className="font-jp text-xs text-muted-foreground">{r.jpTitle}</div>
                  </button>
                  <Button size="sm" variant="ghost" className="mt-2 h-7 px-2" onClick={() => setPreviewRes(r.id)}>
                    <Eye className="mr-1 h-3.5 w-3.5" />Preview
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Attach to lesson</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {res ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Selected resource</div>
                  <div className="font-medium">{res.title}</div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">No resource selected yet</div>
              )}
              <div className="space-y-2">
                <Label>Target class</Label>
                {lockedClass ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                    <LevelBadge level={lockedClass.level} />
                    <span className="text-sm">{lockedClass.name}</span>
                  </div>
                ) : (
                  <Select value={classIdSel} onValueChange={setClassIdSel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2"><Label>Lesson title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Objective</Label><Textarea rows={3} value={objective} onChange={(e) => setObjective(e.target.value)} /></div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            <Button className="w-full" variant="outline" disabled={!res} onClick={() => setPreviewRes(res!.id)}><Eye className="mr-2 h-4 w-4" />Preview lesson</Button>
            <Button className="w-full" variant="outline" disabled={!res || !title} onClick={() => { toast.success("Draft saved"); setDone("draft"); }}><Save className="mr-2 h-4 w-4" />Save draft</Button>
            <Button className="w-full" disabled={!res || !title} onClick={() => { toast.success("Lesson published"); setDone("published"); }}><Sparkles className="mr-2 h-4 w-4" />Publish lesson</Button>
          </div>
        </div>
      </div>

      <PreviewSheet open={!!previewItem} onOpenChange={(o) => !o && setPreviewRes(null)} title={previewItem?.title ?? ""} description={previewItem?.jpTitle}>
        {previewItem && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><LevelBadge level={previewItem.level} /><span className="text-xs text-muted-foreground">{previewItem.type}</span></div>
            <p>{previewItem.description}</p>
            <p className="text-xs text-muted-foreground">⏱ {previewItem.duration} min · ★ {previewItem.rating} · used {previewItem.usage}×</p>
            <Button
              className="w-full"
              onClick={() => { setSelected(previewItem.id); if (!title) setTitle(previewItem.title); if (!objective) setObjective(previewItem.description); setPreviewRes(null); }}
            >
              <BookOpen className="mr-2 h-4 w-4" />Select this resource
            </Button>
          </div>
        )}
      </PreviewSheet>
    </div>
  );
}
