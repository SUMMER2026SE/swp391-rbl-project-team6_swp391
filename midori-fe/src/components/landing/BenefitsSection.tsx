import { Layers, Target, Bot, Activity, Smartphone, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  {
    title: "Học tập có hệ thống",
    description: "Nội dung được sắp xếp theo trình độ và từng kỹ năng tiếng Nhật.",
    icon: Layers,
    color: "text-blue-500",
    bgClass: "bg-blue-50 dark:bg-blue-500/10"
  },
  {
    title: "Luyện tập toàn diện",
    description: "Hỗ trợ từ vựng, ngữ pháp, đọc hiểu, nghe hiểu và kiểm tra.",
    icon: Target,
    color: "text-emerald-500",
    bgClass: "bg-emerald-50 dark:bg-emerald-500/10"
  },
  {
    title: "Hỗ trợ bằng AI",
    description: "AI Sensei giúp giải thích bài học và hỗ trợ luyện tập.",
    icon: Bot,
    color: "text-pink-500",
    bgClass: "bg-pink-50 dark:bg-pink-500/10"
  },
  {
    title: "Theo dõi tiến độ rõ ràng",
    description: "Kết quả và quá trình học tập được tổng hợp trên dashboard.",
    icon: Activity,
    color: "text-amber-500",
    bgClass: "bg-amber-50 dark:bg-amber-500/10"
  },
  {
    title: "Học mọi lúc, mọi nơi",
    description: "Giao diện phù hợp với máy tính, máy tính bảng và điện thoại.",
    icon: Smartphone,
    color: "text-purple-500",
    bgClass: "bg-purple-50 dark:bg-purple-500/10"
  },
  {
    title: "Kết nối giáo viên và học viên",
    description: "Giáo viên có thể giao bài, quản lý lớp và theo dõi kết quả học tập.",
    icon: Users,
    color: "text-indigo-500",
    bgClass: "bg-indigo-50 dark:bg-indigo-500/10"
  }
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-24 bg-slate-50/50 dark:bg-slate-900/20 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
            Lợi Ích
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-800 dark:text-white mt-4">
            Tại sao nên chọn MIDORI?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200/50 dark:border-white/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", benefit.bgClass)}>
                <benefit.icon className={cn("w-7 h-7", benefit.color)} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
