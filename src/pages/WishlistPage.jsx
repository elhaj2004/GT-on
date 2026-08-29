/**
 * Page Wishlist : vêtements non encore possédés (repérages boutique,
 * captures d'e-commerce) à essayer virtuellement avant achat.
 */
import { useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import { useCloset } from '../context/ClosetContext';
import WishlistGrid from '../components/wishlist/WishlistGrid';
import AddItemModal from '../components/wardrobe/AddItemModal';

export default function WishlistPage({ onTryOn }) {
  const { wishlist } = useCloset();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  function openAdd() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <Heart className="h-5 w-5 text-pink-400" />
            Ma wishlist
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Projette-toi : essaie virtuellement avant d'acheter 💸
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </header>

      <WishlistGrid items={wishlist} onEdit={openEdit} onTryOn={onTryOn} />

      <AddItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editingItem}
        forWishlist
      />
    </div>
  );
}
