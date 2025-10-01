# Sanity CMS Integration Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Portfolio Website                        │
│                         (Next.js 15)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Experience Component (Server Component)                  │  │
│  │  src/components/Sections/Experience.tsx                   │  │
│  │                                                            │  │
│  │  - Async function                                          │  │
│  │  - Fetches data at build time / ISR                       │  │
│  │  - Maintains all original styling & animations            │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│                   │ calls                                        │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Experience Service                                       │  │
│  │  src/lib/experience.ts                                    │  │
│  │                                                            │  │
│  │  getExperience() -> Promise<Experience[]>                │  │
│  │  - Fetches from Sanity                                    │  │
│  │  - ISR with 60s revalidation                              │  │
│  │  - Falls back on error                                    │  │
│  └────────────────┬──────────────────┬──────────────────────┘  │
│                   │                  │                          │
│                   │ SUCCESS          │ ERROR/EMPTY              │
│                   ▼                  ▼                          │
│  ┌────────────────────────┐  ┌────────────────────────────┐   │
│  │   Sanity Client        │  │   Fallback Data            │   │
│  │   src/lib/sanity.ts    │  │   src/constants/           │   │
│  │                        │  │   experience.ts            │   │
│  │  - Project ID          │  │                            │   │
│  │  - Dataset             │  │  - Hardcoded data          │   │
│  │  - CDN in production   │  │  - Always available        │   │
│  └────────────┬───────────┘  └────────────────────────────┘   │
│               │                                                 │
└───────────────┼─────────────────────────────────────────────────┘
                │
                │ GROQ Query
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│                       Sanity CMS                              │
│                    (Cloud Hosted)                             │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Content API (Production Dataset)                             │
│  - Experience documents                                        │
│  - GROQ query endpoint                                        │
│  - CDN cached                                                  │
│  - Public read access                                          │
│                                                                │
└───────────────────────────────────────────────────────────────┘
                ▲
                │ Content Updates
                │
┌───────────────────────────────────────────────────────────────┐
│                    Sanity Studio                              │
│                 (localhost:3333 or deployed)                  │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Content Management UI                                         │
│  - Visual editor for experience entries                        │
│  - Schema validation                                           │
│  - Real-time preview                                           │
│  - Authentication required                                     │
│                                                                │
│  Managed by: pnpm studio:dev                                   │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Setup

```
Developer → Create Sanity Project → Configure .env.local → Run seed script
```

### 2. Content Management

```
Content Manager → Sanity Studio → Edit Experience → Publish
                                                      ↓
                                            Sanity CMS (Cloud)
```

### 3. Data Fetching (Build Time / ISR)

```
Next.js Build/Request → getExperience() → Sanity Client → GROQ Query
                                              ↓
                                        Sanity Content API
                                              ↓
                                     Experience Data (JSON)
                                              ↓
                                      React Component
                                              ↓
                                        HTML Rendering
```

### 4. Fallback Mechanism

```
getExperience() → Sanity Client → Error/Empty
                       ↓
                 Catch Error
                       ↓
                Fallback Data (src/constants/experience.ts)
                       ↓
                React Component (Works Normally)
```

## Key Features

### Incremental Static Regeneration (ISR)

- Pages are generated at build time
- Revalidated every 60 seconds
- New data appears without full rebuild
- Fast response times (cached)

### Fallback Safety

- If Sanity is unreachable → Use hardcoded data
- If dataset is empty → Use hardcoded data
- If error occurs → Log & use hardcoded data
- **Zero downtime** guarantee

### Security

- Read-only public access to published data
- Write access requires authentication token
- Studio requires Sanity account login
- No sensitive data exposed to frontend

## File Structure

```
portfolio/
├── studio/                    # Sanity Studio
│   ├── schemas/
│   │   ├── experience.ts      # Experience schema definition
│   │   └── index.ts           # Schema exports
│   ├── sanity.config.ts       # Studio configuration
│   └── sanity.cli.json        # CLI configuration
│
├── src/
│   ├── lib/
│   │   ├── sanity.ts          # Sanity client instance
│   │   └── experience.ts      # Data fetching service
│   ├── types/
│   │   └── experience.ts      # TypeScript interfaces
│   ├── constants/
│   │   └── experience.ts      # Fallback data
│   └── components/Sections/
│       └── Experience.tsx     # React component (async)
│
├── scripts/
│   └── seed-experience.js     # Data migration script
│
├── .env.example               # Environment variable template
├── .env.local                 # Local environment (gitignored)
├── SANITY_SETUP.md           # Setup documentation
└── README.md                  # Project overview
```

## Environment Variables

```env
# Required - Public (safe to expose)
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123xyz

# Required - Public
NEXT_PUBLIC_SANITY_DATASET=production

# Optional - Private (only for write operations)
SANITY_API_TOKEN=sk_xxx...xxx
```

## Performance Characteristics

### Before Integration (Static)

- Build time: ~20-30s
- Data updates: Requires rebuild & redeploy
- Response time: ~50ms (static HTML)

### After Integration (ISR)

- Build time: ~25-35s (similar)
- Data updates: Visible in 60s (no rebuild)
- Response time: ~50ms (cached) to ~200ms (fresh fetch)
- Fallback: ~50ms (static data)

## Comparison Matrix

| Feature             | Before (Hardcoded)                 | After (Sanity CMS)             |
| ------------------- | ---------------------------------- | ------------------------------ |
| Content Updates     | Requires code changes & deployment | Update via UI, live in 60s     |
| Technical Knowledge | Developer level                    | Non-technical friendly         |
| Version Control     | Git tracked                        | Sanity versioning              |
| Rollback            | Git revert + deploy                | Sanity history                 |
| Collaboration       | Git conflicts                      | Real-time, no conflicts        |
| Validation          | TypeScript only                    | Schema validation + TypeScript |
| Backup              | Git repository                     | Sanity + Git fallback          |
| Downtime Risk       | Low                                | Zero (fallback mechanism)      |
| Setup Complexity    | None                               | One-time Sanity project setup  |
| Running Cost        | None                               | Free (Sanity free tier)        |

## Next Steps

1. **User Setup** (one-time):
   - Create Sanity project
   - Configure environment variables
   - Run seed script (optional)
   - Start Sanity Studio

2. **Daily Usage**:
   - Open Sanity Studio (`pnpm studio:dev`)
   - Add/edit/remove experience entries
   - Publish changes
   - Changes appear in 60s on website

3. **Deployment**:
   - Deploy Sanity Studio: `pnpm studio:deploy`
   - Deploy Next.js app as usual
   - No special deployment steps needed
