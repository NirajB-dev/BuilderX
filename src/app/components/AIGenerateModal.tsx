import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Loader2, Key, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCanvas, CANVAS_WIDTHS, autoLayout } from '../store/canvasContext';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';

const SYSTEM_PROMPT = `You are a visual website builder assistant. Given a description, output ONLY a valid JSON array of page sections/components.

Available component types and their props:
- navbar: { logo, links (comma-separated string), ctaLabel, background }
- hero: { badge, title (use \\n for line breaks), subtitle, ctaPrimary, ctaSecondary, paddingTop, paddingBottom, textAlign }
- features: { title, subtitle, cardCount (1-6), paddingTop, paddingBottom }
- cta: { title, subtitle, ctaLabel, paddingTop, paddingBottom }
- text: { content, fontSize (8-72), fontWeight ("normal"|"medium"|"semibold"|"bold"), color, textAlign, paddingTop, paddingBottom, paddingLeft, paddingRight }
- button: { label, variant ("primary"|"secondary"|"outline"), size ("sm"|"md"|"lg"), borderRadius, align }
- card: { title, description, background, borderRadius, paddingTop, paddingBottom, paddingLeft, paddingRight }
- form: { title, fields (comma-separated: "Name,Email,Message"), submitLabel, background, borderRadius, paddingTop, paddingBottom, paddingLeft, paddingRight }
- image: { src (use a relevant unsplash URL), alt, height (80-600), objectFit, borderRadius }
- divider: { color, thickness, marginTop, marginBottom }

Rules:
- Always start with a navbar unless told otherwise
- Use 4-8 components total for a complete page
- Use realistic, compelling copy that matches the user's description
- Tailor the tone and content to the use case
- Use reasonable default padding values (paddingTop/Bottom: 48-64 for sections)
- Return ONLY the JSON array, no markdown fences, no explanation

Example output:
[{"type":"navbar","props":{"logo":"Acme","links":"Features,Pricing,About","ctaLabel":"Get Started","background":"rgba(10,10,15,0.8)"}},{"type":"hero","props":{"badge":"✨ Introducing Acme","title":"The smarter way\\nto manage projects","subtitle":"Streamline your workflow with AI-powered task management that actually works.","ctaPrimary":"Start Free Trial","ctaSecondary":"See Demo","paddingTop":80,"paddingBottom":80,"textAlign":"center"}}]`;

const EXAMPLE_PROMPTS = [
  'SaaS landing page for an AI writing tool',
  'Portfolio page for a freelance designer',
  'Product launch page for a mobile app',
  'Agency website for a digital marketing firm',
];

interface Props {
  onClose: () => void;
}

export function AIGenerateModal({ onClose }: Props) {
  const { setNodes, projectName, setProjectName } = useCanvas();
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic-key') ?? '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('anthropic-key'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'building'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    const key = apiKey.trim();
    if (!key) { setShowKeyInput(true); setError('API key required'); return; }

    localStorage.setItem('anthropic-key', key);
    setError('');
    setLoading(true);
    setPhase('thinking');

    try {
      // Small delay for UX effect
      await new Promise(r => setTimeout(r, 600));
      setPhase('building');

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt.trim() }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `API error ${res.status}`);
      }

      const data = await res.json();
      const raw = data.content?.[0]?.text ?? '';

      // Extract JSON even if model wraps it
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Model returned unexpected format. Try again.');

      const items: Array<{ type: string; props: Record<string, any> }> = JSON.parse(jsonMatch[0]);

      const validTypes = items.filter(item => COMPONENT_REGISTRY[item.type]).map(item => item.type);
      if (validTypes.length === 0) throw new Error('No valid components returned. Try rephrasing.');

      const cw = CANVAS_WIDTHS['desktop'];
      const nodes = autoLayout(validTypes, cw).map((node, i) => ({
        ...node,
        props: {
          ...node.props,
          ...items.filter(it => COMPONENT_REGISTRY[it.type])[i]?.props,
        },
      }));

      setNodes(nodes);

      // Update project name from prompt
      const words = prompt.trim().split(' ').slice(0, 4).join(' ');
      setProjectName(words.charAt(0).toUpperCase() + words.slice(1));

      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Check your API key and try again.');
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(5,5,9,0.9)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d12] overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Gradient glow header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-transparent pointer-events-none" />
            <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">AI Layout Generator</h2>
                  <p className="text-xs text-white/45 mt-0.5">Powered by Claude · Describe any page</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Main textarea */}
            <div>
              <label className="text-xs text-white/50 font-mono mb-2 block">Describe your page</label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                placeholder="e.g. A landing page for a SaaS project management tool with a clean, modern design..."
                rows={3}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder:text-white/30 focus:border-blue-500/50 focus:bg-white/8 transition-all outline-none resize-none disabled:opacity-50"
              />
            </div>

            {/* Example prompts */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map(ex => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  disabled={loading}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/80 hover:bg-white/8 transition-all disabled:opacity-40"
                >
                  <ChevronRight className="w-3 h-3" />
                  {ex}
                </button>
              ))}
            </div>

            {/* API Key section */}
            <div>
              <button
                onClick={() => setShowKeyInput(v => !v)}
                className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors font-mono"
              >
                <Key className="w-3 h-3" />
                {showKeyInput ? 'Hide' : 'Anthropic API key'} {apiKey ? '(saved)' : '(required)'}
              </button>
              <AnimatePresence>
                {showKeyInput && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="password"
                      value={apiKey}
                      onChange={e => { setApiKey(e.target.value); setError(''); }}
                      placeholder="sk-ant-..."
                      className="w-full mt-2 h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 font-mono placeholder:text-white/25 focus:border-blue-500/50 focus:bg-white/8 transition-all outline-none"
                    />
                    <p className="text-[10px] text-white/25 mt-1.5 font-mono">
                      Stored locally in your browser · never sent anywhere except Anthropic
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 font-mono">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center gap-3">
            <motion.button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-mono">{phase === 'thinking' ? 'Thinking…' : 'Building layout…'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Layout
                  <span className="text-white/60 text-xs font-mono">⌘↵</span>
                </>
              )}
            </motion.button>
            <button onClick={onClose} className="h-11 px-5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 transition-colors">
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
