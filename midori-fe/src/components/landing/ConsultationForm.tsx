import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Send, CheckCircle2, Loader2, MessageSquareText } from "lucide-react";
import { Logo } from "@/components/logo";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Họ và tên quá ngắn." }),
  phone: z.string().regex(/^[0-9]{9,11}$/, { message: "Số điện thoại không hợp lệ." }),
  birthYear: z.string().regex(/^(19|20)\d{2}$/, { message: "Năm sinh không hợp lệ." }),
  email: z.string().email({ message: "Email không đúng định dạng." }),
  role: z.string().min(1, { message: "Vui lòng chọn vai trò." }),
  course: z.string().min(1, { message: "Vui lòng chọn khóa học." }),
  content: z.string().max(500, { message: "Nội dung không vượt quá 500 ký tự." }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ConsultationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      birthYear: "",
      email: "",
      role: "",
      course: "",
      content: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Form submitted:", data);
    setIsSubmitting(false);
    setIsSuccess(true);
    reset();
    setTimeout(() => setIsSuccess(false), 5000); // Hide success message after 5s
  };

  return (
    <section id="consultation" className="py-24 bg-white dark:bg-slate-950 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-pink-500/20 blur-3xl" />

          <div className="grid lg:grid-cols-2 gap-0 relative z-10">
            {/* Left Column: Text & Graphics */}
            <div className="p-10 lg:p-16 flex flex-col justify-center text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-8 shadow-lg border border-white/20">
                <MessageSquareText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-extrabold mb-4 leading-tight">
                Bạn còn câu hỏi khác?
              </h2>
              <p className="text-lg text-white/80 leading-relaxed max-w-md mb-12">
                Hãy để lại thông tin, MIDORI sẽ liên hệ và hỗ trợ xử lý mọi vướng mắc của bạn trong thời gian sớm nhất.
              </p>
              
              <div className="hidden lg:flex items-center gap-6 mt-auto">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 rounded-full border-2 border-primary bg-indigo-200" />
                  <div className="w-12 h-12 rounded-full border-2 border-primary bg-pink-200" />
                  <div className="w-12 h-12 rounded-full border-2 border-primary bg-emerald-200" />
                </div>
                <div className="text-sm">
                  <p className="font-bold">Đội ngũ CSKH</p>
                  <p className="text-white/70">Luôn sẵn sàng hỗ trợ bạn</p>
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="bg-white dark:bg-slate-900 m-2 lg:m-4 rounded-[2rem] p-8 lg:p-10 shadow-xl">
              {isSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12 animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Gửi thành công!</h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-sm">
                    MIDORI đã nhận được thông tin của bạn. Chúng tôi sẽ liên hệ trong thời gian sớm nhất.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("fullName")}
                      placeholder="Nhập họ và tên của bạn"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 font-medium">
                        +84
                      </span>
                      <input
                        {...register("phone")}
                        placeholder="Nhập số điện thoại của bạn"
                        className="flex-1 px-4 py-3 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Năm sinh <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register("birthYear")}
                        placeholder="VD: 1999"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                      {errors.birthYear && <p className="text-red-500 text-xs mt-1">{errors.birthYear.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register("email")}
                        placeholder="Địa chỉ email"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Bạn là
                      </label>
                      <select
                        {...register("role")}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                      >
                        <option value="">Lựa chọn ▼</option>
                        <option value="Học sinh">Học sinh</option>
                        <option value="Sinh viên">Sinh viên</option>
                        <option value="Người đi làm">Người đi làm</option>
                        <option value="Giáo viên">Giáo viên</option>
                        <option value="Phụ huynh">Phụ huynh</option>
                        <option value="Khác">Khác</option>
                      </select>
                      {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Khóa học quan tâm <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("course")}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                      >
                        <option value="">Lựa chọn ▼</option>
                        <option value="Khóa học tiếng Nhật N5">Khóa học tiếng Nhật N5</option>
                        <option value="Khóa học tiếng Nhật N4">Khóa học tiếng Nhật N4</option>
                        <option value="Luyện từ vựng và ngữ pháp">Luyện từ vựng và ngữ pháp</option>
                        <option value="Luyện đọc và nghe">Luyện đọc và nghe</option>
                        <option value="Luyện tập cùng AI Sensei">Luyện tập cùng AI Sensei</option>
                        <option value="Khóa học dành cho giáo viên">Khóa học dành cho giáo viên</option>
                        <option value="Khác">Khác</option>
                      </select>
                      {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nội dung
                    </label>
                    <textarea
                      {...register("content")}
                      placeholder="Bạn có câu hỏi gì?&#10;• Hãy cho MIDORI biết trình độ hiện tại&#10;• Mục tiêu mong muốn"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    />
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                    Bằng việc gửi đăng ký nhận tư vấn, bạn đã đồng ý với{" "}
                    <a href="#" className="text-primary hover:underline font-medium">Chính sách bảo mật thông tin</a> của MIDORI.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        Gửi câu hỏi <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
