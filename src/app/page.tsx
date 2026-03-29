'use client';

import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  Send, 
  Copy, 
  RefreshCcw, 
  Check, 
  History as HistoryIcon, 
  Trash2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Terminal,
  MessageCircle,
  BookOpen,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface TranslateResponse {
  translation: string;
  explanation: string;
  notes: {
    term: string;
    explain: string;
  }[];
}

interface HistoryItem {
  id: string;
  text: string;
  style: string;
  model: string;
  result: TranslateResponse;
  timestamp: number;
}

// --- App ---
export default function AiTranslator() {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('technical');
  const [modelName, setModelName] = useState('gemini-2.0-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- Options ---
  const styleOptions = [
    { id: 'technical', label: '专业技术翻译', icon: <Terminal size={14} />, desc: '精准、地道、适合开发者' },
    { id: 'casual', label: '美式口语', icon: <MessageCircle size={14} />, desc: '洛杉矶式 Chill + 俚语风格' },
  ];

  const modelOptions = [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite' },
    { id: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (Latest)' },
    { id: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (Latest)' },
    { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)' },
    { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ];

  // --- Effects ---
  useEffect(() => {
    const saved = localStorage.getItem('ai-translator-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('History parse error', e);
      }
    }
  }, []);

  const saveToHistory = (res: TranslateResponse) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      style,
      model: modelName,
      result: res,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...history].slice(0, 20); // Keep 20 items
    setHistory(updated);
    localStorage.setItem('ai-translator-history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ai-translator-history');
  };

  // --- Handlers ---
  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style, model: modelName }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '翻译失败');

      setResult(data);
      saveToHistory(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, field: string) => {
    navigator.clipboard.writeText(content);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUseHistory = (item: HistoryItem) => {
    setText(item.text);
    setStyle(item.style);
    setModelName(item.model);
    setResult(item.result);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- UI Components ---
  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-indigo-100 selection:text-indigo-600 font-sans antialiased">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-12 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6"
          >
            <Languages size={24} />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">AI 智能翻译官</h1>
          <p className="text-zinc-500 text-base max-w-md text-center">
            精准捕捉语境，自动优化表达。支持专业技术与美式口语风格。
          </p>
        </header>

        <div className="grid gap-8">
          {/* Input Section */}
          <section className="bg-white rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
            <form onSubmit={handleTranslate} className="space-y-6">
              <div className="relative group">
                <textarea
                  placeholder="请输入要翻译的内容 (中/英文)..."
                  className="w-full h-48 px-0 py-0 text-xl border-none focus:ring-0 focus:outline-none placeholder:text-zinc-300 resize-none leading-relaxed bg-transparent"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                />
                <div className="absolute bottom-0 right-0 p-2 text-[10px] text-zinc-300 pointer-events-none uppercase tracking-widest font-bold">
                  Auto Detect
                </div>
              </div>

              <div className="h-[1px] bg-zinc-100 w-full" />

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                {/* Style Select */}
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {styleOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStyle(opt.id)}
                      className={cn(
                        "flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all",
                        style === opt.id 
                          ? "bg-indigo-50 border-indigo-200 ring-4 ring-indigo-50 shadow-sm" 
                          : "bg-white border-zinc-100 hover:border-zinc-200"
                      )}
                    >
                      <div className={cn(
                        "flex items-center gap-2 text-sm font-semibold",
                        style === opt.id ? "text-indigo-600" : "text-zinc-500"
                      )}>
                        {opt.icon}
                        {opt.label}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium">{opt.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Model Select */}
                <div className="md:w-56">
                  <select
                    className="w-full h-full px-4 py-3 rounded-2xl border border-zinc-100 bg-white text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none appearance-none cursor-pointer"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  >
                    {modelOptions.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !text}
                  className={cn(
                    "flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all",
                    isLoading || !text
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-100"
                  )}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="fill-current" />}
                  <span>{isLoading ? 'AI 正在思考...' : '开始翻译'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-14 h-14 flex items-center justify-center rounded-2xl border border-zinc-100 hover:bg-zinc-50 text-zinc-400 transition-all"
                  title="历史记录"
                >
                  <HistoryIcon size={20} />
                </button>
              </div>
            </form>
          </section>

          {/* History Section */}
          <AnimatePresence>
            {showHistory && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-zinc-50 rounded-3xl border border-zinc-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">最近记录</h3>
                    {history.length > 0 && (
                      <button onClick={clearHistory} className="text-xs text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1 font-bold">
                        <Trash2 size={12} /> CLEAR ALL
                      </button>
                    )}
                  </div>
                  {history.length === 0 ? (
                    <div className="text-center py-10 text-zinc-300 text-sm font-medium">暂无历史翻译记录</div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {history.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleUseHistory(item)}
                          className="text-left p-4 rounded-2xl bg-white border border-zinc-100 hover:border-indigo-200 group flex items-start justify-between transition-all"
                        >
                          <div className="overflow-hidden">
                            <div className="text-sm font-bold truncate pr-4">{item.text}</div>
                            <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-1 uppercase tracking-wider font-bold">
                              <span>{item.style}</span>
                              <span className="opacity-20">/</span>
                              <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-zinc-200 group-hover:text-indigo-400 mt-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-sm flex items-center gap-3 font-medium"
            >
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {/* Result Section */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="grid gap-8"
              >
                {/* Translation Card */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={120} className="fill-current" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Result</h3>
                      <button
                        onClick={() => handleCopy(result.translation, 'translation')}
                        className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {copiedField === 'translation' ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold leading-relaxed pr-8">
                      {result.translation}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid md:grid-cols-5 gap-8">
                  {/* Explanation (Column 1-3) */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="flex items-center gap-2 px-2 text-zinc-400">
                      <BookOpen size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest">Why this translation?</h3>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-8">
                      <p className="text-zinc-600 leading-relaxed text-base font-medium">
                        {result.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Notes (Column 4-5) */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 px-2 text-zinc-400">
                      <HistoryIcon size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest">Key Terms</h3>
                    </div>
                    <div className="space-y-3">
                      {result.notes.map((note, idx) => (
                        <div key={idx} className="bg-white border border-zinc-100 rounded-2xl p-5 hover:border-indigo-100 transition-all group">
                          <div className="text-sm font-bold text-zinc-900 mb-1 group-hover:text-indigo-600 transition-colors">{note.term}</div>
                          <div className="text-xs text-zinc-500 leading-normal font-medium">{note.explain}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Regenerate */}
                <div className="pt-6 flex justify-center">
                  <button
                    onClick={() => handleTranslate()}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-4 rounded-full bg-white border border-zinc-200 text-sm font-bold hover:border-zinc-300 hover:bg-zinc-50 transition-all text-zinc-500 active:scale-95 shadow-sm"
                  >
                    <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                    <span>重新生成优化版本</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!result && !isLoading && !error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-zinc-50 rounded-[3rem] border border-dashed border-zinc-200"
            >
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Send size={24} className="text-zinc-200" />
              </div>
              <p className="text-zinc-400 text-sm font-semibold">输入中英文字句，点击翻译开启对话 🌍</p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-10 border-t border-zinc-100 text-center">
          <p className="text-zinc-300 text-[10px] font-black uppercase tracking-[0.3em]">
            AI Multimodal Translator • Powered by Gemini AI
          </p>
        </footer>
      </div>
    </div>
  );
}
