import React, { useState, useRef, useCallback } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Check, Copy, RefreshCw, ArrowRight, Instagram, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generatePin, PinData } from './services/gemini';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [pinData, setPinData] = useState<PinData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("Classic Luxury");
  const [withModel, setWithModel] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = [
    { name: "Classic Luxury", icon: "✨", desc: "Pure & Minimal" },
    { name: "Golden Hour", icon: "🌅", desc: "Warm & Romantic" },
    { name: "Studio Pro", icon: "📸", desc: "Bold & Sharp" },
    { name: "Editorial", icon: "📖", desc: "Magazine Style" }
  ];

  React.useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        setHasApiKey(true); // Fallback for local dev
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success per guidelines
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setPinData(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setOriginalImage(base64);
      
      try {
        const result = await generatePin(base64, file.type, "", selectedTemplate, withModel);
        setPinData(result);
      } catch (err: any) {
        console.error(err);
        if (err.message?.includes("Requested entity was not found")) {
          setHasApiKey(false);
          setError('API Key session expired. Please select your key again.');
        } else {
          setError('Failed to generate pin. Please try again.');
        }
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fdfcfb] text-[#1a1a1a] font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">DressPin AI</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-black/60">
            <a href="#" className="hover:text-black transition-colors">How it works</a>
            {hasApiKey === false && (
              <button 
                onClick={handleSelectKey}
                className="px-4 py-2 bg-amber-100 text-amber-900 rounded-full hover:bg-amber-200 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Connect API Key
              </button>
            )}
            <a href="#" className="px-4 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-all">Get Started</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* API Key Required Overlay */}
        {hasApiKey === false && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-black/10 p-10 rounded-[2.5rem] shadow-2xl max-w-md text-center"
            >
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-2xl font-medium mb-4 serif italic">API Key Required</h3>
              <p className="text-black/50 mb-8 text-sm leading-relaxed">
                To use the high-quality <strong>Gemini 3.1</strong> image generation, you need to select a paid API key from your Google Cloud project.
                <br /><br />
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-black underline font-medium">Learn about billing</a>
              </p>
              <button 
                onClick={handleSelectKey}
                className="w-full py-4 bg-black text-white rounded-2xl font-medium hover:bg-black/80 transition-all flex items-center justify-center gap-3"
              >
                Select API Key
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
        {/* Hero Section */}
        {!pinData && !isUploading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-light tracking-tight mb-6 serif leading-tight">
              Elevate Your Fashion <br />
              <span className="italic">Into Luxury Content</span>
            </h2>
            <p className="text-black/50 max-w-xl mx-auto text-lg mb-10">
              Transform simple dress photos into professional, high-end Pinterest pins instantly for <span className="text-black font-semibold">Sri Navastra Boutique</span>.
            </p>

            {/* Template Selection */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="flex items-center justify-center gap-2 mb-6 font-semibold uppercase tracking-widest text-[10px] text-black/40">
                <Sparkles className="w-3 h-3" />
                Select Your Style
              </div>
              
              {/* Model Toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <button 
                  onClick={() => setWithModel(true)}
                  className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${
                    withModel 
                      ? 'bg-black text-white shadow-md' 
                      : 'bg-black/5 text-black/40 hover:bg-black/10'
                  }`}
                >
                  Show with Model
                </button>
                <button 
                  onClick={() => setWithModel(false)}
                  className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${
                    !withModel 
                      ? 'bg-black text-white shadow-md' 
                      : 'bg-black/5 text-black/40 hover:bg-black/10'
                  }`}
                >
                  Product Only
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {templates.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTemplate(t.name)}
                    className={`p-4 rounded-2xl border transition-all text-left group ${
                      selectedTemplate === t.name 
                        ? 'border-black bg-black text-white shadow-lg' 
                        : 'border-black/5 bg-white hover:border-black/20'
                    }`}
                  >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{t.icon}</div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className={`text-[10px] ${selectedTemplate === t.name ? 'text-white/60' : 'text-black/40'}`}>
                      {t.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Area */}
            <div 
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="max-w-2xl mx-auto aspect-[16/9] border-2 border-dashed border-black/10 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-black/30 hover:bg-black/[0.02] transition-all group relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-black/40" />
              </div>
              <div className="text-center">
                <p className="font-medium text-lg">Drop your dress photo here</p>
                <p className="text-sm text-black/40">or click to browse from your device</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-center p-6"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-black/5 rounded-full"></div>
                <div className="w-24 h-24 border-4 border-t-black border-r-transparent border-b-transparent border-l-transparent rounded-full absolute top-0 animate-spin"></div>
              </div>
              <h3 className="text-2xl font-medium mb-2">Enhancing Your Pin...</h3>
              <p className="text-black/40 max-w-xs">Our AI is perfecting the lighting, textures, and composition for a luxury finish.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        {pinData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Image Preview */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-black/30 mb-1">Official Pin for</h3>
                <p className="text-xl serif italic font-medium">Sri Navastra Boutique</p>
              </div>
              <div className="bg-white p-4 rounded-[2rem] shadow-2xl shadow-black/5 border border-black/5">
                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-100 relative group">
                  <img 
                    src={pinData.imageUrl} 
                    alt="Enhanced Pin" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = pinData.imageUrl;
                        link.download = 'dresspin-ai-luxury-pin.png';
                        link.click();
                      }}
                      className="px-6 py-3 bg-white text-black rounded-full font-medium hover:scale-105 transition-transform"
                    >
                      Download Pin
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                        <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-black/40 font-medium">Loved by 1.2k+ creators</p>
                </div>
                <button 
                  onClick={() => {
                    setPinData(null);
                    setOriginalImage(null);
                  }}
                  className="flex items-center gap-2 text-sm font-medium hover:text-black/60 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Another
                </button>
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              <div>
                <h2 className="text-3xl font-medium mb-2 italic serif">✨ Your Luxury Pin is Ready ✨</h2>
                <p className="text-black/40">Optimized for Pinterest and Instagram engagement.</p>
              </div>

              {/* Caption */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold uppercase tracking-widest text-[10px] text-black/40">
                    <Pin className="w-3 h-3" />
                    Pinterest Caption
                  </div>
                  <button 
                    onClick={() => copyToClipboard(pinData.caption, 'caption')}
                    className="text-xs font-medium flex items-center gap-1.5 hover:text-black/60 transition-colors"
                  >
                    {copiedField === 'caption' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'caption' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-black/5 text-lg leading-relaxed font-light">
                  {pinData.caption}
                </div>
              </section>

              {/* Hashtags */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold uppercase tracking-widest text-[10px] text-black/40">
                    <Instagram className="w-3 h-3" />
                    15 Targeted Hashtags
                  </div>
                  <button 
                    onClick={() => copyToClipboard(pinData.hashtags.join(' '), 'hashtags')}
                    className="text-xs font-medium flex items-center gap-1.5 hover:text-black/60 transition-colors"
                  >
                    {copiedField === 'hashtags' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'hashtags' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pinData.hashtags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 bg-black/[0.03] rounded-full text-xs font-medium text-black/60 hover:bg-black hover:text-white transition-all cursor-default">
                      {tag}
                    </span>
                  ))}
                </div>
              </section>

              {/* Comments */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 font-semibold uppercase tracking-widest text-[10px] text-black/40">
                  <Sparkles className="w-3 h-3" />
                  8 Suggested Comments
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pinData.comments.map((comment, i) => (
                    <div 
                      key={i} 
                      className="p-4 bg-white rounded-xl border border-black/5 text-sm flex items-center justify-between group"
                    >
                      <span className="text-black/70">{comment}</span>
                      <button 
                        onClick={() => copyToClipboard(comment, `comment-${i}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-black/5 rounded-lg"
                      >
                        {copiedField === `comment-${i}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-black/40" />}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Tweak Input */}
              <section className="pt-6 border-t border-black/5">
                <div className="flex items-center gap-2 font-semibold uppercase tracking-widest text-[10px] text-black/40 mb-4">
                  <RefreshCw className="w-3 h-3" />
                  Tweak this pin
                </div>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const input = (e.target as any).tweak.value;
                    if (!input || !originalImage) return;
                    
                    setIsUploading(true);
                    try {
                      const result = await generatePin(originalImage, 'image/png', input, selectedTemplate, withModel);
                      setPinData(result);
                      (e.target as any).tweak.value = '';
                    } catch (err: any) {
                      if (err.message?.includes("Requested entity was not found")) {
                        setHasApiKey(false);
                        setError('API Key session expired. Please select your key again.');
                      } else {
                        setError('Failed to tweak pin. Please try again.');
                      }
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="relative"
                >
                  <input 
                    name="tweak"
                    type="text" 
                    placeholder="e.g. 'Change background to sunset', 'Add text overlay: Summer Vibes'"
                    className="w-full px-6 py-4 bg-white border border-black/10 rounded-2xl focus:outline-none focus:border-black transition-colors pr-16"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-4 bg-black text-white rounded-xl hover:bg-black/80 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </section>
            </motion.div>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mt-8 p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 opacity-40">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">DressPin AI © 2026</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-medium text-black/40">
            <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-black transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .serif { font-family: 'Playfair Display', serif; }
      `}} />
    </div>
  );
}
