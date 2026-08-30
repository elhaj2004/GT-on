# 👗 Virtual Closet & Try-On

Une garde-robe virtuelle avec **essayage par IA** : ajoute tes vêtements, compose une
tenue (haut + bas + chaussures) et vois-la **portée sur toi**, de face et de dos, grâce à
**Gemini « Nano Banana »** (`gemini-2.5-flash-image`).

## ✨ Fonctionnalités

- **Profil** — deux photos de référence (vue de face et vue de dos) utilisées par l'IA.
- **Garde-robe** — tous tes vêtements par catégories (Hauts, Bas, Chaussures) : ajout,
  édition, suppression. Chaque vêtement a **deux photos** : le vêtement seul (à plat /
  sur cintre) et le vêtement **porté sur soi** — cette seconde photo sert de référence de
  style à l'IA pour reproduire ton fit réel (oversize, rentré, manches retroussées…).
- **Studio d'essayage** — 3 carrousels pour composer la tenue, génération IA du rendu
  porté, toggle Face/Dos, enregistrement des tenues en Favoris.
- **Chat de retouche** — si le rendu n'est pas satisfaisant, décris la correction en
  langage naturel (« les manches sont trop longues », « rentre le haut dans le
  pantalon ») : l'agent régénère l'image corrigée en conservant l'identité et la tenue.
  La correction s'applique à la vue affichée, ou aux deux si tu coches « Les deux vues ».
- **Wishlist** — les vêtements que tu ne possèdes pas encore (captures d'e-commerce…),
  essayables avant achat, avec bouton « acheté » pour les basculer dans la garde-robe.
- **PWA** — installable sur l'écran d'accueil d'un smartphone (manifest + service worker).
- **Stockage** — Firebase (Firestore + Storage) si configuré, sinon stockage local
  automatique sur l'appareil (IndexedDB) : l'app fonctionne sans aucune configuration.

## 🚀 Démarrage

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:5173.

### 1. Clé API Gemini (obligatoire pour l'essayage)

Crée une clé gratuite sur [Google AI Studio](https://aistudio.google.com/apikey), puis :

- soit renseigne-la dans l'app → page **Profil** (stockée sur l'appareil) ;
- soit copie `.env.example` en `.env` et remplis `VITE_GEMINI_API_KEY`.

### 2. Firebase (optionnel — synchronisation cloud)

Sans Firebase, tout est stocké en local sur l'appareil. Pour synchroniser entre
appareils :

1. Crée un projet sur la [console Firebase](https://console.firebase.google.com).
2. Active **Firestore** et **Storage**.
3. Copie la configuration web du projet dans `.env` (voir `.env.example`).

### 3. Build de production

```bash
npm run build
npm run preview
```

Déploie le dossier `dist/` sur n'importe quel hébergeur statique (Firebase Hosting,
Vercel, Netlify…). Servi en HTTPS, le site est installable comme une app (PWA).

## 🧱 Stack technique

- [React 18](https://react.dev) + [Vite](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Firebase](https://firebase.google.com) (Firestore + Storage) avec repli IndexedDB
- [@google/genai](https://www.npmjs.com/package/@google/genai) — Gemini 2.5 Flash Image
- [lucide-react](https://lucide.dev) — icônes

## 📁 Architecture

```
src/
├── components/
│   ├── layout/      Navbar (desktop) + BottomNav (mobile)
│   ├── wardrobe/    WardrobeGrid, AddItemModal
│   ├── tryon/       CarouselPicker, ResultViewer
│   └── wishlist/    WishlistGrid
├── services/        firebase.js, db.js (données), localStore.js, geminiService.js
├── context/         ClosetContext.jsx (état global)
├── pages/           StudioPage, WardrobePage, WishlistPage, ProfilePage
├── App.jsx
└── main.jsx
```

## 💡 Conseils pour de beaux rendus

- Photos de référence : en pied, bien éclairées, fond neutre, vêtements près du corps.
- Photos de vêtements : à plat ou sur cintre, bien cadrées, sans reflets.
