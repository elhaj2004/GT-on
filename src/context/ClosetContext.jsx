/**
 * Contexte global de l'application : garde-robe, wishlist, profil,
 * tenues favorites et sélection courante du Studio d'essayage.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchItems,
  fetchOutfits,
  fetchProfile,
  isFirebaseConfigured,
  removeItem,
  removeOutfit,
  saveItem,
  saveOutfit,
  saveProfilePhoto,
} from '../services/db';

const ClosetContext = createContext(null);

export function ClosetProvider({ children }) {
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sélection courante du Studio : { top, bottom, shoes } → item ou null.
  const [selection, setSelection] = useState({ top: null, bottom: null, shoes: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loadedItems, loadedProfile, loadedOutfits] = await Promise.all([
          fetchItems(),
          fetchProfile(),
          fetchOutfits(),
        ]);
        if (cancelled) return;
        setItems(loadedItems.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
        setProfile(loadedProfile);
        setOutfits(loadedOutfits.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
      } catch (e) {
        if (!cancelled) setError(`Chargement des données impossible : ${e.message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Vêtements ---------- */

  const addOrUpdateItem = useCallback(async (data) => {
    const saved = await saveItem({ createdAt: Date.now(), ...data });
    setItems((prev) => {
      const existing = prev.find((i) => i.id === saved.id);
      if (existing) return prev.map((i) => (i.id === saved.id ? { ...i, ...saved } : i));
      return [saved, ...prev];
    });
    return saved;
  }, []);

  const deleteItem = useCallback(async (item) => {
    await removeItem(item);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setSelection((prev) => {
      const next = { ...prev };
      for (const slot of ['top', 'bottom', 'shoes']) {
        if (next[slot]?.id === item.id) next[slot] = null;
      }
      return next;
    });
  }, []);

  /** Fait passer un article de la wishlist vers la garde-robe (acheté !). */
  const markAsOwned = useCallback(
    async (item) => addOrUpdateItem({ ...item, owned: true }),
    [addOrUpdateItem]
  );

  /* ---------- Profil ---------- */

  const updateProfilePhoto = useCallback(
    async (view, dataUrl) => {
      const previousPath = profile[`${view}Path`];
      const patch = await saveProfilePhoto(view, dataUrl, previousPath);
      setProfile((prev) => ({ ...prev, ...patch }));
    },
    [profile]
  );

  /* ---------- Tenues favorites ---------- */

  const addOutfit = useCallback(async (data) => {
    const saved = await saveOutfit(data);
    setOutfits((prev) => [saved, ...prev]);
    return saved;
  }, []);

  const deleteOutfit = useCallback(async (outfit) => {
    await removeOutfit(outfit);
    setOutfits((prev) => prev.filter((o) => o.id !== outfit.id));
  }, []);

  /* ---------- Sélection du Studio ---------- */

  const selectForSlot = useCallback((slot, item) => {
    setSelection((prev) => ({ ...prev, [slot]: item }));
  }, []);

  const wardrobe = useMemo(() => items.filter((i) => i.owned !== false), [items]);
  const wishlist = useMemo(() => items.filter((i) => i.owned === false), [items]);

  const value = useMemo(
    () => ({
      loading,
      error,
      isFirebaseConfigured,
      items,
      wardrobe,
      wishlist,
      profile,
      outfits,
      selection,
      addOrUpdateItem,
      deleteItem,
      markAsOwned,
      updateProfilePhoto,
      addOutfit,
      deleteOutfit,
      selectForSlot,
      setSelection,
    }),
    [
      loading,
      error,
      items,
      wardrobe,
      wishlist,
      profile,
      outfits,
      selection,
      addOrUpdateItem,
      deleteItem,
      markAsOwned,
      updateProfilePhoto,
      addOutfit,
      deleteOutfit,
      selectForSlot,
    ]
  );

  return <ClosetContext.Provider value={value}>{children}</ClosetContext.Provider>;
}

export function useCloset() {
  const context = useContext(ClosetContext);
  if (!context) throw new Error('useCloset doit être utilisé dans un <ClosetProvider>.');
  return context;
}
