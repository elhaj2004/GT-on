/**
 * Viewer du rendu d'essayage : loader animé pendant la génération,
 * toggle Face / Dos, bouton d'enregistrement en Favoris.
 */
import { useEffect, useState } from 'react';
import { Heart, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

const LOADING_MESSAGES = [
  'La styliste IA prépare la tenue…',
  'Ajustement des vêtements…',
  'Retouche des plis et des ombres…',
  'Dernier coup de miroir…',
];

function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(
      () => setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length),
      3500
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-violet-950/40 to-pink-950/30">
      <div className="relative">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-white/10 border-t-pink-400" />
        <Sparkles className="absolute inset-0 m-auto h-8 w-8 animate-pulse text-pink-300" />
      </div>
      <p className="animate-pulse px-6 text-center text-sm text-white/70">
        {LOADING_MESSAGES[messageIndex]}
      </p>
    </div>
  );
}

export default function ResultViewer({
  result,
  loading,
  onSaveFavorite,
  onRegenerate,
  saving,
  saved,
  view,
  onViewChange,
}) {
  // Bascule automatiquement sur une vue disponible.
  useEffect(() => {
    if (!result) return;
    if (view === 'front' && !result.front && result.back) onViewChange('back');
    if (view === 'back' && !result.back && result.front) onViewChange('front');
  }, [result, view, onViewChange]);

  if (loading) return <LoadingState />;

  if (!result) {
    return (
      <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 text-center">
        <Sparkles className="h-10 w-10 text-white/30" />
        <p className="text-sm text-white/50">
          Choisis un haut, un bas et des chaussures, puis lance l'essayage pour te voir avec la tenue.
        </p>
      </div>
    );
  }

  const currentImage = view === 'front' ? result.front : result.back;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30">
        {currentImage ? (
          <img
            src={currentImage}
            alt={`Tenue générée — vue de ${view === 'front' ? 'face' : 'dos'}`}
            className="aspect-[3/4] w-full object-contain"
          />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center px-6 text-center text-sm text-white/50">
            Cette vue n'a pas pu être générée.
          </div>
        )}

        {/* Toggle Face / Dos */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 rounded-full border border-white/15 bg-black/60 p-1 backdrop-blur">
          {[
            { id: 'front', label: 'Face' },
            { id: 'back', label: 'Dos' },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewChange(v.id)}
              disabled={!result[v.id]}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40',
                view === v.id
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                  : 'text-white/70'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {result.errors?.length > 0 && (
        <p className="rounded-xl bg-amber-500/15 px-3 py-2 text-xs text-amber-300">
          {result.errors.join(' · ')}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSaveFavorite}
          disabled={saving || saved}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors',
            saved
              ? 'bg-emerald-600/30 text-emerald-300'
              : 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-900/40 disabled:opacity-60'
          )}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn('h-4 w-4', saved && 'fill-current')} />
          )}
          {saved ? 'Enregistrée dans les favoris ✓' : 'Enregistrer la tenue'}
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/20"
          title="Régénérer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
