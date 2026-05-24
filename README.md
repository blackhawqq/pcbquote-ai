# PCBQuote AI — Production SaaS Platform

> Intelligent PCB Manufacturing Cost Estimation — Built by 4 AI Agents

## Architecture Overview

```
pcbquote-ai/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, Register pages
│   │   ├── (dashboard)/      # Protected dashboard pages
│   │   │   ├── dashboard/    # Main dashboard
│   │   │   ├── upload/       # New quote creation + Gerber upload
│   │   │   ├── quotes/       # Quote history + detail view
│   │   │   ├── subscription/ # Stripe subscription management
│   │   │   └── settings/     # User settings + API keys
│   │   ├── (admin)/          # Admin panel (ADMIN role only)
│   │   └── api/              # REST API routes
│   │       ├── auth/         # NextAuth + registration
│   │       ├── quotes/       # Quote CRUD
│   │       ├── upload/       # File upload (S3)
│   │       ├── stripe/       # Checkout + webhooks
│   │       ├── keys/         # API key management
│   │       ├── admin/        # Admin analytics
│   │       └── user/         # User settings
│   ├── engine/               # PCB Engineering Engine
│   │   ├── pcb-calculator.ts # Core cost calculation formulas
│   │   ├── dfm-analyzer.ts   # DFM rules engine (IPC-2221)
│   │   ├── gerber-parser.ts  # Gerber/ZIP file parser
│   │   └── pdf-generator.ts  # PDF quote generation
│   ├── lib/                  # Core utilities
│   │   ├── auth.ts           # NextAuth configuration + RBAC
│   │   ├── prisma.ts         # Database client
│   │   ├── stripe.ts         # Stripe integration
│   │   ├── redis.ts          # Redis caching + rate limiting
│   │   ├── s3.ts             # AWS S3 file storage
│   │   └── email.ts          # Nodemailer email system
│   ├── components/           # React components
│   │   ├── ui/               # Base UI components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   └── landing/          # Landing page components
│   └── types/                # TypeScript type definitions
├── prisma/
│   └── schema.prisma         # Full database schema
├── docker/
│   └── Dockerfile            # Production Docker image
├── docker-compose.yml        # Full stack deployment
└── scripts/
    └── seed.ts               # Database seeder
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + custom design system |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (credentials + OAuth) |
| Cache | Redis (rate limiting + caching) |
| Payments | Stripe (subscriptions + webhooks) |
| Storage | AWS S3 (Gerber files + PDFs) |
| Email | Nodemailer (SMTP) |
| PDF | pdf-lib |
| Deployment | Docker + Docker Compose + Nginx |

## Quick Start

### 1. Install dependencies

```bash
cd pcbquote-ai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Start services (Docker)

```bash
docker-compose up postgres redis -d
```

### 4. Initialize database

```bash
npm run db:push
npm run db:seed
```

### 5. Start development server

```bash
npm run dev
```

Open http://localhost:3000

**Default credentials:**
- Admin: `admin@pcbquote.ai` / `Admin@123!`
- Demo: `demo@pcbquote.ai` / `Demo@123!`

## Production Deployment

```bash
# Full stack with Docker Compose
cp .env.example .env.local
# Fill in .env.local
docker-compose up -d
```

## Stripe Setup

1. Create products in Stripe Dashboard:
   - PCBQuote AI Pro Monthly ($49/mo)
   - PCBQuote AI Pro Yearly ($39/mo)
   - PCBQuote AI Enterprise Monthly ($199/mo)
   - PCBQuote AI Enterprise Yearly ($159/mo)

2. Copy price IDs to `.env.local`

3. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

## Subscription Plans

| Feature | Free | Pro | Enterprise |
|---------|------|-----|-----------|
| Quotes/month | 5 | Unlimited | Unlimited |
| Gerber Upload | ✅ | ✅ | ✅ |
| DFM Analysis | ✅ | ✅ | ✅ |
| PDF Export | Watermarked | Clean | Clean |
| API Access | ❌ | ✅ | ✅ |
| CSV Export | ❌ | ✅ | ✅ |
| Team Accounts | ❌ | ❌ | ✅ |
| White-label | ❌ | ❌ | ✅ |
| ERP Integration | ❌ | ❌ | ✅ |
| Price | $0 | $49/mo | $199/mo |

## PCB Engineering Engine

The core estimation engine uses production-calibrated formulas:

- **Material cost**: FR4 base + layer stackup + copper weight multipliers
- **Manufacturing cost**: Setup + drilling + surface finish + yield loss
- **Assembly cost**: SMT placement rates + TH labor + soldering
- **DFM analysis**: IPC-2221 compliant rules (trace width, spacing, aspect ratio)
- **Yield estimation**: Complexity-adjusted expected good boards
- **Lead time**: Calculated from complexity, layer count, and assembly requirements

## API Reference

```
POST /api/quotes          Create a new quote
GET  /api/quotes          List quotes (paginated)
GET  /api/quotes/[id]     Get quote details
DEL  /api/quotes/[id]     Delete a quote
POST /api/quotes/[id]     Generate PDF

POST /api/upload          Upload Gerber file (returns parsed specs)

POST /api/stripe/checkout Create checkout session or portal session
POST /api/stripe/webhook  Stripe webhook handler

GET  /api/keys            List API keys
POST /api/keys            Create API key
DEL  /api/keys            Revoke API key

GET  /api/admin           Admin analytics (ADMIN only)
GET  /api/health          Health check
```

## Security

- Rate limiting on all API endpoints (Redis-backed)
- RBAC (USER / ADMIN / SUPER_ADMIN)
- JWT sessions via NextAuth
- Passwords hashed with bcrypt (cost 12)
- API keys hashed (stored hash only, shown once)
- File upload validation (type + size)
- Security headers (X-Frame-Options, CSP, etc.)
- GDPR: Users can delete their accounts and data
- Audit logs for all sensitive actions

---

Built with PCBQuote AI Multi-Agent System
- Agent 1: System Architect (backend, DB, API, security)
- Agent 2: PCB Engineering Engine (calculations, DFM, Gerber, PDF)
- Agent 3: Frontend & UX Director (UI, dashboard, landing, mobile)
- Agent 4: Business & Growth Strategist (pricing, plans, monetization)
