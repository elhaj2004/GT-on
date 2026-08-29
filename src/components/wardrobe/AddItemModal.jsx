/**
 * Modal d'ajout / édition d'un vêtement (garde-robe ou wishlist).
 * Upload photo avec prévisualisation, catégorie, nom, couleur, notes.
 */
import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { CATEGORIES, cn, fileToCompressedDataUrl } from '../../lib/utils';
import { useCloset } from '../../context/ClosetContext';

export default function AddItemModal({ open, onClose, item = null, forWishlist = false }) {
  const { addOrUpdateItem } = useCloset();
  const fileInputRef = useRef(null);

  const [category, setCategory] = useState('top');
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState(null);
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
    setError(null);
    setSaving(false);
  }, [open, item]);

  if (!open) return null;

  const previewUrl = imageDataUrl ?? item?.imageUrl ?? null;

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setImageDataUrl(await fileToCompressedDataUrl(file));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!previewUrl) {
      setError('Ajoute une photo du vêtement.');
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
          {/* Photo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-white/5 transition-colors hover:border-pink-400/60"
          >
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Aperçu du vêtement" className="h-full w-full object-cover" />
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  Changer la photo
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-2 text-white/50">
                <Camera className="h-10 w-10" />
                <span className="text-sm">Photo du vêtement (galerie ou appareil photo)</span>
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

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
