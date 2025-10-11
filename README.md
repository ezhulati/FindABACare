# FindABACare.com - MVP

> **Mission:** Create a trusted community and care discovery platform for families with autistic children to find sensory-friendly venues, micro-events, and predictable social opportunities.

---

## 🎯 Project Overview

FindABACare connects families with autism-friendly places and micro-events in Dallas and Houston. The platform provides:

- **Sensory-Friendly Venues**: Detailed information about quiet rooms, sensory hours, and environmental triggers
- **"Go Now" Meter**: Real-time predictions of venue occupancy (Quiet/Moderate/Busy)
- **Micro-Events**: Small, structured meetups (8-12 attendees) with RSVP management
- **First Visit Kits**: Visual walkthroughs and preparation guides for new venues
- **Community Reviews**: Verified feedback from parents who've visited

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm)
- Supabase account (free tier)
- Mapbox account (for maps)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials (see SUPABASE_SETUP.md)
nano .env

# Run development server
pnpm dev
```

Visit http://localhost:4321

---

## 📚 Documentation

- **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** - Complete 15-phase implementation roadmap
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Step-by-step Supabase configuration
- **[QUICK_START.md](./QUICK_START.md)** - Get up and running in one session
- **[FindABACare.com Product Vision.md](./FindABACare.com%20Product%20Vision.md)** - Product requirements and user stories

---

## 🏗️ Tech Stack

- **Frontend:** Astro 4.x + React + Tailwind CSS
- **Backend:** Astro API routes (Node.js) + Vercel serverless
- **Database:** Supabase (Postgres + Auth + Storage)
- **Maps:** Mapbox GL JS
- **Communications:** Twilio (SMS) + Resend (Email)
- **Analytics:** PostHog

---

## 📁 Project Structure

```
findabacare/
├── src/
│   ├── components/         # Astro & React components
│   ├── layouts/            # Page layouts
│   ├── lib/                # Utilities (db, validation, etc.)
│   └── pages/              # Routes and API endpoints
│       ├── api/            # Backend API routes
│       ├── [city]/         # City-specific pages
│       ├── venue/          # Venue detail pages
│       └── events/         # Events listings
├── supabase/
│   ├── schema.sql          # Database schema
│   ├── seed.sql            # Initial data (cities)
│   └── config.toml         # Supabase configuration
├── scripts/                # Automation scripts
└── public/                 # Static assets
```

---

## 🗄️ Database Schema

**Core Tables:**
- `cities` - Dallas, Houston (expandable)
- `venues` - Sensory-friendly locations with amenities
- `events` - Micro-events and meetups
- `profiles` - User profiles (parent/venue/admin roles)
- `rsvps` - Event registrations
- `reviews` - Venue feedback
- `verifications` - Admin verification queue
- `gonow_cache` - Cached occupancy predictions

See `supabase/schema.sql` for complete schema.

---

## 🎨 Key Features

### For Parents
- Browse autism-friendly venues by city
- Filter by amenities (quiet room, no hand dryers, visual supports)
- View real-time "Go Now" meter
- RSVP to micro-events with calendar integration
- Leave reviews after visits
- Download "First Visit Kits"

### For Venue Managers
- Submit venue information
- Host sensory hours and micro-events
- View RSVP counts and attendee needs (anonymized)

### For Admins
- Verification queue for venues and events
- Bulk CSV import for venues
- Moderation dashboard

---

## 🔐 Environment Variables

Required variables (see `.env.example`):

```bash
SUPABASE_URL=            # Your Supabase project URL
SUPABASE_ANON_KEY=       # Public anon key
MAPBOX_TOKEN=            # Mapbox GL JS token
RESEND_API_KEY=          # Email service (optional)
TWILIO_ACCOUNT_SID=      # SMS service (optional)
```

---

## 📊 MVP Success Metrics (90 Days)

| Metric | Target |
|--------|--------|
| Weekly Active Families (per metro) | ≥500 |
| Avg Outings per Family per Week | ≥1.5 |
| RSVP → Attendance Rate | ≥60% |
| Parent Satisfaction | ≥80% |
| Venue Verification Freshness | ≤30 days |

---

## 🧪 Development Commands

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm typecheck

# Format code
pnpm format
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Set framework preset to "Astro"
3. Add environment variables
4. Deploy

### Environment Variables in Vercel
Add all variables from `.env` to Vercel dashboard:
https://vercel.com/your-project/settings/environment-variables

---

## 📈 Roadmap

### Phase 1: Foundation ✅
- [x] Project setup
- [x] Database schema
- [x] Core utilities

### Phase 2: Core Features (Week 2-3)
- [ ] UI components
- [ ] API routes
- [ ] Authentication

### Phase 3: Polish (Week 4-6)
- [ ] Admin portal
- [ ] Testing & QA
- [ ] Performance optimization

### Phase 4: Launch (Week 7-8)
- [ ] Soft launch in Dallas
- [ ] Full launch in Dallas & Houston

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for complete roadmap.

---

## 🤝 Contributing

This is a private MVP project. For questions or issues, contact the development team.

---

## 📄 License

© 2025 FindABACare.com | All rights reserved

---

## 🆘 Support

- **Setup Issues:** See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Development Guide:** See [QUICK_START.md](./QUICK_START.md)
- **Architecture:** See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)

---

**Built with ❤️ for families navigating autism**
