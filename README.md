# BLACKGATE™

Intake infrastructure for **Blackline Public Adjusters LLC**. The front door for every claim entering BLACKLINE — ClaimSaver+ / thePolicyLine referrals, attorney partners, or cold traffic (web, phone, walk-in, ads, word of mouth).

Intake first. Referral funnel second.

Runs beside [BLACKBOX](../blackbox) (`:3000`) and [BLACKMIRROR](../blackmirror) (`:3001`) on **port 3002**.

## What it is

| Surface | Route | Audience |
|---|---|---|
| Public landing | `/` | Anyone |
| Standalone intake | `/intake` | Ads, QR codes, business cards |
| Embeddable form | `/embed` | iframe on ClaimSaver+ / thePolicyLine |
| Referral link | `/r/claimsaver`, `/r/policyline`, `/r/rivera` | Pre-filled source, still editable |
| Staff sign-in | `/login` | Gatekeepers / intake staff |
| Triage queue | `/queue` | Gatekeeper |
| Staff intake | `/intakes/new` | Phone / walk-in |
| Source dashboard | `/sources` | Volume + conversion by channel |
| Checklist config | `/checklists` | Per claim-type requirements |

The public routes do **not** render internal BLACKGATE navigation.

## Data model

- **Intake** — umbrella record for every prospective claimant
- **IntakeSource** — lookup table (`referral_claimsaver`, `direct_phone`, …). Add a row instead of a migration.
- **Referral** — only when the source is a referral type
- **TriageDecision** — accepted / declined / needs-info
- **IntakeForm** — dynamic schema per claim type (property, PIP, denied)
- **ChecklistTemplate / ChecklistItemDef** — configurable document checklist
- **IntakeDocument** — files tied to the intake (and optionally a checklist row)
- **HandoffLog** — audit of intake → BLACKBOX claim conversion

Source capture is **required on every path**, including the direct form.

## Local setup

```bash
cp .env.example .env
cp .env.example .env.local
npm install
npx prisma db push
ALLOW_DESTRUCTIVE_SEED=1 npm run db:seed
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

Employees sign in with the **same email and password as BLACKBOX** (shared `Adjuster` directory). Set `DATABASE_URL` and `DIRECT_URL` to the BLACKBOX Supabase pooler — locally and on Vercel.

Lookup rows (sources, checklists) can be created without wiping claims:

```bash
npm run db:bootstrap
```

## Integrations

| Direction | Endpoint | Notes |
|---|---|---|
| Inbound | `POST /api/webhooks/claimsaver` | Header `X-Webhook-Secret` |
| Inbound | `POST /api/webhooks/policyline` | Same |
| Inbound | `POST /api/webhooks/partner` | Attorney / generic partner |
| Outbound | BLACKBOX `POST /api/claims/intake` | Promote accepted intake |
| Outbound | BLACKMIRROR field tasks | Missing damage photos |
| Outbound | BLACKLEDGER `POST /api/referral-tags` | Fee-bearing sources |
| Inbound | BLACKLEDGER `GET /api/ledger/partners` | Read-only partner list for splits |

When `BLACKBOX_DRY_RUN=1` or no API key is set, promote still closes the loop and writes a `HandoffLog` with a simulated `BL-YY-####` so the staff UI is usable without BLACKBOX running.

### Example ClaimSaver+ webhook

```bash
curl -X POST http://localhost:3002/api/webhooks/claimsaver \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: dev-claimsaver-secret" \
  -d '{
    "firstName": "Ava",
    "lastName": "Mendez",
    "email": "ava@example.com",
    "phone": "3055550199",
    "claimType": "PIP",
    "dateOfAccident": "2026-08-01",
    "insuranceCompany": "GEICO",
    "policyNumber": "FL-100"
  }'
```

### Embed

```html
<iframe
  src="https://gate.example.com/embed?src=referral_claimsaver"
  title="BLACKGATE intake"
  style="width:100%;min-height:920px;border:0"
></iframe>
```

`/embed`, `/intake`, and `/r/*` send `Content-Security-Policy: frame-ancestors *` so marketing sites can iframe them without exposing staff chrome.

## Accent

Amber / gold marks gate state: pulsing amber while the gate is open (submitted, in review, needs info); solid gold when closed accepted / promoted; coral when declined.

## UPL posture

Public and staff copy states that Blackline is a public adjusting firm, not a law firm; that submit is an intake request only; and that representation starts only after acceptance and a written agreement.
# blackgate
