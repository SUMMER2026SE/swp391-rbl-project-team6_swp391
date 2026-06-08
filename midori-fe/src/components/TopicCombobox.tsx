import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check, X } from "lucide-react";

interface TopicComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export function TopicCombobox({ value, onChange, options, placeholder = "Select..." }: TopicComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on input
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Check if input matches existing option
  const inputMatchesOption = options.some(opt => opt.toLowerCase() === inputValue.toLowerCase());

  // Focus input when creating
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setIsCreating(false);
        setInputValue("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setInputValue("");
    setIsCreating(false);
  };

  const handleCreate = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !options.includes(trimmed)) {
      onChange(trimmed);
      setOpen(false);
      setInputValue("");
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setInputValue("");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
          value
            ? "bg-primary/5 border-primary/30 text-primary"
            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-primary/50"
        }`}
      >
        <span className={value ? "text-primary" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          {/* Search / Create input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            {isCreating ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="New topic name..."
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={handleCreate}
                  disabled={!inputValue.trim() || inputMatchesOption}
                  className="p-2 rounded-lg bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setIsCreating(false); setInputValue(""); }}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) {
                    e.preventDefault();
                    if (!inputMatchesOption) {
                      onChange(inputValue.trim());
                      setOpen(false);
                      setInputValue("");
                    }
                  }
                }}
                placeholder="Search or create topic..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            )}
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition ${
                    opt === value
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{opt}</span>
                  {opt === value && <Check className="w-4 h-4" />}
                </button>
              ))
            ) : inputValue.trim() && !inputMatchesOption ? (
              <button
                onClick={() => {
                  onChange(inputValue.trim());
                  setOpen(false);
                  setInputValue("");
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-primary/5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create "<strong>{inputValue.trim()}</strong>"</span>
              </button>
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No topics found
              </div>
            )}
          </div>

          {/* Create new button */}
          {!isCreating && inputValue.trim() && !inputMatchesOption && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/5 transition font-medium"
              >
                <Plus className="w-4 h-4" />
                Create new topic
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
