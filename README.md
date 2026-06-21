# LeafBuddy 🌱

**LeafBuddy** is a friendly, lightweight plant care companion app. Track your plants, manage watering schedules, capture progress photos, and receive timely reminders (including push notifications) so your green friends thrive.

Built as a modern full-stack SvelteKit application with an emphasis on delightful mobile-first UX that also shines on desktop.

## ✨ Features

- **My Plants Dashboard**
  - At-a-glance cards with photo carousels (cover + progress shots)
  - Watering status with smart badges (Overdue / Due today)
  - "Mark as watered" button that's only active when it's time
  - Quick add photos, edit plant details & schedule

- **Watering Intelligence**
  - Use recommended intervals or set custom schedules + preferred time
  - Schedule editor lives inside the pencil edit dialog (clean cards)
  - Automatic next-water calculation

- **Progress & Photos**
  - Add and remove progress photos directly from plant cards
  - Carousel navigation with arrows + dots (desktop-friendly)

- **Catalog & Discovery**
  - Browse community plant species
  - Add your own species (with images)

- **Notifications & Reminders**
  - In-app notifications
  - Browser push notifications for due plants
  - Settings to control what you receive

- **Other Nice Touches**
  - Responsive design (excellent on mobile, polished desktop layouts)
  - PWA support
  - Clean, accessible UI components

## 🛠 Tech Stack

- **SvelteKit** + TypeScript
- **Tailwind CSS** + custom UI components (built on bits-ui)
- **Drizzle ORM** + MySQL
- **Lucide icons**
- Push notifications via Web Push API
- Auth (session-based)
- Vite + adapter-node for deployment

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL-compatible database

### 1. Clone & Install
```sh
git clone <your-repo-url>
cd LeafBuddy
npm install
```

### 2. Environment
Create a `.env` file (see `.env.example` if present) with at least:
```env
DATABASE_URL="mysql://user:password@localhost:3306/leafbuddy"
# Optional: other secrets for auth, push keys, etc.
```

### 3. Database
```sh
# Push schema (development)
npm run db:push

# Or generate + migrate
npm run db:generate
npm run db:migrate

# Seed some plant species (optional but recommended)
npm run db:seed
```

### 4. Run the App
```sh
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173). Register or log in and start adding plants!

### Useful Scripts
| Script            | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start dev server                     |
| `npm run build`   | Production build                     |
| `npm run preview` | Preview production build             |
| `npm run check`   | Type check + Svelte check            |
| `npm run db:studio` | Open Drizzle Studio for DB inspection |
| `npm run lint`    | Lint + format check                  |
| `npm run format`  | Auto-format code                     |

## 📦 Deployment

The app uses `@sveltejs/adapter-node`.

### Standard (Node)
1. Build: `npm run build`
2. Set `DATABASE_URL` (and any other required env vars) on your host.
3. Run the server: `node build` (or use your platform's start command).

Works great on Railway, Render, Fly.io, a VPS, etc.

### Docker
A `Dockerfile` (multi-stage) and `.dockerignore` are included for easy containerized deployment.

```sh
# Build the image
docker build -t leafbuddy .

# Run (pass your env vars)
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://..." \
  -e AUTH_SECRET="..." \
  -e VAPID_PUBLIC_KEY="..." \
  -e VAPID_PRIVATE_KEY="..." \
  leafbuddy
```

The container exposes port 3000 by default (override with `PORT` env if needed).

You can also use Docker Compose with a separate MySQL service for full stack.

### Environment Variables
Required for production:
- `DATABASE_URL`
- `AUTH_SECRET` (for auth)
- VAPID keys for push notifications (see `.env.example`)

Optional:
- `PORT` (default 3000)
- `CRON_SECRET` (if using the cron endpoints)

## 🧪 Development Notes

- Recent major UX improvements include:
  - Desktop-friendly carousels + image management
  - Proper confirmation modals (no more `window.confirm`)
  - Responsive settings page
  - Gated watering action + schedule editor consolidated into edit dialog
- Database changes live in `src/lib/server/db/schema.ts`
- Push notification logic: see `src/lib/server/push.ts` and the cron job

## 📝 License

MIT (or whatever you choose)

---

Made with care for plant parents. 🌿

Happy growing!
