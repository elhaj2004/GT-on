import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusionne des classes Tailwind conditionnelles sans conflits. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Identifiant unique (suffisant pour des documents client-side). */
export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const CATEGORIES = [
  { id: 'top', label: 'Hauts', emoji: '👚' },
  { id: 'bottom', label: 'Bas', emoji: '👖' },
  { id: 'shoes', label: 'Chaussures', emoji: '👟' },
];

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/**
 * Lit un fichier image et le redimensionne (max 1280px, JPEG qualité 0.85)
 * pour limiter le poids stocké et envoyé à l'API Gemini.
 * Retourne une data URL.
 */
export function fileToCompressedDataUrl(file, maxSize = 1280, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Ce fichier n'est pas une image valide."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Découpe une data URL en { mimeType, data } pour l'API Gemini (inlineData). */
export function dataUrlToInlineData(dataUrl) {
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error('Format de data URL invalide.');
  return { mimeType: match[1], data: match[2] };
}

/**
 * Récupère une image distante (URL https) et la convertit en data URL
 * pour pouvoir l'envoyer à Gemini. Échoue si le serveur bloque le CORS.
 */
export async function urlToDataUrl(url) {
  if (url.startsWith('data:')) return url;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Téléchargement de l'image impossible (${response.status}).`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Conversion de l’image impossible.'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
