import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Award,
  Briefcase,
  UserRound,
  X,
  Sparkles,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { publicTeacherApi, PublicTeacherResponse } from "@/lib/api/publicTeacher";
import { Button } from "@/components/ui/button";

export function TeacherTeam() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: false, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })]
  );

  const [teachers, setTeachers] = useState<PublicTeacherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<PublicTeacherResponse | null>(null);

  useEffect(() => {
    publicTeacherApi
      .getActiveTeachers()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setTeachers(list);
      })
      .catch((err) => {
        console.error("Failed to fetch teachers from database:", err);
        setTeachers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  return (
    <section id="teachers" className="py-24 relative overflow-hidden bg-slate-50/70 dark:bg-slate-950/60">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Đội Ngũ Giảng Viên MIDORI
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight">
            Học cùng những giáo viên <span className="text-primary bg-clip-text">tâm huyết nhất</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
            Đội ngũ thầy cô giàu kinh nghiệm, đạt trình độ JLPT N1-N2 với phương pháp truyền đạt dễ hiểu, sẵn sàng hỗ trợ bạn 24/7.
          </p>
        </div>

        {/* Carousel Container */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/60 dark:border-white/5 animate-pulse h-96 flex flex-col justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                </div>
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="bg-white dark:bg-[#0d1020]/90 rounded-3xl p-12 border border-slate-200 dark:border-white/10 shadow-xl text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <UserRound className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Đang cập nhật danh sách giáo viên
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hiện tại chưa có tài khoản giáo viên nào được tạo trong Database Supabase.
            </p>
          </div>
        ) : (
          <div className="relative group">
            <div className="overflow-hidden rounded-3xl p-1" ref={emblaRef}>
              <div className="flex -ml-5">
                {teachers.map((teacher, idx) => {
                  const displayName = teacher.fullName || "Giáo viên MIDORI";
                  const displayTitle = teacher.professionalTitle || "Giáo viên Tiếng Nhật";
                  const avatarInitials = displayName.substring(0, 2).toUpperCase();

                  return (
                    <div
                      key={teacher.id || idx}
                      className="pl-5 min-w-full md:min-w-[50%] lg:min-w-[33.333%] transition-all duration-300"
                    >
                      <div className="bg-white dark:bg-[#0d1020]/90 rounded-3xl p-7 border border-slate-200/70 dark:border-white/10 shadow-lg hover:shadow-2xl hover:border-primary/40 transition-all duration-300 h-full flex flex-col justify-between group/card relative">
                        {/* Top Badge Accent */}
                        <div className="flex items-center justify-between gap-2 mb-6">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Instructor
                          </span>
                          {teacher.teachingLevels && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                              {teacher.teachingLevels}
                            </span>
                          )}
                        </div>

                        {/* Profile Header */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-md border-2 border-primary/20 bg-slate-100 dark:bg-slate-800">
                            {teacher.avatarUrl ? (
                              <img
                                src={teacher.avatarUrl}
                                alt={displayName}
                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10 font-black text-xl">
                                {avatarInitials}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">
                              {displayName}
                            </h3>
                            <p className="text-primary font-bold text-xs mt-0.5 line-clamp-1">
                              {displayTitle}
                            </p>
                            {teacher.yearsOfExperience ? (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 font-medium">
                                <Briefcase className="w-3 h-3 text-slate-400" />
                                <span>{teacher.yearsOfExperience} năm kinh nghiệm</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Info Highlights */}
                        <div className="space-y-2.5 mb-6 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                          {teacher.specializations && (
                            <div className="flex items-start gap-2">
                              <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                              <p className="line-clamp-2">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  Chuyên môn:
                                </span>{" "}
                                {teacher.specializations}
                              </p>
                            </div>
                          )}
                          {teacher.certificates && teacher.certificates.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <p className="line-clamp-1">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  Chứng chỉ:
                                </span>{" "}
                                {teacher.certificates[0].title}
                              </p>
                            </div>
                          )}
                          {teacher.shortBiography && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 pt-1 border-t border-slate-200/50 dark:border-white/5">
                              "{teacher.shortBiography}"
                            </p>
                          )}
                        </div>

                        {/* Action Button */}
                        <Button
                          variant="outline"
                          className="w-full rounded-xl border-primary/30 hover:bg-primary hover:text-white font-bold transition-all text-xs h-10 shadow-sm"
                          onClick={() => setSelectedTeacher(teacher)}
                        >
                          <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                          Xem Hồ Sơ Chi Tiết
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            {teachers.length > 3 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:text-primary transition-colors z-20 hidden md:flex opacity-80 hover:opacity-100 cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:text-primary transition-colors z-20 hidden md:flex opacity-80 hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Teacher Detail Modal */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTeacher(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0f1325] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              <div className="p-6 md:p-8 overflow-y-auto">
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  <div className="w-28 h-28 rounded-3xl bg-slate-800 overflow-hidden shrink-0 mx-auto md:mx-0 shadow-lg border-4 border-slate-800">
                    {selectedTeacher.avatarUrl ? (
                      <img
                        src={selectedTeacher.avatarUrl}
                        alt={selectedTeacher.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10 font-black text-2xl">
                        {(selectedTeacher.fullName || "T").substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Giảng viên MIDORI
                    </div>
                    <h3 className="text-2xl font-black text-white mb-1">
                      {selectedTeacher.fullName || "Giáo viên MIDORI"}
                    </h3>
                    <p className="text-primary font-bold text-base mb-3">
                      {selectedTeacher.professionalTitle || "Giáo viên tiếng Nhật"}
                    </p>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      {selectedTeacher.teachingLevels &&
                        selectedTeacher.teachingLevels.split(",").map((lvl) => (
                          <span
                            key={lvl}
                            className="px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-slate-300"
                          >
                            Cấp độ: {lvl.trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedTeacher.shortBiography && (
                    <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                        Giới thiệu bản thân
                      </h4>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedTeacher.shortBiography}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTeacher.yearsOfExperience ? (
                      <div className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-slate-900/40">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            Kinh nghiệm giảng dạy
                          </h4>
                          <p className="text-sm font-bold text-slate-200">
                            {selectedTeacher.yearsOfExperience} năm
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {selectedTeacher.specializations ? (
                      <div className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-slate-900/40">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            Chuyên môn phụ trách
                          </h4>
                          <p className="text-sm font-bold text-slate-200">
                            {selectedTeacher.specializations}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {selectedTeacher.certificates && selectedTeacher.certificates.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider mb-3 text-slate-400">
                        Chứng chỉ & Bằng cấp
                      </h4>
                      <div className="space-y-3">
                        {selectedTeacher.certificates.map((cert) => (
                          <div
                            key={cert.id}
                            className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-slate-900/30"
                          >
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                              <Award className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{cert.title}</p>
                              <p className="text-xs text-slate-500">{cert.issuer}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
