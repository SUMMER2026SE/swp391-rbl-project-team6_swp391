import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  X, 
  AlertTriangle, 
  Check, 
  Loader2, 
  Upload, 
  FileText, 
  File, 
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Settings,
  FileUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminAiContentApi,
  type AdminAiContentGenerateResponse,
  type AdminVocabularyAiDraft,
  type AdminGrammarAiDraft,
  type AdminReadingAiDraft,
} from "@/services/adminAiContentService";

interface AdminAiGenerateModalProps {
  open: boolean;
  onClose: () => void;
  skillType: "VOCABULARY" | "GRAMMAR" | "READING";
  currentLevel?: string;
  onApplyDraft: (draft: {
    title: string;
    description: string;
    lessonNumber?: number;
    vocabularyDraft?: AdminVocabularyAiDraft;
    grammarDraft?: AdminGrammarAiDraft;
    readingDraft?: AdminReadingAiDraft;
  }) => void;
}

interface FormData {
  lessonNumber: number;
  lessonTitle: string;
  lessonDescription: string;
  level: string;
  topic: string;
  itemCount: number;
  passageCount: number;
  questionsPerPassage: number;
  difficulty: string;
  passageLength: string;
  grammarTopic: string;
}

interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

const DEFAULT_FORM: FormData = {
  lessonNumber: 1,
  lessonTitle: "",
  lessonDescription: "",
  level: "N5",
  topic: "",
  itemCount: 10,
  passageCount: 1,
  questionsPerPassage: 3,
  difficulty: "Medium",
  passageLength: "Medium",
  grammarTopic: "",
};

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AdminAiGenerateModal({
  open,
  onClose,
  skillType,
  currentLevel = "N5",
  onApplyDraft,
}: AdminAiGenerateModalProps) {
  // Early return must come before all hooks (Rules of Hooks)
  if (!open) return null;

  const [formData, setFormData] = useState<FormData>({
    ...DEFAULT_FORM,
    level: currentLevel.toUpperCase(),
  });
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AdminAiContentGenerateResponse | null>(null);
  
  // Draft editing states
  const [vocabDraft, setVocabDraft] = useState<AdminVocabularyAiDraft | null>(null);
  const [grammarDraft, setGrammarDraft] = useState<AdminGrammarAiDraft | null>(null);
  const [readingDraft, setReadingDraft] = useState<AdminReadingAiDraft | null>(null);
  
  // Collapsible sections
  const [openSections, setOpenSections] = useState({
    lesson: true,
    settings: true,
    document: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft editing states
  const draft = skillType === "VOCABULARY" ? vocabDraft : skillType === "GRAMMAR" ? grammarDraft : readingDraft;

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateForm = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    
    // Validate file type
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 10MB limit");
      return;
    }
    
    setUploadedFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    });
    toast.success(`Selected: ${file.name}`);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = (): boolean => {
    if (!formData.lessonNumber || formData.lessonNumber < 1) {
      toast.error("Please enter a valid lesson number");
      return false;
    }
    if (!formData.lessonTitle.trim()) {
      toast.error("Please enter a lesson title");
      return false;
    }
    const topicToCheck = skillType === "GRAMMAR" ? formData.grammarTopic : formData.topic;
    if (!topicToCheck.trim()) {
      toast.error("Please enter a topic or keywords");
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setResponse(null);

    try {
      // Build the request based on skill type
      const request: Record<string, unknown> = {
        skillType,
        lessonNumber: formData.lessonNumber,
        lessonTitle: formData.lessonTitle,
        lessonDescription: formData.lessonDescription,
        level: formData.level,
        topic: skillType === "GRAMMAR" ? formData.grammarTopic : formData.topic,
      };

      // Add skill-specific fields
      if (skillType === "VOCABULARY" || skillType === "GRAMMAR") {
        request.itemCount = formData.itemCount;
        if (skillType === "GRAMMAR") {
          request.grammarTopic = formData.grammarTopic;
        }
      } else if (skillType === "READING") {
        request.passageCount = formData.passageCount;
        request.questionsPerPassage = formData.questionsPerPassage;
        request.difficulty = formData.difficulty;
        request.passageLength = formData.passageLength;
      }

      const res: AdminAiContentGenerateResponse = await adminAiContentApi.generateContent(
        request as any,
        uploadedFile?.file ?? undefined
      );

      setResponse(res);
      if (res.vocabularyDraft) setVocabDraft(res.vocabularyDraft);
      if (res.grammarDraft) setGrammarDraft(res.grammarDraft);
      if (res.readingDraft) setReadingDraft(res.readingDraft);

      toast.success("AI Content Draft Generated Successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI content.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (skillType === "VOCABULARY" && vocabDraft) {
      onApplyDraft({
        title: vocabDraft.title || formData.lessonTitle,
        description: vocabDraft.description || formData.lessonDescription,
        lessonNumber: formData.lessonNumber,
        vocabularyDraft: vocabDraft,
      });
    } else if (skillType === "GRAMMAR" && grammarDraft) {
      onApplyDraft({
        title: grammarDraft.title || formData.lessonTitle,
        description: grammarDraft.description || formData.lessonDescription,
        lessonNumber: formData.lessonNumber,
        grammarDraft: grammarDraft,
      });
    } else if (skillType === "READING" && readingDraft) {
      onApplyDraft({
        title: readingDraft.title || formData.lessonTitle,
        description: readingDraft.description || formData.lessonDescription,
        lessonNumber: formData.lessonNumber,
        readingDraft: readingDraft,
      });
    }
    toast.success("Applied AI draft to form! Review and click Save when ready.");
    onClose();
  };

  const handleBack = () => {
    setResponse(null);
    setVocabDraft(null);
    setGrammarDraft(null);
    setReadingDraft(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getSkillIcon = () => {
    switch (skillType) {
      case "VOCABULARY":
        return BookOpen;
      case "GRAMMAR":
        return Settings;
      case "READING":
        return FileText;
      default:
        return Sparkles;
    }
  };
  const SkillIcon = getSkillIcon();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-3xl glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator shrink-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
              <SkillIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-primary-col text-base">
                AI Content Generator — {skillType}
              </h2>
              <p className="text-xs text-secondary-col">
                Create structured lesson content with AI assistance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!response ? (
            /* Configure Step - Redesigned Form */
            <div className="space-y-4">
              {/* Section 1: Lesson Information */}
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <button
                  onClick={() => toggleSection("lesson")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/30 hover:bg-[var(--accent)]/50 transition"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-sm text-primary-col">Lesson Information</span>
                  </div>
                  {openSections.lesson ? (
                    <ChevronUp className="w-4 h-4 text-secondary-col" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-secondary-col" />
                  )}
                </button>
                
                {openSections.lesson && (
                  <div className="p-4 space-y-4 bg-[var(--card)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-secondary-col mb-1.5">
                          Lesson Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={formData.lessonNumber}
                          onChange={(e) => updateForm("lessonNumber", parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-secondary-col mb-1.5">
                          JLPT Level <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={formData.level}
                          onChange={(e) => updateForm("level", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        >
                          <option value="N5">N5 (Beginner)</option>
                          <option value="N4">N4 (Elementary)</option>
                          <option value="N3">N3 (Intermediate)</option>
                          <option value="N2">N2 (Upper-Intermediate)</option>
                          <option value="N1">N1 (Advanced)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-secondary-col mb-1.5">
                        Lesson Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lessonTitle}
                        onChange={(e) => updateForm("lessonTitle", e.target.value)}
                        placeholder="e.g. School Life Vocabulary"
                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-secondary-col mb-1.5">
                        Lesson Description
                      </label>
                      <textarea
                        value={formData.lessonDescription}
                        onChange={(e) => updateForm("lessonDescription", e.target.value)}
                        placeholder="Describe what this lesson covers..."
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Generation Settings */}
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <button
                  onClick={() => toggleSection("settings")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/30 hover:bg-[var(--accent)]/50 transition"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-sm text-primary-col">Generation Settings</span>
                  </div>
                  {openSections.settings ? (
                    <ChevronUp className="w-4 h-4 text-secondary-col" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-secondary-col" />
                  )}
                </button>
                
                {openSections.settings && (
                  <div className="p-4 space-y-4 bg-[var(--card)]">
                    {/* Topic field - common to all */}
                    <div>
                      <label className="block text-xs font-semibold text-secondary-col mb-1.5">
                        {skillType === "GRAMMAR" ? "Grammar Topic" : "Topic / Keywords"} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={skillType === "GRAMMAR" ? formData.grammarTopic : formData.topic}
                        onChange={(e) => updateForm(skillType === "GRAMMAR" ? "grammarTopic" : "topic", e.target.value)}
                        placeholder={skillType === "GRAMMAR" ? "e.g. Expressing Permission" : "e.g. School Life, Food, Daily Activities"}
                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>
                    
                    {/* Skill-specific settings */}
                    {skillType !== "READING" ? (
                      <div>
                        <label className="block text-xs font-semibold text-secondary-col mb-1.5">
                          Number of {skillType === "VOCABULARY" ? "Vocabulary Items" : "Grammar Points"}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={formData.itemCount}
                          onChange={(e) => updateForm("itemCount", parseInt(e.target.value) || 10)}
                          className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-secondary-col mb-1.5">
                            Passages
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={formData.passageCount}
                            onChange={(e) => updateForm("passageCount", parseInt(e.target.value) || 1)}
                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-secondary-col mb-1.5">
                            Questions/Passage
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={formData.questionsPerPassage}
                            onChange={(e) => updateForm("questionsPerPassage", parseInt(e.target.value) || 3)}
                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-secondary-col mb-1.5">
                            Difficulty
                          </label>
                          <select
                            value={formData.difficulty}
                            onChange={(e) => updateForm("difficulty", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-secondary-col mb-1.5">
                            Passage Length
                          </label>
                          <select
                            value={formData.passageLength}
                            onChange={(e) => updateForm("passageLength", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                          >
                            <option value="Short">Short</option>
                            <option value="Medium">Medium</option>
                            <option value="Long">Long</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 3: Reference Document */}
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <button
                  onClick={() => toggleSection("document")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/30 hover:bg-[var(--accent)]/50 transition"
                >
                  <div className="flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-sm text-primary-col">Reference Document (Optional)</span>
                  </div>
                  {openSections.document ? (
                    <ChevronUp className="w-4 h-4 text-secondary-col" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-secondary-col" />
                  )}
                </button>
                
                {openSections.document && (
                  <div className="p-4 bg-[var(--card)]">
                    <p className="text-xs text-secondary-col mb-3">
                      Upload a reference document to help generate more relevant content. 
                      Supported: PDF, DOCX, TXT (max 10MB)
                    </p>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                    />
                    
                    {!uploadedFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                          ${isDragging 
                            ? "border-purple-500 bg-purple-500/10" 
                            : "border-[var(--border)] hover:border-purple-500/50 hover:bg-purple-500/5"
                          }
                        `}
                      >
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? "text-purple-400" : "text-secondary-col"}`} />
                        <p className="text-sm text-primary-col font-medium">
                          {isDragging ? "Drop file here" : "Drag & drop or click to upload"}
                        </p>
                        <p className="text-xs text-secondary-col mt-1">
                          PDF, DOCX, TXT • Max 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)]/20 border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                          <File className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-sm font-medium text-primary-col">{uploadedFile.name}</p>
                            <p className="text-xs text-secondary-col">{formatFileSize(uploadedFile.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={removeFile}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-secondary-col hover:text-red-400 transition"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Preview & Edit Draft Step */
            <div className="space-y-6">
              {response.warning && (
                <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-3 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{response.warning}</span>
                </div>
              )}

              {/* Draft Content Views */}
              {skillType === "VOCABULARY" && vocabDraft && (
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-muted-col uppercase tracking-wider">Lesson #</span>
                      <span className="text-sm font-bold text-primary-col">{formData.lessonNumber}</span>
                    </div>
                    <label className="block text-xs text-muted-col mb-1">Draft Lesson Title</label>
                    <input
                      type="text"
                      value={vocabDraft.title}
                      onChange={(e) => setVocabDraft({ ...vocabDraft, title: e.target.value })}
                      className="w-full font-bold text-lg px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                    />
                    <div className="mt-3">
                      <label className="block text-xs text-muted-col mb-1">Description</label>
                      <textarea
                        value={vocabDraft.description || ""}
                        onChange={(e) => setVocabDraft({ ...vocabDraft, description: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col resize-none"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-muted-col tracking-wider">
                      Generated Items ({vocabDraft.items.length})
                    </h3>
                    {vocabDraft.items.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl glass-card space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] text-muted-col">Japanese</label>
                            <input
                              type="text"
                              value={item.japanese}
                              onChange={(e) => {
                                const newItems = [...vocabDraft.items];
                                newItems[idx].japanese = e.target.value;
                                setVocabDraft({ ...vocabDraft, items: newItems });
                              }}
                              className="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-col">Furigana</label>
                            <input
                              type="text"
                              value={item.furigana || ""}
                              onChange={(e) => {
                                const newItems = [...vocabDraft.items];
                                newItems[idx].furigana = e.target.value;
                                setVocabDraft({ ...vocabDraft, items: newItems });
                              }}
                              className="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-col">Meaning</label>
                            <input
                              type="text"
                              value={item.meaning}
                              onChange={(e) => {
                                const newItems = [...vocabDraft.items];
                                newItems[idx].meaning = e.target.value;
                                setVocabDraft({ ...vocabDraft, items: newItems });
                              }}
                              className="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-col">Example Sentence</label>
                          <input
                            type="text"
                            value={item.exampleSentence || ""}
                            onChange={(e) => {
                              const newItems = [...vocabDraft.items];
                              newItems[idx].exampleSentence = e.target.value;
                              setVocabDraft({ ...vocabDraft, items: newItems });
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {skillType === "GRAMMAR" && grammarDraft && (
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-muted-col uppercase tracking-wider">Lesson #</span>
                      <span className="text-sm font-bold text-primary-col">{formData.lessonNumber}</span>
                    </div>
                    <label className="block text-xs text-muted-col mb-1">Draft Lesson Title</label>
                    <input
                      type="text"
                      value={grammarDraft.title}
                      onChange={(e) => setGrammarDraft({ ...grammarDraft, title: e.target.value })}
                      className="w-full font-bold text-lg px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-muted-col tracking-wider">
                      Generated Grammar Points ({grammarDraft.items.length})
                    </h3>
                    {grammarDraft.items.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl glass-card space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-muted-col">Grammar Point</label>
                            <input
                              type="text"
                              value={item.grammarPoint}
                              onChange={(e) => {
                                const newItems = [...grammarDraft.items];
                                newItems[idx].grammarPoint = e.target.value;
                                setGrammarDraft({ ...grammarDraft, items: newItems });
                              }}
                              className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-col">Meaning (Vietnamese)</label>
                            <input
                              type="text"
                              value={item.meaningVietnamese}
                              onChange={(e) => {
                                const newItems = [...grammarDraft.items];
                                newItems[idx].meaningVietnamese = e.target.value;
                                setGrammarDraft({ ...grammarDraft, items: newItems });
                              }}
                              className="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-col">Explanation</label>
                          <textarea
                            value={item.explanation || ""}
                            onChange={(e) => {
                              const newItems = [...grammarDraft.items];
                              newItems[idx].explanation = e.target.value;
                              setGrammarDraft({ ...grammarDraft, items: newItems });
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col resize-none"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {skillType === "READING" && readingDraft && (
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-muted-col uppercase tracking-wider">Lesson #</span>
                      <span className="text-sm font-bold text-primary-col">{formData.lessonNumber}</span>
                    </div>
                    <label className="block text-xs text-muted-col mb-1">Draft Lesson Title</label>
                    <input
                      type="text"
                      value={readingDraft.title}
                      onChange={(e) => setReadingDraft({ ...readingDraft, title: e.target.value })}
                      className="w-full font-bold text-lg px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                    />
                  </div>

                  <div className="space-y-4">
                    {readingDraft.passages.map((p, pIdx) => (
                      <div key={pIdx} className="p-4 rounded-xl glass-card space-y-3">
                        <span className="text-xs font-bold text-emerald-400">Passage {pIdx + 1}</span>
                        <textarea
                          value={p.content}
                          onChange={(e) => {
                            const newP = [...readingDraft.passages];
                            newP[pIdx].content = e.target.value;
                            setReadingDraft({ ...readingDraft, passages: newP });
                          }}
                          className="w-full p-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col min-h-[120px] resize-none"
                        />

                        <div className="space-y-2 mt-2">
                          <h4 className="text-xs font-semibold text-secondary-col">Questions ({p.questions.length})</h4>
                          {p.questions.map((q, qIdx) => (
                            <div key={qIdx} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--accent)]/30 space-y-2">
                              <input
                                type="text"
                                value={q.questionText}
                                onChange={(e) => {
                                  const newP = [...readingDraft.passages];
                                  newP[pIdx].questions[qIdx].questionText = e.target.value;
                                  setReadingDraft({ ...readingDraft, passages: newP });
                                }}
                                className="w-full px-3 py-1.5 text-xs font-medium rounded border border-[var(--border)] bg-[var(--card)] text-primary-col"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t separator glass-surface shrink-0">
          {response ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs font-medium text-secondary-col hover:bg-[var(--accent)] transition"
            >
              ← Back to Settings
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
            >
              Cancel
            </button>

            {!response ? (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-bold shadow-lg shadow-purple-500/25 hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate AI Draft
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Apply Draft to Form
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
