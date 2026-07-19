import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const slides = [
  {
    title: "Theo dõi hành trình học tập",
    description: "Xem mục tiêu học tập hằng ngày, chuỗi ngày học, bài học gần đây và tiến độ tổng thể trên cùng một màn hình.",
    benefit: "Giúp người học biết mình đã hoàn thành những gì và nên tiếp tục học nội dung nào.",
    btnText: "Bắt đầu học",
    link: "/login?redirect=/student",
    imageClass: "bg-indigo-100 dark:bg-indigo-900/30",
    label: "Student Dashboard"
  },
  {
    title: "Học từ vựng và ngữ pháp theo trình độ",
    description: "Các bài học được sắp xếp theo cấp độ và chủ đề, giúp người học lựa chọn nội dung phù hợp.",
    benefit: "Học có hệ thống, dễ ôn tập và tránh học lan man.",
    btnText: "Khám phá bài học",
    link: "/login?redirect=/student/vocabulary",
    imageClass: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "Vocabulary & Grammar"
  },
  {
    title: "Phát triển kỹ năng đọc và nghe",
    description: "Luyện đọc hiểu, nghe hiểu và trả lời câu hỏi trực tiếp trên hệ thống MIDORI.",
    benefit: "Giúp người học cải thiện khả năng hiểu tiếng Nhật thông qua các bài luyện tập thực tế.",
    btnText: "Luyện tập ngay",
    link: "/login?redirect=/student/reading",
    imageClass: "bg-sky-100 dark:bg-sky-900/30",
    label: "Reading & Listening"
  },
  {
    title: "Học tập cùng AI Sensei",
    description: "Đặt câu hỏi, luyện hội thoại, giải thích từ vựng, ngữ pháp và tạo bài luyện tập theo nhu cầu.",
    benefit: "Người học có một trợ lý hỗ trợ trong quá trình học tập.",
    btnText: "Trải nghiệm AI Sensei",
    link: "/login?redirect=/student/ai-sensei",
    imageClass: "bg-pink-100 dark:bg-pink-900/30",
    label: "AI Sensei"
  },
  {
    title: "Luyện tập và theo dõi sự tiến bộ",
    description: "Thực hiện các bài kiểm tra, xem kết quả và nhận biết những kỹ năng cần cải thiện.",
    benefit: "Giúp người học đánh giá khả năng và điều chỉnh kế hoạch học tập phù hợp.",
    btnText: "Xem tiến độ",
    link: "/login?redirect=/student/progress",
    imageClass: "bg-amber-100 dark:bg-amber-900/30",
    label: "Quiz & Progress"
  },
  {
    title: "Quản lý lớp học thuận tiện",
    description: "Giáo viên có thể tạo lớp, quản lý học viên, giao bài tập, tạo đề kiểm tra và theo dõi kết quả.",
    benefit: "Giảm thời gian quản lý thủ công và dễ dàng kiểm soát tiến độ của từng lớp học.",
    btnText: "Dành cho giáo viên",
    link: "/login?redirect=/teacher",
    imageClass: "bg-purple-100 dark:bg-purple-900/30",
    label: "Teacher Dashboard"
  }
];

export function FeatureSlideshow() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      emblaApi.plugins().autoplay?.reset();
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      emblaApi.plugins().autoplay?.reset();
    }
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
      emblaApi.plugins().autoplay?.reset();
    }
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section id="features" className="py-24 bg-slate-50/50 dark:bg-slate-900/20 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
            Khám Phá Giao Diện
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-800 dark:text-white mt-4">
            Mọi thứ bạn cần trên một nền tảng
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Vuốt hoặc sử dụng mũi tên để xem trước các màn hình chức năng của hệ thống.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Carousel Viewport */}
          <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200/60 dark:border-white/5" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {slides.map((slide, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div key={index} className="flex-[0_0_100%] min-w-0">
                    <div className={cn(
                      "flex flex-col md:flex-row h-full",
                      !isEven && "md:flex-row-reverse"
                    )}>
                      {/* Text Side */}
                      <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                        <div className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">
                          {slide.label}
                        </div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mb-4 leading-tight">
                          {slide.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm md:text-base leading-relaxed">
                          {slide.description}
                        </p>
                        
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 mb-8 border border-slate-100 dark:border-white/5">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">💡 Lợi ích:</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{slide.benefit}</p>
                        </div>
                        
                        <div>
                          <Link
                            to={slide.link}
                            className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                          >
                            {slide.btnText}
                          </Link>
                        </div>
                      </div>

                      {/* Image/Mockup Side */}
                      <div className={cn("flex-1 p-6 md:p-10 flex items-center justify-center", slide.imageClass)}>
                        <div className="w-full aspect-[4/3] max-w-md bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
                          {/* Fake Browser Bar */}
                          <div className="h-8 bg-slate-100 dark:bg-slate-900 flex items-center px-4 gap-1.5 border-b border-slate-200 dark:border-white/5">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                          </div>
                          {/* Feature-specific mockups instead of screenshots */}
                          <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex flex-col relative overflow-hidden">
                             {/* Small dot pattern background */}
                             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '12px 12px' }} />
                             
                             <div className="relative z-10 w-full h-full flex flex-col p-4 gap-3">
                               {index === 0 && (
                                 // Dashboard mock
                                 <>
                                   <div className="flex gap-2">
                                     <div className="flex-1 h-16 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col justify-center px-3">
                                        <div className="w-1/2 h-2 bg-slate-200 dark:bg-slate-700 rounded mb-2"/>
                                        <div className="w-1/3 h-4 bg-primary/40 rounded"/>
                                     </div>
                                     <div className="flex-1 h-16 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col justify-center px-3">
                                        <div className="w-1/2 h-2 bg-slate-200 dark:bg-slate-700 rounded mb-2"/>
                                        <div className="w-1/3 h-4 bg-amber-400/40 rounded"/>
                                     </div>
                                   </div>
                                   <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
                                      <div className="flex items-center gap-2 mb-3">
                                         <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] text-emerald-600 font-bold">N5</div>
                                         <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[45%]" />
                                         </div>
                                      </div>
                                      <div className="space-y-2 mt-4">
                                         <div className="h-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex items-center px-2">
                                            <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                                            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded ml-2" />
                                         </div>
                                      </div>
                                   </div>
                                 </>
                               )}
                               {index === 1 && (
                                 // Vocab / Grammar mock
                                 <>
                                   <div className="h-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 p-4 flex flex-col items-center justify-center">
                                      <span className="text-5xl font-japanese text-primary">学生</span>
                                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">Học sinh (Gakusei)</span>
                                   </div>
                                   <div className="flex-1 grid grid-cols-2 gap-2">
                                      <div className="bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs border border-primary/20">Flashcard</div>
                                      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center text-xs font-bold text-slate-400">Kiểm tra</div>
                                   </div>
                                 </>
                               )}
                               {index === 2 && (
                                 // Reading / Listening mock
                                 <>
                                   <div className="h-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 p-3 flex gap-3">
                                      <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center text-xl">🎧</div>
                                      <div className="flex-1 flex flex-col justify-center gap-1.5">
                                         <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                                         <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full w-full overflow-hidden">
                                           <div className="h-full w-1/3 bg-sky-500" />
                                         </div>
                                      </div>
                                   </div>
                                   <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 p-4 space-y-2">
                                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded" />
                                      <div className="h-2 w-5/6 bg-slate-100 dark:bg-slate-700 rounded" />
                                      <div className="h-2 w-4/6 bg-slate-100 dark:bg-slate-700 rounded" />
                                   </div>
                                 </>
                               )}
                               {index === 3 && (
                                 // AI Sensei mock
                                 <>
                                   <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 p-3 flex flex-col gap-2">
                                      <div className="self-end bg-primary text-white text-[10px] py-1.5 px-3 rounded-t-xl rounded-bl-xl max-w-[80%] shadow-sm">
                                         Từ "Gakusei" nghĩa là gì ạ?
                                      </div>
                                      <div className="self-start bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] py-1.5 px-3 rounded-t-xl rounded-br-xl max-w-[80%] shadow-sm">
                                         "Gakusei" (学生) nghĩa là học sinh, sinh viên nhé!
                                      </div>
                                   </div>
                                   <div className="h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center px-3 gap-2">
                                      <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full" />
                                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] text-white">➤</div>
                                   </div>
                                 </>
                               )}
                               {index >= 4 && (
                                 // Generic mock for others
                                 <>
                                   <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 p-4 flex flex-col justify-between">
                                      <div className="flex justify-between items-center">
                                         <div className="w-16 h-16 rounded-full border-4 border-amber-400 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-white">85%</div>
                                         <div className="space-y-2">
                                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded" />
                                            <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded" />
                                         </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mt-4">
                                         <div className="h-10 bg-slate-50 dark:bg-slate-900/50 rounded-lg" />
                                         <div className="h-10 bg-slate-50 dark:bg-slate-900/50 rounded-lg" />
                                      </div>
                                   </div>
                                 </>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={scrollPrev}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    index === selectedIndex 
                      ? "bg-primary w-6" 
                      : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={scrollNext}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
