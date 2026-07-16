import { useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  Phone,
  Facebook,
  Globe,
  Mail,
  MapPin,
  RefreshCw,
  Award,
  Users,
  Play,
  BookText,
  Star,
  Info,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  CheckCircle,
  Loader2,
  School,
  Bot,
  Map,
  ChartColumn,
  Flame,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/page-ui";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type AdminTeacherResponse } from "@/lib/api/admin";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

// Helper function to get initials from name
function getInitials(name: string | null | undefined): string {
  if (!name) return "TV";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Color palette for teacher avatars
const avatarColors = [
  "from-pink-400 to-rose-500",
  "from-blue-400 to-cyan-500",
  "from-purple-400 to-fuchsia-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-indigo-400 to-violet-500"
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// Teacher Card component
function TeacherCard({ teacher, onClick }: { teacher: AdminTeacherResponse; onClick: () => void }) {
  const initials = getInitials(teacher.displayName);
  const color = getAvatarColor(teacher.id);
  const bio = teacher.bio || "Giáo viên tại Midori Japanese Center với niềm đam mê giảng dạy tiếng Nhật.";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full cursor-pointer"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {teacher.avatarUrl ? (
            <img
              src={teacher.avatarUrl}
              alt={teacher.displayName || "Teacher"}
              className="w-14 h-14 rounded-2xl object-cover shadow-md transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-extrabold text-lg shadow-md transition-transform duration-300 group-hover:scale-105`}>
              {initials}
            </div>
          )}
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base group-hover:text-primary transition-colors">
              {teacher.displayName || teacher.email.split("@")[0]}
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Giáo viên tiếng Nhật</p>
          </div>
        </div>
        
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 line-clamp-3">
          "{bio}"
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500">
        <span className="flex items-center gap-1 text-primary">
          Xem hồ sơ chi tiết →
        </span>
        <span className="flex items-center gap-0.5 text-amber-400">
          <Star className="w-3 h-3 fill-amber-400" />
          <Star className="w-3 h-3 fill-amber-400" />
          <Star className="w-3 h-3 fill-amber-400" />
          <Star className="w-3 h-3 fill-amber-400" />
          <Star className="w-3 h-3 fill-amber-400" />
        </span>
      </div>
    </motion.div>
  );
}

// Loading skeleton for teachers
function TeacherSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-3xl p-6 shadow-sm animate-pulse">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  );
}

// Teacher List component
function TeacherList({ onSelectTeacher }: { onSelectTeacher: (teacher: AdminTeacherResponse) => void }) {
  const { data: teachers = [], isLoading, error } = useQuery({
    queryKey: ["active-teachers"],
    queryFn: () => adminApi.getActiveTeachers(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <>
        {[1, 2, 3].map((i) => (
          <TeacherSkeleton key={i} />
        ))}
      </>
    );
  }

  if (error || teachers.length === 0) {
    return (
      <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
        Hiện tại chưa có giáo viên nào hoạt động. Vui lòng quay lại sau.
      </div>
    );
  }

  return (
    <>
      {teachers.slice(0, 6).map((teacher) => (
        <TeacherCard key={teacher.id} teacher={teacher} onClick={() => onSelectTeacher(teacher)} />
      ))}
    </>
  );
}

// Teacher Profile Modal
function TeacherProfileModal({
  teacher,
  onClose,
}: {
  teacher: AdminTeacherResponse;
  onClose: () => void;
}) {
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["teacher-certificates-landing", teacher.id],
    queryFn: () => adminApi.getTeacherCertificates(teacher.id),
    enabled: !!teacher.id,
  });

  const initials = getInitials(teacher.displayName);
  const color = getAvatarColor(teacher.id);

  return (
    <Dialog open={!!teacher} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl rounded-3xl z-[150] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-0 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Banner area */}
        <div className="h-28 bg-gradient-to-r from-primary via-indigo-600 to-pink-500 relative" />
        
        <div className="px-6 pb-6 relative flex-1 overflow-y-auto">
          {/* Avatar floating */}
          <div className="absolute -top-10 left-6">
            {teacher.avatarUrl ? (
              <img
                src={teacher.avatarUrl}
                alt={teacher.displayName || "Teacher"}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-lg"
              />
            ) : (
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-extrabold text-2xl border-4 border-white dark:border-slate-900 shadow-lg`}>
                {initials}
              </div>
            )}
          </div>

          {/* Name & Title */}
          <div className="pt-12">
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              {teacher.displayName || teacher.email.split("@")[0]}
            </h3>
            <p className="text-xs text-primary font-bold mt-0.5">Giáo viên tiếng Nhật chính thức</p>
          </div>

          {/* Bio section */}
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Giới thiệu bản thân</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
              {teacher.bio || "Giáo viên tiếng Nhật đầy nhiệt huyết tại Midori Japanese Center, cam kết đem lại phương pháp học chủ động, dễ hiểu nhất cho học viên."}
            </p>
          </div>

          {/* Contact & Location info */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-slate-800/20">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground font-semibold uppercase">Email liên hệ</p>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-bold truncate">{teacher.email}</p>
              </div>
            </div>
            {teacher.phone && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-slate-800/20">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground font-semibold uppercase">Số điện thoại</p>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-bold truncate">{teacher.phone}</p>
                </div>
              </div>
            )}
            {teacher.location && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-slate-800/20 sm:col-span-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground font-semibold uppercase">Khu vực giảng dạy</p>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-bold truncate">{teacher.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Certificates section */}
          <div className="mt-6 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Bằng cấp & Chứng chỉ chuyên môn
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-dashed border-slate-200/50 dark:border-white/5">
                Chưa cập nhật thông tin chứng chỉ chuyên môn.
              </div>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40 hover:shadow-xs transition flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">{cert.title}</h5>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Cấp bởi: <strong>{cert.issuer}</strong>
                      </p>
                      {cert.description && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{cert.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StudentLandingPageProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function StudentLandingPage({ onRefresh, isRefreshing }: StudentLandingPageProps) {
  const { user } = useAuth();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<AdminTeacherResponse | null>(null);

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-16 pb-16 bg-slate-50/30 dark:bg-slate-900/10">
      {/* 1. Hero Banner */}
      <section id="hero" className="relative rounded-3xl overflow-hidden min-h-[460px] flex items-center bg-gradient-to-br from-indigo-900 via-slate-900 to-primary text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-pink-500/15 blur-3xl" />
        
        <div className="relative z-10 p-8 md:p-12 max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-pink-200"
          >
            <Sparkles className="w-4.5 h-4.5 text-pink-300 animate-pulse" />
            Chào mừng {user?.name ?? "Học viên"} đến với Midori!
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-display font-black leading-tight tracking-tight text-white"
          >
            Hệ Thống Học Tiếng Nhật <br />
            Thông Minh <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-rose-300 to-indigo-200 font-extrabold">MIDORI</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3 border-l-4 border-pink-500 pl-4 bg-white/5 backdrop-blur-xs py-3 pr-3 rounded-r-xl max-w-2xl"
          >
            <p className="text-sm md:text-base font-semibold text-pink-100">
              Bạn đã đăng nhập thành công nhưng hiện chưa được giáo viên xếp lớp.
            </p>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Hãy liên hệ với giáo viên phụ trách của bạn để được thêm vào lớp học tương ứng. Sau khi được xếp lớp, toàn bộ tài liệu học tập, các bài luyện nói AI và thống kê tiến độ sẽ tự động mở khóa.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="rounded-xl px-6 py-5 bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white font-bold transition shadow-lg shadow-pink-500/25 flex items-center gap-2 cursor-pointer"
            >
              {isRefreshing ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <RefreshCw className="w-4.5 h-4.5" />
              )}
              Kiểm tra lại lớp học
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 2. Platform Ecosystem / Core Modules */}
      <section id="features" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
            Hệ sinh thái học tập
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-800 dark:text-white">
            Các tính năng nổi bật trên MIDORI
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Hệ thống tích hợp đa công cụ mạnh mẽ hỗ trợ tối ưu việc tự học và quản lý lớp học toàn diện.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {[
            {
              title: "Lớp Học Trực Tuyến",
              desc: "Xem thông tin lớp học, theo dõi danh sách bài tập về nhà và các kỳ thi sắp tới do giáo viên của bạn giao.",
              icon: School,
              color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
            },
            {
              title: "Bài Học Ngữ Pháp & Kanji",
              desc: "Học từ vựng qua Flashcard, luyện viết Hán tự trực quan và nắm chắc kiến thức ngữ pháp từ N5 đến N1.",
              icon: BookOpen,
              color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
            },
            {
              title: "Phòng Luyện Nói AI Shadowing",
              desc: "Luyện phát âm theo các đoạn hội thoại thực tế, ghi âm và nhận điểm phân tích đánh giá giọng nói chi tiết từ AI.",
              icon: Sparkles,
              color: "text-pink-500 bg-pink-500/10 border-pink-500/20"
            },
            {
              title: "Hành Trình Học Tập",
              desc: "Lộ trình học trực quan giúp bạn nắm bắt những mục tiêu đã đạt được và các bước tiếp theo cần chinh phục.",
              icon: Map,
              color: "text-purple-500 bg-purple-500/10 border-purple-500/20"
            },
            {
              title: "Thống Kê Tiến Độ Học",
              desc: "Theo dõi số từ vựng, ngữ pháp đã học, duy trì Streak học tập hàng ngày và tích lũy điểm XP rank học tập.",
              icon: ChartColumn,
              color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
            },
            {
              title: "Hỏi Đáp Cùng AI Sensei",
              desc: "Thực hành hội thoại tự do hoặc nhờ AI trợ lý ảo giải thích các cấu trúc ngữ pháp khó 24/7.",
              icon: Bot,
              color: "text-violet-500 bg-violet-500/10 border-violet-500/20"
            }
          ].map((feat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${feat.color}`}>
                  <feat.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Teacher Section */}
      <section id="teachers" className="space-y-6 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
            Đội Ngũ Giảng Viên
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-800 dark:text-white">
            Gặp Gỡ Thầy Cô Tại Midori
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Học tập cùng đội ngũ giảng viên giàu kinh nghiệm. Hãy nhấp vào thẻ giáo viên để xem chi tiết bằng cấp và thông tin liên lạc.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          <TeacherList onSelectTeacher={setSelectedTeacher} />
        </div>
      </section>

      {/* 4. JLPT Study Roadmap */}
      <section id="courses" className="space-y-6 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
            Lộ trình JLPT
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-800 dark:text-white">
            Các cấp độ học tập tiêu chuẩn
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Học tập và làm bài thi thử JLPT theo cấu trúc đề thi chính thức cho mọi cấp độ.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
          {[
            { level: "N5", name: "Sơ cấp 1", desc: "Làm quen với bảng chữ cái Hiragana, Katakana, từ vựng và hội thoại cơ bản nhất." },
            { level: "N4", name: "Sơ cấp 2", desc: "Nâng cao lượng từ vựng, ngữ pháp để giao tiếp tốt trong đời sống hàng ngày." },
            { level: "N3", name: "Trung cấp", desc: "Đọc hiểu văn bản trung cấp, đàm thoại tự tin và nắm các mẫu câu phức tạp." },
            { level: "N2", name: "Thượng cấp 1", desc: "Đọc báo chí, hiểu hội thoại ở tốc độ tự nhiên và làm việc trong môi trường Nhật." },
            { level: "N1", name: "Thượng cấp 2", desc: "Làm chủ tiếng Nhật ở mức độ học thuật sâu sắc và đàm phán thương mại cao cấp." }
          ].map((course, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full relative group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20">
                    JLPT {course.level}
                  </span>
                  <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
                    Khóa giới thiệu
                  </span>
                </div>
                
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">{course.name}</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{course.desc}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                <div className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 select-none">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Sẽ mở sau khi xếp lớp
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* 6. Footer */}
      <footer className="pt-8 border-t border-slate-200 dark:border-white/5 text-center text-xs text-muted-foreground font-semibold">
        <p>&copy; {new Date().getFullYear()} Midori Japanese Center. All rights reserved.</p>
      </footer>

      {/* Teacher Profile Modal */}
      {selectedTeacher && (
        <TeacherProfileModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  );
}
