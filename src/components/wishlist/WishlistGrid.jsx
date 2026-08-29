/**
 * Grille de la wishlist : vêtements non possédés (repérés en boutique,
 * captures d'e-commerce…) avec envoi direct vers le Studio d'essayage.
 */
import { ExternalLink } from 'lucide-react';
import WardrobeGrid from '../wardrobe/WardrobeGrid';

export default function WishlistGrid({ items, onEdit, onTryOn }) {
  return (
    <div className="space-y-3">
      <WardrobeGrid
        items={items}
        onEdit={onEdit}
        onTryOn={onTryOn}
        showMarkOwned
        emptyMessage="Ta wishlist est vide. Ajoute les vêtements qui te font envie pour les essayer virtuellement avant de les acheter !"
      />
      {items.some((i) => i.sourceUrl) && (
        <div className="space-y-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Liens boutiques
          </p>
          {items
            .filter((i) => i.sourceUrl)
            .map((i) => (
              <a
                key={i.id}
                href={i.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-pink-300 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{i.name}</span>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
