/**
 * Service d'essayage virtuel basé sur Gemini "Nano Banana"
 * (modèle de génération/édition d'images gemini-2.5-flash-image).
 *
 * On envoie à l'API : la photo de référence (face ou dos) + les photos des
 * vêtements sélectionnés (haut, bas, chaussures) + un prompt multimodal
 * strict. Le modèle retourne une image de la personne portant la tenue.
 *
 * La clé API est lue depuis VITE_GEMINI_API_KEY, ou depuis la clé saisie
 * dans l'app (page Profil), stockée en localStorage.
 */
import { GoogleGenAI } from '@google/genai';
import { dataUrlToInlineData, urlToDataUrl } from '../lib/utils';

const API_KEY_STORAGE = 'virtual-closet:gemini-api-key';
const MODEL = import.meta.env.VITE_GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

export function getStoredApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function setStoredApiKey(key) {
  if (key) localStorage.setItem(API_KEY_STORAGE, key.trim());
  else localStorage.removeItem(API_KEY_STORAGE);
}

export function getEffectiveApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || getStoredApiKey();
}

export function hasApiKey() {
  return Boolean(getEffectiveApiKey());
}

function buildPrompt(view, garments) {
  const viewLabel = view === 'front' ? 'de FACE' : 'de DOS';
  const list = garments
    .map((g, i) => `${i + 2}. ${g.label} : "${g.name || g.label}"${g.color ? ` (couleur : ${g.color})` : ''}`)
    .join('\n');

  return `Tu es un assistant d'essayage virtuel photoréaliste.

IMAGE 1 : photo de référence d'une personne, vue ${viewLabel}.
Les images suivantes sont des vêtements :
${list}

TÂCHE : génère UNE SEULE image photoréaliste de la personne de l'IMAGE 1, vue ${viewLabel}, portant EXACTEMENT ces vêtements.

RÈGLES STRICTES :
- Conserve fidèlement l'identité de la personne : visage, coiffure, couleur de cheveux, morphologie, teinte de peau et posture de l'IMAGE 1. Ne change JAMAIS la personne.
- Remplace uniquement ses vêtements par ceux fournis : reproduis fidèlement leurs couleurs, motifs, coupes, textures et logos.
- Ajuste les vêtements de manière réaliste à sa morphologie (plis, tombé du tissu, ombres naturelles).
- Conserve la même vue (${viewLabel}) et un cadrage en pied montrant les chaussures.
- Fond neutre et propre, éclairage doux type studio.
- Ne rajoute aucun accessoire non fourni, aucun texte, aucun filigrane.`;
}

/**
 * Génère le rendu d'essayage pour une vue donnée.
 *
 * @param {'front'|'back'} view    Vue à générer.
 * @param {string} referenceUrl    Photo de référence (data URL ou https).
 * @param {Array} items            Vêtements sélectionnés [{ name, color, imageUrl, label }].
 * @returns {Promise<string>}      Data URL de l'image générée.
 */
export async function generateTryOn(view, referenceUrl, items) {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    throw new Error('Aucune clé API Gemini configurée. Ajoute-la depuis la page Profil.');
  }
  if (!referenceUrl) {
    throw new Error(`Photo de référence (${view === 'front' ? 'face' : 'dos'}) manquante.`);
  }
  if (!items.length) {
    throw new Error('Sélectionne au moins un vêtement.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const referenceData = dataUrlToInlineData(await urlToDataUrl(referenceUrl));
  const garmentParts = await Promise.all(
    items.map(async (item) => ({
      inlineData: dataUrlToInlineData(await urlToDataUrl(item.imageUrl)),
    }))
  );

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: buildPrompt(view, items) },
          { inlineData: referenceData },
          ...garmentParts,
        ],
      },
    ],
    config: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  });

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart) {
    const text = parts.find((p) => p.text)?.text;
    throw new Error(
      text
        ? `Le modèle n'a pas renvoyé d'image : ${text.slice(0, 200)}`
        : "Le modèle n'a pas renvoyé d'image. Réessaie."
    );
  }
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

/**
 * Génère la tenue pour les deux vues (face et dos) en parallèle.
 * Retourne { front, back, errors } — une vue peut échouer indépendamment.
 */
export async function generateOutfit(profile, items) {
  const [front, back] = await Promise.allSettled([
    profile.frontUrl ? generateTryOn('front', profile.frontUrl, items) : Promise.resolve(null),
    profile.backUrl ? generateTryOn('back', profile.backUrl, items) : Promise.resolve(null),
  ]);

  const result = {
    front: front.status === 'fulfilled' ? front.value : null,
    back: back.status === 'fulfilled' ? back.value : null,
    errors: [],
  };
  if (front.status === 'rejected') result.errors.push(`Vue de face : ${front.reason.message}`);
  if (back.status === 'rejected') result.errors.push(`Vue de dos : ${back.reason.message}`);
  if (!result.front && !result.back) {
    throw new Error(result.errors.join(' — ') || 'Génération impossible.');
  }
  return result;
}
