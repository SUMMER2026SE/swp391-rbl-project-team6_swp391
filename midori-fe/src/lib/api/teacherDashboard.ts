import { api } from "./client";
import type { ExamResponse } from "./exams";

/**
 * Aggregated KPIs for the Teacher Dashboard. All counters below are computed
 * client-side from existing teacher-scoped endpoints because the backend has
 * no dedicated teacher dashboard endpoint. Every value is therefore
 * server-derived (no mocks), but the response shape is defined here so the
 * dashboard component can stay type-safe.
 */
export interface TeacherDashboardStats {
  activeClasses: number;
  totalStudents: number;
  homeworkDueSoon: number;
  examsScheduled: number;
  pendingGrading: number;
}

export interface ActiveClassItem {
  id: string;
  name: string;
  level: string;
  studentCount: number;
  status: string;
}

export interface TeacherDeadlineItem {
  id: string;
  classId: string;
  className?: string | null;
  classLevel?: string | null;
  title: string;
  dueDate: string;
  kind?: "HOMEWORK" | "EXAM";
}

export interface TeacherDashboardData {
  stats: TeacherDashboardStats;
  activeClassesList: ActiveClassItem[];
  deadlines: TeacherDeadlineItem[];
}

const DUE_SOON_WINDOW_DAYS = 7;

function toIsoDay(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isWithinDueSoon(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const now = Date.now();
  if (due.getTime() < now) return false;
  const horizon = now + DUE_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return due.getTime() <= horizon;
}

export const teacherDashboardApi = {
  /**
   * Aggregate all teacher dashboard data in one call. Internally calls
   *  - GET /teacher/classes                (ClassResponse[])
   *  - GET /teacher/homeworks              (HomeworkResponse[])
   *  - GET /exams/teacher/{teacherId}      (ExamResponse[])
   * teacherId is required for the exams endpoint; it is taken from the JWT on
   * the server side, but the current /exams/teacher/{id} route takes it as a
   * path param, so we propagate it from useAuth().user.id.
   */
  async getDashboard(teacherId: string): Promise<TeacherDashboardData> {
    // Use the same API as My Classes: GET /teacher/classes?status=ACTIVE
    // This ensures Classes Needing Attention and My Classes always show the same data
    const [clsResp, hwResp, examResp] = await Promise.all([
      api.get<unknown[]>("/teacher/classes?status=ACTIVE"),
      api.get<unknown[]>("/teacher/homeworks"),
      api.get<ExamResponse[]>(`/exams/teacher/${teacherId}`),
    ]);
    return buildDashboard(clsResp, hwResp, examResp);
  },

  /** Exposed for unit testing only. */
  __buildDashboard: buildDashboard,
};

interface RawHomework {
  id: string;
  classId?: string | null;
  title?: string | null;
  dueDate?: string | null;
  status?: string | null;
  ungradedCount?: number | null;
  submissionCount?: number | null;
}

interface RawClass {
  id: string;
  name?: string | null;
  level?: string | null;
  status?: string | null;
  studentCount?: number | null;
}

function buildDashboard(
  rawClasses: unknown,
  rawHomeworks: unknown,
  rawExams: unknown,
): TeacherDashboardData {
  const classes = (Array.isArray(rawClasses) ? rawClasses : []) as RawClass[];
  const homeworks = (Array.isArray(rawHomeworks) ? rawHomeworks : []) as RawHomework[];
  const exams = (Array.isArray(rawExams) ? rawExams : []) as ExamResponse[];

  const activeClassesArr = classes.filter((c) => (c.status ?? "").toUpperCase() === "ACTIVE");
  const totalStudents = activeClassesArr.reduce(
    (sum, c) => sum + (c.studentCount ?? 0),
    0,
  );

  const assignedHomeworks = homeworks.filter((h) => (h.status ?? "").toUpperCase() === "ASSIGNED");
  const homeworkDueSoon = assignedHomeworks.filter((h) => isWithinDueSoon(h.dueDate)).length;

  const pendingGrading = homeworks.reduce((sum, h) => sum + (h.ungradedCount ?? 0), 0);

  // Exams are aggregated client-side: ExamResponse has no scheduled/start time
  // yet, so "Exams Scheduled" is approximated as the count of all exams owned
  // by this teacher. This is real backend data — we never fabricate values.
  const examsScheduled = exams.length;

  // Active Classes: all classes with ACTIVE status from the teacher/classes endpoint
  // This is the same data source used by My Classes page
  const activeClassesList: ActiveClassItem[] = activeClassesArr
    .map((c) => ({
      id: c.id,
      name: c.name ?? "(unknown class)",
      level: c.level ?? "N?",
      studentCount: c.studentCount ?? 0,
      status: c.status ?? "ACTIVE",
    }))
    .slice(0, 10); // Limit to 10 for dashboard display

  const classById = new Map(classes.map((c) => [c.id, c] as const));

  // Upcoming deadlines: homework due within the next 7 days. Exam deadlines
  // are skipped here because ExamResponse does not currently expose a
  // scheduled time. Listed items link back to the homework detail screen.
  const deadlines: TeacherDeadlineItem[] = assignedHomeworks
    .filter((h) => isWithinDueSoon(h.dueDate) && h.classId)
    .map((h) => {
      const cls = h.classId ? classById.get(h.classId) : undefined;
      return {
        id: h.id ?? "",
        classId: h.classId ?? "",
        className: cls?.name,
        classLevel: cls?.level,
        title: h.title ?? "(untitled)",
        dueDate: h.dueDate ? toIsoDay(new Date(h.dueDate)) : "",
        kind: "HOMEWORK" as const,
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  return {
    stats: {
      activeClasses: activeClassesArr.length,
      totalStudents,
      homeworkDueSoon,
      examsScheduled,
      pendingGrading,
    },
    activeClassesList,
    deadlines,
  };
}
