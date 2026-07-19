import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, GraduationCap, Award, Briefcase, UserRound, X } from "lucide-react";
import { publicTeacherApi, PublicTeacherResponse } from "@/lib/api/publicTeacher";
import { Button } from "@/components/ui/button";

export function TeacherTeam() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })]
  );
  
  const [teachers, setTeachers] = useState<PublicTeacherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<PublicTeacherResponse | null>(null);

  useEffect(() => {
    publicTeacherApi.getActiveTeachers()
      .then((res) => {
        setTeachers(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch teachers", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  if (loading) return null; // Or a skeleton

  // Render section even if empty to show the design
  if (teachers.length === 0) {
    return (
      <section id="teachers" className="py-24 relative bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white mb-6">
              Gặp gỡ đội ngũ giáo viên <span className="text-primary">MIDORI</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Đội ngũ giáo viên giàu kinh nghiệm, luôn đồng hành và hỗ trợ bạn trong hành trình chinh phục tiếng Nhật.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-white/10 shadow-xl text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserRound className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Đang cập nhật danh sách giáo viên</h3>
            <p className="text-slate-500">Chưa có giáo viên nào được hiển thị vào lúc này. Vui lòng quay lại sau nhé!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="teachers" className="py-24 relative bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white mb-6">
            Gặp gỡ đội ngũ giáo viên <span className="text-primary">MIDORI</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Đội ngũ giáo viên giàu kinh nghiệm, luôn đồng hành và hỗ trợ bạn trong hành trình chinh phục tiếng Nhật.
          </p>
        </div>

        <div className="relative group">
          <div className="overflow-hidden rounded-3xl" ref={emblaRef}>
            <div className="flex -ml-4">
              {teachers.map((teacher, idx) => (
                <div key={teacher.id || idx} className="pl-4 min-w-full md:min-w-[50%] lg:min-w-[33.333%] transition-all duration-300">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-xl h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                        {teacher.avatarUrl ? (
                          <img src={teacher.avatarUrl} alt={teacher.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200 dark:bg-slate-800">
                            <UserRound className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">{teacher.fullName}</h3>
                        <p className="text-primary font-bold text-sm mb-1">{teacher.professionalTitle || "Giáo viên tiếng Nhật"}</p>
                        {teacher.teachingLevels && (
                          <div className="inline-flex px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {teacher.teachingLevels}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6 flex-1 text-sm text-slate-600 dark:text-slate-400">
                      {teacher.yearsOfExperience && (
                        <p className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span><span className="font-bold text-slate-700 dark:text-slate-200">{teacher.yearsOfExperience} năm</span> kinh nghiệm</span>
                        </p>
                      )}
                      {teacher.specializations && (
                        <p className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-slate-400" />
                          <span className="line-clamp-1" title={teacher.specializations}>Chuyên môn: <span className="font-bold text-slate-700 dark:text-slate-200">{teacher.specializations}</span></span>
                        </p>
                      )}
                      {teacher.certificates && teacher.certificates.length > 0 && (
                        <p className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-slate-400" />
                          <span className="line-clamp-1" title={teacher.certificates.map(c => c.title).join(", ")}>Chứng chỉ: <span className="font-bold text-slate-700 dark:text-slate-200">{teacher.certificates[0].title}</span></span>
                        </p>
                      )}
                    </div>
                    
                    {teacher.shortBiography && (
                      <p className="text-xs text-slate-500 italic mb-6 line-clamp-2">
                        "{teacher.shortBiography}"
                      </p>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold transition-all"
                      onClick={() => setSelectedTeacher(teacher)}
                    >
                      Xem thông tin giáo viên
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav buttons */}
          {teachers.length > 3 && (
            <>
              <button 
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 hover:text-primary transition-colors z-10 hidden md:flex opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 hover:text-primary transition-colors z-10 hidden md:flex opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 overflow-y-auto">
                <button 
                  onClick={() => setSelectedTeacher(null)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  <div className="w-32 h-32 rounded-3xl bg-slate-100 overflow-hidden shrink-0 mx-auto md:mx-0 shadow-lg border-4 border-white dark:border-slate-800">
                    {selectedTeacher.avatarUrl ? (
                      <img src={selectedTeacher.avatarUrl} alt={selectedTeacher.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200 dark:bg-slate-800">
                        <UserRound className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{selectedTeacher.fullName}</h3>
                    <p className="text-primary font-bold text-lg mb-2">{selectedTeacher.professionalTitle || "Giáo viên tiếng Nhật"}</p>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                      {selectedTeacher.teachingLevels && selectedTeacher.teachingLevels.split(',').map(lvl => (
                         <span key={lvl} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                           {lvl.trim()}
                         </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedTeacher.shortBiography && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Giới thiệu bản thân</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedTeacher.shortBiography}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTeacher.yearsOfExperience && (
                      <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Kinh nghiệm giảng dạy</h4>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedTeacher.yearsOfExperience} năm</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedTeacher.specializations && (
                      <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Chuyên môn phụ trách</h4>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedTeacher.specializations}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedTeacher.certificates && selectedTeacher.certificates.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Chứng chỉ & Bằng cấp</h4>
                      <div className="space-y-3">
                        {selectedTeacher.certificates.map(cert => (
                          <div key={cert.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                              <Award className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-white">{cert.title}</p>
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
