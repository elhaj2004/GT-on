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
  const hasWornRefs = garments.some((g) => g.wornImageUrl);

  return `Tu es un assistant d'essayage virtuel photoréaliste.

La PREMIÈRE image est la photo de référence de la personne, vue ${viewLabel}.
Les images suivantes sont annotées : pour chaque vêtement, une photo du
vêtement SEUL et, parfois, une photo de RÉFÉRENCE DE STYLE montrant la même
personne portant ce vêtement.

TÂCHE : génère UNE SEULE image photoréaliste de la personne de la première image, vue ${viewLabel}, portant EXACTEMENT ces vêtements.

RÈGLES STRICTES :
- Conserve fidèlement l'identité de la personne : visage, coiffure, couleur de cheveux, morphologie, teinte de peau et posture de la première image. Ne change JAMAIS la personne.
- Remplace uniquement ses vêtements par ceux fournis : reproduis fidèlement leurs couleurs, motifs, coupes, textures et logos.${
    hasWornRefs
      ? `
- Quand une photo de RÉFÉRENCE DE STYLE est fournie pour un vêtement, reproduis EXACTEMENT la façon dont la personne le porte sur cette photo : ampleur/oversize, tombé, longueur, rentré ou non dans le bas, manches retroussées ou non. La référence de style prime sur une interprétation générique du vêtement.`
      : ''
  }
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

  // Pour chaque vêtement : un libellé texte + la photo du vêtement seul,
  // puis (si disponible) la photo « portée » comme référence de style.
  const garmentParts = (
    await Promise.all(
      items.map(async (item, index) => {
        const label = `${item.label} n°${index + 1} : "${item.name || item.label}"${
          item.color ? ` (couleur : ${item.color})` : ''
        }`;
        const parts = [
          { text: `Vêtement — ${label} — photo du vêtement SEUL :` },
          { inlineData: dataUrlToInlineData(await urlToDataUrl(item.imageUrl)) },
        ];
        if (item.wornImageUrl) {
          parts.push(
            {
              text: `RÉFÉRENCE DE STYLE pour ce même vêtement (${label}) : la personne le portant — reproduis ce fit exact :`,
            },
            { inlineData: dataUrlToInlineData(await urlToDataUrl(item.wornImageUrl)) }
          );
        }
        return parts;
      })
    )
  ).flat();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: buildPrompt(view, items) },
          { text: 'Photo de référence de la personne :' },
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
