/**
 * Carrousel horizontal de sélection d'un vêtement pour un emplacement
 * (haut, bas ou chaussures). Défilement tactile + flèches, option « Aucun ».
 */
import { useRef } from 'react';
import { Ban, Check, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CarouselPicker({ label, emoji, items, selected, onSelect }) {
  const scrollerRef = useRef(null);

  function scrollBy(direction) {
    scrollerRef.current?.scrollBy({ left: direction * 240, behavior: 'smooth' });
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white/80">
          <span>{emoji}</span>
          {label}
          {selected && <span className="font-normal normal-case text-pink-300">— {selected.name}</span>}
        </h3>
        <div className="hidden gap-1 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20"
            aria-label={`Faire défiler ${label} vers la gauche`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20"
            aria-label={`Faire défiler ${label} vers la droite`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1"
      >
        {/* Option « Aucun » */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'flex h-28 w-24 shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs transition-colors',
            !selected
              ? 'border-pink-400 bg-pink-500/15 text-pink-200'
              : 'border-white/15 bg-white/5 text-white/50 hover:bg-white/10'
          )}
        >
          <Ban className="h-6 w-6" />
          Aucun
        </button>

        {items.map((item) => {
          const isSelected = selected?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : item)}
              className={cn(
                'relative h-28 w-24 shrink-0 snap-start overflow-hidden rounded-2xl border-2 transition-all',
                isSelected
                  ? 'border-pink-400 shadow-lg shadow-pink-900/40'
                  : 'border-transparent opacity-80 hover:opacity-100'
              )}
              title={item.name}
            >
              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              {item.owned === false && (
                <span
                  className="absolute left-1.5 top-1.5 rounded-full bg-black/60 p-1 text-pink-300"
                  title="Wishlist (pas encore acheté)"
                >
                  <Heart className="h-3 w-3 fill-current" />
                </span>
              )}
              {isSelected && (
                <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}

        {!items.length && (
          <div className="flex h-28 flex-1 items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 text-center text-xs text-white/40">
            Aucun article dans cette catégorie — ajoute-en depuis la Garde-robe ou la Wishlist.
          </div>
        )}
      </div>
    </section>
  );
}
