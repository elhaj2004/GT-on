import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ClosetProvider, useCloset } from './context/ClosetContext';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import StudioPage from './pages/StudioPage';
import WardrobePage from './pages/WardrobePage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const { loading, error, selectForSlot } = useCloset();
  const [page, setPage] = useState('studio');

  /** Depuis la Garde-robe ou la Wishlist : place l'article dans son
      emplacement du Studio et y navigue directement. */
  const handleTryOn = useCallback(
    (item) => {
      selectForSlot(item.category, item);
      setPage('studio');
      window.scrollTo({ top: 0 });
    },
    [selectForSlot]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-white/60">
        <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
        <p className="text-sm">Ouverture du dressing…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar page={page} onNavigate={setPage} />
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:pb-10">
        {error && (
          <p className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>
        )}
        {page === 'studio' && <StudioPage onNavigate={setPage} />}
        {page === 'wardrobe' && <WardrobePage onTryOn={handleTryOn} />}
        {page === 'wishlist' && <WishlistPage onTryOn={handleTryOn} />}
        {page === 'profile' && <ProfilePage />}
      </main>
      <BottomNav page={page} onNavigate={setPage} />
    </div>
  );
}

export default function App() {
  return (
    <ClosetProvider>
      <AppContent />
    </ClosetProvider>
  );
}
