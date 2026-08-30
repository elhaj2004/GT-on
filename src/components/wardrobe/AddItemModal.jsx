/**
 * Modal d'ajout / édition d'un vêtement (garde-robe ou wishlist).
 *
 * Deux photos par vêtement :
 *  - le vêtement seul (à plat / sur cintre) — obligatoire ;
 *  - le vêtement porté sur soi — recommandé : l'IA s'en sert comme
 *    référence de style pour reproduire le fit réel (oversize, rentré,
 *    manches retroussées…). Masqué pour la wishlist (article non possédé).
 */
import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, PersonStanding, Shirt, X } from 'lucide-react';
import { CATEGORIES, cn, fileToCompressedDataUrl } from '../../lib/utils';
import { useCloset } from '../../context/ClosetContext';

function PhotoSlot({ label, hint, icon: Icon, previewUrl, onPick, aspect = 'aspect-square' }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);

  async function handleChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      onPick(await fileToCompressedDataUrl(file));
    } catch (e) {
      setError(e.message);
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-white/5 transition-colors hover:border-pink-400/60',
          aspect
        )}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] text-white">
              Changer
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-3 py-6 text-center text-white/50">
            {Icon ? <Icon className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
            <span className="text-xs font-semibold text-white/75">{label}</span>
            {hint && <span className="text-[11px] leading-tight">{hint}</span>}
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
    </div>
  );
}

export default function AddItemModal({ open, onClose, item = null, forWishlist = false }) {
  const { addOrUpdateItem } = useCloset();

  const [category, setCategory] = useState('top');
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [wornImageDataUrl, setWornImageDataUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = Boolean(item);
  const isWishlist = isEdit ? item.owned === false : forWishlist;

  useEffect(() => {
    if (!open) return;
    setCategory(item?.category ?? 'top');
    setName(item?.name ?? '');
    setColor(item?.color ?? '');
    setNotes(item?.notes ?? '');
    setSourceUrl(item?.sourceUrl ?? '');
    setImageDataUrl(null);
    setWornImageDataUrl(null);
    setError(null);
    setSaving(false);
  }, [open, item]);

  if (!open) return null;

  const previewUrl = imageDataUrl ?? item?.imageUrl ?? null;
  const wornPreviewUrl = wornImageDataUrl ?? item?.wornImageUrl ?? null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!previewUrl) {
      setError('Ajoute la photo du vêtement seul.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addOrUpdateItem({
        ...(isEdit ? item : {}),
        category,
        name: name.trim() || CATEGORIES.find((c) => c.id === category)?.label,
        color: color.trim(),
        notes: notes.trim(),
        sourceUrl: sourceUrl.trim(),
        owned: !isWishlist,
        ...(imageDataUrl ? { imageDataUrl } : {}),
        ...(wornImageDataUrl ? { wornImageDataUrl } : {}),
      });
      onClose();
    } catch (e) {
      setError(`Enregistrement impossible : ${e.message}`);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-[#171226] p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? 'Modifier le vêtement' : isWishlist ? 'Ajouter à la wishlist' : 'Ajouter un vêtement'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photos : vêtement seul + vêtement porté */}
          <div className="flex gap-3">
            <PhotoSlot
              label="Vêtement seul *"
              hint="À plat ou sur cintre"
              icon={Shirt}
              previewUrl={previewUrl}
              onPick={setImageDataUrl}
              aspect={isWishlist ? 'aspect-square' : 'aspect-[3/4]'}
            />
            {!isWishlist && (
              <PhotoSlot
                label="Porté sur toi"
                hint="Recommandé : montre à l'IA comment tu le portes"
                icon={PersonStanding}
                previewUrl={wornPreviewUrl}
                onPick={setWornImageDataUrl}
                aspect="aspect-[3/4]"
              />
            )}
          </div>
          {!isWishlist && (
            <p className="-mt-2 text-[11px] leading-snug text-white/40">
              La photo « porté sur toi » aide l'IA à reproduire ton fit réel (oversize, rentré
              dans le pantalon, manches retroussées…).
            </p>
          )}

          {/* Catégorie */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">Catégorie</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                    category === c.id
                      ? 'border-transparent bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                      : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                  )}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="item-name" className="mb-1.5 block text-sm font-medium text-white/70">
                Nom
              </label>
              <input
                id="item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Top satin"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-pink-400/60"
              />
            </div>
            <div>
              <label htmlFor="item-color" className="mb-1.5 block text-sm font-medium text-white/70">
                Couleur
              </label>
              <input
                id="item-color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ex : Rose poudré"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-pink-400/60"
              />
            </div>
          </div>

          {isWishlist && (
            <div>
              <label htmlFor="item-source" className="mb-1.5 block text-sm font-medium text-white/70">
                Lien boutique (optionnel)
              </label>
              <input
                id="item-source"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-pink-400/60"
              />
            </div>
          )}

          <div>
            <label htmlFor="item-notes" className="mb-1.5 block text-sm font-medium text-white/70">
              Notes (optionnel)
            </label>
            <textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex : parfait pour l'été"
              className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-pink-400/60"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 py-3 font-semibold text-white shadow-lg shadow-violet-900/40 transition-opacity disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Ajouter'}
          </button>
        </form>
      </div>
    </div>
  );
}
