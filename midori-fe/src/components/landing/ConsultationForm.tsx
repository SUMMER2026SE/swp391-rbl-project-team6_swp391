import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Send, CheckCircle2, Loader2, MessageSquareText } from "lucide-react";
import { Logo } from "@/components/logo";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is too short." }),
  phone: z.string().regex(/^[0-9]{9,11}$/, { message: "Invalid phone number." }),
  birthYear: z.string().regex(/^(19|20)\d{2}$/, { message: "Invalid birth year." }),
  email: z.string().email({ message: "Invalid email address." }),
  role: z.string().min(1, { message: "Please select your role." }),
  course: z.string().min(1, { message: "Please select a course." }),
  content: z.string().max(500, { message: "Content must not exceed 500 characters." }).optional(),
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
                Have any other questions?
              </h2>
              <p className="text-lg text-white/80 leading-relaxed max-w-md mb-12">
                Leave your information, and MIDORI will contact and support you as soon as possible.
              </p>
              
              <div className="hidden lg:flex items-center gap-6 mt-auto">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 rounded-full border-2 border-primary bg-indigo-200" />
                  <div className="w-12 h-12 rounded-full border-2 border-primary bg-pink-200" />
                  <div className="w-12 h-12 rounded-full border-2 border-primary bg-emerald-200" />
                </div>
                <div className="text-sm">
                  <p className="font-bold">Support Team</p>
                  <p className="text-white/70">Always ready to support you</p>
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
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Submitted Successfully!</h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-sm">
                    MIDORI has received your information. We will contact you as soon as possible.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("fullName")}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 font-medium">
                        +84
                      </span>
                      <input
                        {...register("phone")}
                        placeholder="Enter your phone number"
                        className="flex-1 px-4 py-3 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Birth Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register("birthYear")}
                        placeholder="e.g. 1999"
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
                        placeholder="Email address"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        You are a
                      </label>
                      <select
                        {...register("role")}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                      >
                         <option value="">Select ▼</option>
                         <option value="Student">Student</option>
                         <option value="University Student">University Student</option>
                         <option value="Working Professional">Working Professional</option>
                         <option value="Teacher">Teacher</option>
                         <option value="Parent">Parent</option>
                         <option value="Other">Other</option>
                      </select>
                      {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Course of Interest <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("course")}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                      >
                        <option value="">Select ▼</option>
                        <option value="Japanese N5 Course">Japanese N5 Course</option>
                        <option value="Japanese N4 Course">Japanese N4 Course</option>
                        <option value="Vocabulary & Grammar Practice">Vocabulary & Grammar Practice</option>
                        <option value="Reading & Listening Practice">Reading & Listening Practice</option>
                        <option value="AI Sensei Practice">AI Sensei Practice</option>
                        <option value="Course for Teachers">Course for Teachers</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      {...register("content")}
                      placeholder="Do you have any questions?&#10;• Let MIDORI know your current level&#10;• Your desired goals"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    />
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                    By submitting this request, you agree to the{" "}
                    <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a> of MIDORI.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Submit Question <Send className="w-4 h-4" />
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
