/**
 * Chat de retouche : l'utilisatrice décrit ce qui ne va pas dans le rendu
 * (« les manches sont trop longues », « rentre le haut dans le pantalon »…)
 * et l'agent régénère l'image corrigée en conservant la tenue et l'identité.
 */
import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Suggestions rapides pour les corrections les plus fréquentes. */
const QUICK_FIXES = [
  'Rentre le haut dans le pantalon',
  'Les manches sont trop longues',
  'La couleur ne correspond pas',
  'Le vêtement est trop moulant',
  'Montre la tenue en entier, en pied',
];

function Bubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
          isUser
            ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
            : message.error
              ? 'bg-red-500/15 text-red-200'
              : 'bg-white/10 text-white/85'
        )}
      >
        {!isUser && !message.error && (
          <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-pink-300">
            <Sparkles className="h-3 w-3" />
            Styliste
          </span>
        )}
        <p className="whitespace-pre-wrap leading-snug">{message.text}</p>
        {message.image && (
          <img
            src={message.image}
            alt="Version corrigée"
            className="mt-2 w-28 rounded-lg border border-white/15"
          />
        )}
      </div>
    </div>
  );
}

export default function TryOnChat({ messages, onSend, busy, disabled, view, bothViews, onToggleBothViews }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, busy]);

  function submit(event) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || busy || disabled) return;
    setInput('');
    onSend(text);
  }

  function sendQuickFix(text) {
    if (busy || disabled) return;
    onSend(text);
  }

  const viewLabel = view === 'front' ? 'de face' : 'de dos';

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <MessageCircle className="h-4 w-4 text-pink-400" />
          Demander une retouche
        </h2>
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-white/60">
          <input
            type="checkbox"
            checked={bothViews}
            onChange={(e) => onToggleBothViews(e.target.checked)}
            className="h-3.5 w-3.5 accent-pink-500"
          />
          Les deux vues
        </label>
      </header>

      {disabled ? (
        <p className="rounded-xl bg-white/5 px-3 py-2.5 text-xs text-white/50">
          Génère d'abord une tenue : tu pourras ensuite demander des corrections ici.
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-white/50">
            {bothViews
              ? 'La correction sera appliquée aux vues de face et de dos.'
              : `La correction sera appliquée à la vue ${viewLabel} (celle affichée).`}
          </p>

          {messages.length > 0 && (
            <div className="mb-3 max-h-72 space-y-2.5 overflow-y-auto pr-1">
              {messages.map((m) => (
                <Bubble key={m.id} message={m} />
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-2.5 text-sm text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin text-pink-300" />
                    Retouche en cours…
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}

          {/* Suggestions rapides */}
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
            {QUICK_FIXES.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => sendQuickFix(text)}
                disabled={busy}
                className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 disabled:opacity-40"
              >
                {text}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex : le t-shirt doit être plus ample…"
              disabled={busy}
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-pink-400/60 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 text-white disabled:opacity-40"
              aria-label="Envoyer la correction"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
