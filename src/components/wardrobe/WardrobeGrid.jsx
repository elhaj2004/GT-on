/**
 * Grille de vêtements avec actions : essayer au Studio, éditer, supprimer,
 * et (pour la wishlist) marquer comme acheté.
 */
import { useState } from 'react';
import { Pencil, PersonStanding, ShoppingBag, Trash2, WandSparkles } from 'lucide-react';
import { categoryLabel } from '../../lib/utils';
import { useCloset } from '../../context/ClosetContext';

function ItemCard({ item, onEdit, onTryOn, showMarkOwned }) {
  const { deleteItem, markAsOwned } = useCloset();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Supprimer « ${item.name} » ?`)) return;
    setBusy(true);
    try {
      await deleteItem(item);
    } catch (e) {
      window.alert(`Suppression impossible : ${e.message}`);
      setBusy(false);
    }
  }

  async function handleMarkOwned() {
    setBusy(true);
    try {
      await markAsOwned(item);
    } catch (e) {
      window.alert(`Opération impossible : ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:border-white/25">
      <div className="relative aspect-square">
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white">
          {categoryLabel(item.category)}
        </span>
        {item.wornImageUrl && (
          <span
            className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500/80 px-2 py-0.5 text-[10px] font-semibold text-white"
            title="Photo « portée » enregistrée : l'IA reproduira ce fit"
          >
            <PersonStanding className="h-3 w-3" />
            fit ✓
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-white">{item.name}</p>
        {item.color && <p className="truncate text-xs text-white/50">{item.color}</p>}
        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onTryOn(item)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-2 py-1.5 text-xs font-semibold text-white"
            title="Essayer au Studio"
          >
            <WandSparkles className="h-3.5 w-3.5" />
            Essayer
          </button>
          {showMarkOwned && (
            <button
              type="button"
              onClick={handleMarkOwned}
              disabled={busy}
              className="rounded-lg bg-white/10 p-1.5 text-emerald-300 hover:bg-white/20 disabled:opacity-50"
              title="Je l'ai acheté → garde-robe"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg bg-white/10 p-1.5 text-white/70 hover:bg-white/20"
            title="Modifier"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="rounded-lg bg-white/10 p-1.5 text-red-300 hover:bg-white/20 disabled:opacity-50"
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WardrobeGrid({ items, onEdit, onTryOn, showMarkOwned = false, emptyMessage }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-sm text-white/50">
        {emptyMessage ?? 'Aucun vêtement pour le moment. Ajoute-en un avec le bouton +'}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onTryOn={onTryOn}
          showMarkOwned={showMarkOwned}
        />
      ))}
    </div>
  );
}
