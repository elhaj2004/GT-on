/**
 * Page Garde-robe : onglets par catégorie (Hauts, Bas, Chaussures),
 * ajout / édition / suppression de vêtements, envoi vers le Studio.
 */
import { useMemo, useState } from 'react';
import { Plus, Shirt } from 'lucide-react';
import { CATEGORIES, cn } from '../lib/utils';
import { useCloset } from '../context/ClosetContext';
import WardrobeGrid from '../components/wardrobe/WardrobeGrid';
import AddItemModal from '../components/wardrobe/AddItemModal';

export default function WardrobePage({ onTryOn }) {
  const { wardrobe } = useCloset();
  const [activeTab, setActiveTab] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const filtered = useMemo(
    () => (activeTab === 'all' ? wardrobe : wardrobe.filter((i) => i.category === activeTab)),
    [wardrobe, activeTab]
  );

  const tabs = [{ id: 'all', label: 'Tout', emoji: '✨' }, ...CATEGORIES];

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
            <Shirt className="h-5 w-5 text-pink-400" />
            Ma garde-robe
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {wardrobe.length} vêtement{wardrobe.length > 1 ? 's' : ''} enregistré
            {wardrobe.length > 1 ? 's' : ''}
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

      {/* Onglets catégories */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-transparent bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                : 'border-white/15 bg-white/5 text-white/60 hover:bg-white/10'
            )}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      <WardrobeGrid items={filtered} onEdit={openEdit} onTryOn={onTryOn} />

      <AddItemModal open={modalOpen} onClose={() => setModalOpen(false)} item={editingItem} />
    </div>
  );
}
