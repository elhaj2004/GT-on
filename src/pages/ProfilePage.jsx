/**
 * Page Profil : photos de référence (face + dos) utilisées par l'IA pour
 * l'essayage virtuel, et configuration de la clé API Gemini.
 */
import { useRef, useState } from 'react';
import { Camera, Check, Cloud, HardDrive, KeyRound, Loader2, User } from 'lucide-react';
import { fileToCompressedDataUrl } from '../lib/utils';
import { useCloset } from '../context/ClosetContext';
import {
  FREE_MODELS,
  getEffectiveModel,
  getStoredApiKey,
  setStoredApiKey,
  setStoredModel,
} from '../services/geminiService';

function PhotoUploader({ view, label, hint, url, onUpload }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 1536);
      await onUpload(view, dataUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-white/20 bg-white/5 transition-colors hover:border-pink-400/60"
      >
        {url ? (
          <>
            <img src={url} alt={`Photo de référence — ${label}`} className="h-full w-full object-cover" />
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              Changer
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 text-center text-white/50">
            {busy ? <Loader2 className="h-9 w-9 animate-spin" /> : <Camera className="h-9 w-9" />}
            <span className="text-sm font-semibold text-white/80">{label}</span>
            <span className="text-xs">{hint}</span>
          </span>
        )}
        {busy && url && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { profile, updateProfilePhoto, isFirebaseConfigured } = useCloset();
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [keySaved, setKeySaved] = useState(false);
  const [model, setModel] = useState(getEffectiveModel());
  const envKeyPresent = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  function handleModelChange(event) {
    const value = event.target.value;
    setModel(value);
    setStoredModel(value);
  }

  function handleSaveKey(event) {
    event.preventDefault();
    setStoredApiKey(apiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <User className="h-5 w-5 text-pink-400" />
          Mon profil
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Ces deux photos servent de référence à l'IA pour générer les essayages. Choisis des
          photos en pied, bien éclairées, sur fond neutre si possible.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <PhotoUploader
          view="front"
          label="Vue de face"
          hint="Photo en pied, face à l'objectif"
          url={profile.frontUrl}
          onUpload={updateProfilePhoto}
        />
        <PhotoUploader
          view="back"
          label="Vue de dos"
          hint="Photo en pied, dos à l'objectif"
          url={profile.backUrl}
          onUpload={updateProfilePhoto}
        />
      </div>

      {/* Clé API Gemini */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <KeyRound className="h-4 w-4 text-pink-400" />
          Clé API Gemini (Nano Banana)
        </h2>
        {envKeyPresent ? (
          <p className="mt-2 text-sm text-emerald-300">
            ✓ Une clé API est déjà configurée pour cette installation.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-white/50">
              Nécessaire pour générer les essayages. Crée une clé gratuite sur{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-300 underline"
              >
                Google AI Studio
              </a>
              . Elle est stockée uniquement sur cet appareil.
            </p>
            <form onSubmit={handleSaveKey} className="mt-3 flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza…"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-pink-400/60"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {keySaved ? <Check className="h-4 w-4" /> : null}
                {keySaved ? 'OK' : 'Enregistrer'}
              </button>
            </form>
          </>
        )}

        {/* Choix du modèle (gratuit) */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <label htmlFor="gemini-model" className="mb-1.5 block text-sm font-medium text-white/70">
            Modèle d'image
          </label>
          <select
            id="gemini-model"
            value={model}
            onChange={handleModelChange}
            className="w-full rounded-xl border border-white/15 bg-[#171226] px-3 py-2.5 text-sm text-white outline-none focus:border-pink-400/60"
          >
            {FREE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
            {!FREE_MODELS.some((m) => m.id === model) && (
              <option value={model}>{model} (personnalisé)</option>
            )}
          </select>
          <p className="mt-1.5 text-xs text-white/50">
            Ces modèles sont inclus dans le niveau gratuit de l'API Gemini (limite d'images
            par jour, sans carte bancaire). Nano Banana est recommandé pour l'essayage.
          </p>
        </div>
      </section>

      {/* Mode de stockage */}
      <section className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        {isFirebaseConfigured ? (
          <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
        ) : (
          <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        )}
        <div>
          <p className="text-sm font-semibold text-white">
            {isFirebaseConfigured ? 'Synchronisation cloud active' : 'Stockage local'}
          </p>
          <p className="mt-0.5 text-xs text-white/50">
            {isFirebaseConfigured
              ? 'Tes vêtements et photos sont sauvegardés dans Firebase (Firestore + Storage).'
              : "Tes données restent sur cet appareil (IndexedDB). Pour les synchroniser entre appareils, configure Firebase dans le fichier .env (voir .env.example)."}
          </p>
        </div>
      </section>
    </div>
  );
}
