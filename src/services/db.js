/**
 * Couche de données unifiée.
 *
 * - Firebase configuré  → Firestore (documents) + Storage (images).
 * - Sinon               → IndexedDB local (les images restent en data URL).
 *
 * Modèle de données :
 *   items   : { id, category: 'top'|'bottom'|'shoes', name, color, notes,
 *               imageUrl, wornImageUrl?, owned: boolean, sourceUrl?, createdAt }
 *               (wornImageUrl = photo du vêtement porté par la personne,
 *                utilisée par l'IA comme référence de style)
 *   profile : { frontUrl, backUrl }
 *   outfits : { id, name, top, bottom, shoes, frontImage, backImage, createdAt }
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadString } from 'firebase/storage';
import { db as firestore, storage, isFirebaseConfigured } from './firebase';
import { localStore } from './localStore';
import { uid } from '../lib/utils';

export { isFirebaseConfigured };

/* ---------- Images ---------- */

/**
 * Persiste une image (data URL). Avec Firebase : upload dans Storage et
 * retour de l'URL publique. En local : la data URL est stockée telle quelle.
 * Retourne { url, path } (path = chemin Storage, null en mode local).
 */
async function saveImage(dataUrl, folder) {
  if (!isFirebaseConfigured) return { url: dataUrl, path: null };
  const path = `${folder}/${uid()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataUrl, 'data_url');
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

async function deleteImage(path) {
  if (!isFirebaseConfigured || !path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // L'image a pu être supprimée manuellement : on ignore.
  }
}

/* ---------- Vêtements (garde-robe + wishlist) ---------- */

export async function fetchItems() {
  if (isFirebaseConfigured) {
    const snapshot = await getDocs(collection(firestore, 'items'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return (await localStore.getAll('items')) ?? [];
}

export async function saveItem({ id, imageDataUrl, wornImageDataUrl, ...fields }) {
  const itemId = id ?? uid();
  let imagePatch = {};
  if (imageDataUrl) {
    const { url, path } = await saveImage(imageDataUrl, 'items');
    imagePatch = { imageUrl: url, imagePath: path };
  }
  if (wornImageDataUrl) {
    const { url, path } = await saveImage(wornImageDataUrl, 'items-worn');
    imagePatch = { ...imagePatch, wornImageUrl: url, wornImagePath: path };
  }
  const item = { ...fields, ...imagePatch, id: itemId };
  if (isFirebaseConfigured) {
    const { id: _omit, ...data } = item;
    await setDoc(doc(firestore, 'items', itemId), data, { merge: true });
  } else {
    const existing = (await localStore.get('items', itemId)) ?? {};
    await localStore.put('items', { ...existing, ...item });
  }
  return item;
}

export async function removeItem(item) {
  if (isFirebaseConfigured) {
    await deleteDoc(doc(firestore, 'items', item.id));
    await deleteImage(item.imagePath);
    await deleteImage(item.wornImagePath);
  } else {
    await localStore.delete('items', item.id);
  }
}

/* ---------- Profil (photos de référence) ---------- */

export async function fetchProfile() {
  if (isFirebaseConfigured) {
    const snapshot = await getDoc(doc(firestore, 'profile', 'main'));
    return snapshot.exists() ? snapshot.data() : {};
  }
  return (await localStore.getKv('profile')) ?? {};
}

/** view: 'front' | 'back' — remplace la photo de référence correspondante. */
export async function saveProfilePhoto(view, dataUrl, previousPath) {
  const { url, path } = await saveImage(dataUrl, 'profile');
  const patch = { [`${view}Url`]: url, [`${view}Path`]: path };
  if (isFirebaseConfigured) {
    await setDoc(doc(firestore, 'profile', 'main'), patch, { merge: true });
    await deleteImage(previousPath);
  } else {
    const profile = (await localStore.getKv('profile')) ?? {};
    await localStore.setKv('profile', { ...profile, ...patch });
  }
  return patch;
}

/* ---------- Tenues favorites ---------- */

export async function fetchOutfits() {
  if (isFirebaseConfigured) {
    const snapshot = await getDocs(collection(firestore, 'outfits'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return (await localStore.getAll('outfits')) ?? [];
}

export async function saveOutfit({ frontImage, backImage, ...fields }) {
  const outfitId = uid();
  const images = {};
  if (frontImage) {
    const { url, path } = await saveImage(frontImage, 'outfits');
    images.frontImage = url;
    images.frontPath = path;
  }
  if (backImage) {
    const { url, path } = await saveImage(backImage, 'outfits');
    images.backImage = url;
    images.backPath = path;
  }
  const outfit = { ...fields, ...images, id: outfitId, createdAt: Date.now() };
  if (isFirebaseConfigured) {
    const { id: _omit, ...data } = outfit;
    await setDoc(doc(firestore, 'outfits', outfitId), data);
  } else {
    await localStore.put('outfits', outfit);
  }
  return outfit;
}

export async function removeOutfit(outfit) {
  if (isFirebaseConfigured) {
    await deleteDoc(doc(firestore, 'outfits', outfit.id));
    await deleteImage(outfit.frontPath);
    await deleteImage(outfit.backPath);
  } else {
    await localStore.delete('outfits', outfit.id);
  }
}
