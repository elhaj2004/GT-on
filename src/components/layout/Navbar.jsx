/** Barre de navigation supérieure (desktop / tablette). */
import { Shirt, Sparkles, Heart, User, WandSparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export const NAV_ITEMS = [
  { id: 'studio', label: 'Studio', icon: WandSparkles },
  { id: 'wardrobe', label: 'Garde-robe', icon: Shirt },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'profile', label: 'Profil', icon: User },
];

export default function Navbar({ page, onNavigate }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f0a1e]/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <button
          type="button"
          onClick={() => onNavigate('studio')}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500">
            <Sparkles className="h-4 w-4" />
          </span>
          Virtual Closet
        </button>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                page === id
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-900/40'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
