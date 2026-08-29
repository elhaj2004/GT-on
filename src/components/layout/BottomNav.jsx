/** Barre de navigation inférieure (mobile-first). */
import { cn } from '../../lib/utils';
import { NAV_ITEMS } from './Navbar';

export default function BottomNav({ page, onNavigate }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0f0a1e]/90 backdrop-blur-lg sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-pink-400' : 'text-white/50'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-12 items-center justify-center rounded-full transition-colors',
                  active && 'bg-gradient-to-r from-violet-600/40 to-pink-600/40'
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
