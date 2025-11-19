# TMHT Children’s Ministry

A complete digital toolkit for The Maker’s House Chapel (TMHT) Children’s Ministry. Check kids in, generate secure pickup codes, track attendance, and export reports—all from one fast, mobile-friendly web app.

## What’s Inside

- **Check-In & Pick-Up** – real-time QR codes and 4-digit pickup codes  
- **Live Dashboard** – see who’s checked-in, capacity, volunteer counts  
- **Admin Reports** – CSV export, attendance trends, SMS/WhatsApp alerts  
- **Secure & Offline-Ready** – works with or without internet; data syncs to Supabase when online  
- **Dark / Light Mode** – automatic theme switching for services day or night  

## Tech Stack

- **Frontend** – React + TypeScript + Vite + Tailwind CSS  
- **Backend** – Supabase (Postgres + Auth + Realtime)  
- **Deployment** – Vercel one-click deploy (or any static host)  

## 60-Second Start

1. Clone / download this repo  
2. `npm install`  
3. Add your Supabase URL & anon key to `.env` (see `.env.example`)  
4. `npm run dev` → open http://localhost:5174  
5. Check in your first child!

## Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CAPACITY=50          # max kids per service
VITE_VOLUNTEERS=6         # expected volunteers
VITE_ENABLE_SMS=false     # set true after adding Twilio function
```

## Folder Map

```
src/
├─ components/      # reusable UI (Header, QR, PickUp, etc.)
├─ pages/           # route-level pages (Dashboard, Admin, Lookup…)
├─ lib/             # data & auth helpers (Supabase, storage, SMS)
├─ types/           # TypeScript types
└─ assets/          # images, icons, print sheets
```

## Common Tasks

| Task | Where |
|---|---|
| Change colors / logo | `tailwind.config.js` & `src/assets/` |
| Add new classroom | `src/lib/config.ts` → `classroomOptions` |
| Edit pickup message | `src/lib/sms.ts` |
| Custom CSV columns | `src/pages/Admin.tsx` → `exportCsv()` |

## Deployment

### Vercel (fastest)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/themakershousechaple-max/tmht-children-ministry&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY,VITE_CAPACITY,VITE_VOLUNTEERS,VITE_ENABLE_SMS)

1. Click the button  
2. Connect GitHub repo  
3. Add the environment variables above  
4. Deploy – you’re live!

### Manual (any host)
```bash
npm run build        # creates dist/ folder
cp dist/*  ~/public/ # upload to your host
```

## Supabase Setup

1. Create project at [supabase.com](https://supabase.com)  
2. SQL editor → run the migration in `/supabase/migrations/001_check_ins.sql`  
3. Enable Row-Level Security (RLS) policies for `check_ins` table – sample policies provided in the same file  
4. Grab URL & anon key from Settings → API

## Contributing

We welcome PRs! Please branch off `main`, keep commits small, and open an issue first for big changes.

## License

MIT – see [LICENSE](./LICENSE) file. Use freely for any church or non-profit project.

---
**Need help?** Open an issue or email `themakershousechaple@gmail.com`