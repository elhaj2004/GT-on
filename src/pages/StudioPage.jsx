/**
 * Studio d'Essayage : 3 carrousels (Haut, Bas, Chaussures), génération du
 * rendu par Gemini (face + dos), viewer de résultat et tenues favorites.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, Trash2, WandSparkles } from 'lucide-react';
import { CATEGORIES, categoryLabel } from '../lib/utils';
import { useCloset } from '../context/ClosetContext';
import { generateOutfit, hasApiKey } from '../services/geminiService';
import CarouselPicker from '../components/tryon/CarouselPicker';
import ResultViewer from '../components/tryon/ResultViewer';

function FavoriteCard({ outfit, onDelete }) {
  const [view, setView] = useState(outfit.frontImage ? 'front' : 'back');
  const image = view === 'front' ? outfit.frontImage : outfit.backImage;
  const hasBoth = outfit.frontImage && outfit.backImage;

  return (
    <div className="group relative shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10">
      <img
        src={image}
        alt={outfit.name || 'Tenue favorite'}
        className="h-52 w-40 cursor-pointer object-cover"
        onClick={() => hasBoth && setView((v) => (v === 'front' ? 'back' : 'front'))}
        title={hasBoth ? 'Toucher pour basculer face/dos' : undefined}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
        <p className="truncate text-xs font-semibold text-white">{outfit.name || 'Tenue'}</p>
        {hasBoth && <p className="text-[10px] text-white/60">{view === 'front' ? 'Face' : 'Dos'} · toucher pour basculer</p>}
      </div>
      <button
        type="button"
        onClick={() => onDelete(outfit)}
        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-red-300 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
        aria-label="Supprimer cette tenue"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function StudioPage({ onNavigate }) {
  const { items, profile, selection, selectForSlot, addOutfit, outfits, deleteOutfit } = useCloset();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [savedFavorite, setSavedFavorite] = useState(false);

  // Chaque carrousel propose garde-robe + wishlist de sa catégorie.
  const byCategory = useMemo(() => {
    const map = { top: [], bottom: [], shoes: [] };
    for (const item of items) {
      if (map[item.category]) map[item.category].push(item);
    }
    return map;
  }, [items]);

  const selectedItems = ['top', 'bottom', 'shoes']
    .map((slot) => selection[slot])
    .filter(Boolean)
    .map((item) => ({ ...item, label: categoryLabel(item.category) }));

  const profileReady = Boolean(profile.frontUrl || profile.backUrl);
  const canGenerate = selectedItems.length > 0 && profileReady && !loading;

  async function handleGenerate() {
    setError(null);
    if (!hasApiKey()) {
      setError('Ajoute d’abord ta clé API Gemini sur la page Profil.');
      return;
    }
    setLoading(true);
    setResult(null);
    setSavedFavorite(false);
    try {
      setResult(await generateOutfit(profile, selectedItems));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveFavorite() {
    if (!result) return;
    setSavingFavorite(true);
    try {
      await addOutfit({
        name: selectedItems.map((i) => i.name).join(' + '),
        top: selection.top?.name ?? null,
        bottom: selection.bottom?.name ?? null,
        shoes: selection.shoes?.name ?? null,
        frontImage: result.front,
        backImage: result.back,
      });
      setSavedFavorite(true);
    } catch (e) {
      setError(`Enregistrement du favori impossible : ${e.message}`);
    } finally {
      setSavingFavorite(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <WandSparkles className="h-5 w-5 text-pink-400" />
          Studio d'essayage
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Compose ta tenue du jour et vois-la portée, de face et de dos.
        </p>
      </header>

      {!profileReady && (
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="flex w-full items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-left"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <span className="text-sm text-amber-200">
            Ajoute d'abord tes photos de référence (face et dos) sur la page Profil pour activer
            l'essayage. <span className="underline">Y aller →</span>
          </span>
        </button>
      )}

      {/* Les 3 carrousels de sélection */}
      <div className="space-y-5">
        {CATEGORIES.map((c) => (
          <CarouselPicker
            key={c.id}
            label={c.label}
            emoji={c.emoji}
            items={byCategory[c.id]}
            selected={selection[c.id]}
            onSelect={(item) => selectForSlot(c.id, item)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 py-4 text-base font-bold text-white shadow-xl shadow-violet-900/50 transition-opacity disabled:opacity-40"
      >
        <WandSparkles className="h-5 w-5" />
        {loading ? 'Génération en cours…' : "Essayer la tenue ✨"}
      </button>

      {error && (
        <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <ResultViewer
        result={result}
        loading={loading}
        onSaveFavorite={handleSaveFavorite}
        onRegenerate={handleGenerate}
        saving={savingFavorite}
        saved={savedFavorite}
      />

      {/* Tenues favorites */}
      {outfits.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/80">
            ❤️ Mes tenues favorites
          </h2>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {outfits.map((outfit) => (
              <FavoriteCard key={outfit.id} outfit={outfit} onDelete={deleteOutfit} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
