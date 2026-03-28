# Leaderboard & Points System — Implementation Prompt for Claude

---

## Project Context

This is **LinkAge** — a Next.js 14 (App Router) + Supabase + Tailwind CSS + shadcn/ui application that connects seniors (who post questions/problems) with student helpers (who answer them). The project uses:

- **Next.js 14.2.3** with App Router and server components
- **Supabase** (PostgreSQL + Storage) via `supabaseAdmin` from `@/lib/supabase-server`
- **Authentication** via custom session cookies using `getSession()` from `@/lib/auth`
- **TypeScript** throughout — types are in `/types/index.ts`
- **Tailwind CSS + shadcn/ui** — components in `/components/ui/`
- **lucide-react** for icons
- No Redux, no Zustand — all server-side data fetching via async server components + direct Supabase calls

### Current folder structure (relevant parts):
```
app/
  api/
    requests/route.ts         # GET + POST requests
    requests/[id]/route.ts    # GET single request
    requests/[id]/accept/route.ts  # POST accept solution (new)
    responses/route.ts        # POST submit response
  helper/
    dashboard/page.tsx        # Helper stats + recent activity
    browse/page.tsx           # Browse open requests
    answer/[id]/page.tsx      # Submit answer to a request
    layout.tsx
  senior/
    dashboard/page.tsx
    my-requests/page.tsx
    new-request/page.tsx
  owner/                      # Admin panel
  (auth)/                     # Login/register pages
components/
  RequestCard.tsx
  AcceptSolutionButton.tsx    # (new) Senior acceptance button
  NavBar.tsx
  ui/                         # shadcn components
lib/
  auth.ts
  supabase-server.ts
types/index.ts
supabase-schema.sql
```

### Current DB schema (key tables):
```sql
users (id, email, name, role ['senior'|'helper'|'owner'], phone, language_preference, college_domain, college_name, is_email_verified, is_kyc_verified, created_at)

requests (id, senior_id, title, description, audio_url, language, category, status ['open'|'answered'|'closed'], expires_at, created_at)

responses (id, request_id, helper_id, video_url, text_content, call_url, response_type ['video'|'text'|'video_call'], is_approved, is_rejected, accepted_by_senior, rejection_reason, reviewed_by, reviewed_at, is_kyc_response, created_at)
```

### Critical rules — DO NOT break:
1. Do NOT modify `lib/auth.ts`, `lib/supabase-server.ts`, or any existing auth/login flow.
2. Do NOT change existing API routes — only add new ones.
3. Do NOT change `RequestCard.tsx`, `NavBar.tsx`, or any existing component logic.
4. Do NOT change the senior or owner dashboards.
5. Every new file must be TypeScript (`.tsx` or `.ts`). No JavaScript files.
6. Use `supabaseAdmin` from `@/lib/supabase-server` for all DB calls.
7. Use `getSession()` from `@/lib/auth` for authentication.
8. All new pages must have `export const dynamic = 'force-dynamic'` at the top.
9. Run `npm run build` at the end to verify zero TypeScript/build errors.

---

## Feature to Implement: Strava-Style Leaderboard & Points System

### 1. Points System Design

Implement a tiered point-earning system for **helpers only**:

| Event | Points |
|---|---|
| Response submitted (any type) | +5 |
| Response approved by admin (video) | +15 |
| Response accepted by senior (`accepted_by_senior = true`) | +50 |
| First response of the day (streak bonus) | +10 |
| 5 accepted solutions milestone | +100 one-time bonus |
| 10 accepted solutions milestone | +250 one-time bonus |
| 25 accepted solutions milestone | +500 one-time bonus |

**Rank Tiers** (Strava/Cult-style, based on total points):

| Tier | Points Range | Badge Label | Color |
|---|---|---|------|
| 🌱 Seedling | 0–99 | New Helper | Green |
| 🔵 Helper | 100–299 | Active Helper | Blue |
| ⭐ Star | 300–699 | Rising Star | Yellow |
| 🔥 Champion | 700–1499 | Community Champion | Orange |
| 💎 Legend | 1500+ | LinkAge Legend | Purple |

---

### 2. Database — New Tables & Columns

#### New table: `helper_points`
```sql
CREATE TABLE IF NOT EXISTS helper_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,  -- e.g. 'response_submitted', 'accepted_by_senior', 'milestone_5'
  reference_id UUID,     -- response_id or request_id that triggered the points
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_helper_points_helper_id ON helper_points(helper_id);
```

#### New computed column (NOT a real column — query-time computed):
- Total points per helper: `SUM` of `helper_points.points` grouped by `helper_id`
- Rank is computed at query time, not stored.

#### New table: `helper_streaks`
```sql
CREATE TABLE IF NOT EXISTS helper_streaks (
  helper_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  last_active_date DATE,
  longest_streak INT DEFAULT 0
);
```

Provide the full SQL migration as a file `migration-leaderboard.sql` to run in Supabase SQL Editor.

---

### 3. Points Award Logic — New Utility

Create `lib/award-points.ts`:
```typescript
// Utility to award points to a helper. Call this from API routes.
export async function awardPoints(
  helperId: string,
  points: number,
  reason: string,
  referenceId?: string
): Promise<void>
```

This function must:
- Insert a row into `helper_points`
- Check milestone thresholds (5, 10, 25 accepted solutions) and award bonus if just crossed
- Update `helper_streaks` — if `last_active_date` is today, keep streak; if yesterday, increment; else reset to 1. Award +10 first-daily-response bonus if this is the first action today.
- Be idempotent-safe for milestones (check if milestone bonus already awarded using `reason LIKE 'milestone_%'`).

---

### 4. Hook Into Existing Events (Minimal Invasive Changes)

Only these two existing API routes need small additions — add a single `awardPoints()` call, nothing else changes:

#### `app/api/responses/route.ts` — after successful insert:
```typescript
// Add after: const { data, error } = await supabaseAdmin.from('responses').insert(...).select().single();
// If no error:
await awardPoints(user.id, 5, 'response_submitted', data.id);
// If response is video (auto-approved=false), admin will award points on approval separately.
```

#### `app/api/requests/[id]/accept/route.ts` — after updating `accepted_by_senior`:
```typescript
// Award 50 points to the helper whose response was accepted
await awardPoints(acceptedResponse.helper_id, 50, 'accepted_by_senior', response_id);
```

#### New: `app/api/admin/approve-response/route.ts` (if not existing):
If there's no existing admin approval API, create `app/api/admin/approve-response/route.ts` — a PATCH endpoint (owner role only) that approves a video response and awards +15 points to the helper.

---

### 5. New API Endpoints

#### `GET /api/leaderboard`
Query params: `scope` = `college` | `regional` | `national` (default: `national`)

For `college` scope: filter by current user's `college_domain`.
For `regional` scope: not yet defined — use `college_name` grouping (top colleges by total points per college — return college-level aggregates AND top individual per college).
For `national` scope: all helpers nationwide.

Returns top 50 helpers with:
```json
{
  "data": [
    {
      "rank": 1,
      "helper_id": "...",
      "name": "...",
      "college_name": "...",
      "college_domain": "...",
      "total_points": 1250,
      "accepted_count": 18,
      "response_count": 42,
      "tier": "Champion",
      "streak": 7,
      "profile_picture_url": "..."
    }
  ],
  "my_rank": { ...same shape, with user's own rank even if outside top 50 }
}
```

#### `GET /api/helpers/[id]/stats`
Returns full stats for a helper: point breakdown by reason, tier, streak, milestones achieved.

---

### 6. New Pages

#### `app/helper/leaderboard/page.tsx`
- Server component, fetches leaderboard via `supabaseAdmin` directly (not via API route).
- **Three tabs**: College 🏫 | Regional 🗺️ | National 🇮🇳
- Tab switching via URL search param `?scope=college|regional|national`.
- **Hero card** at top: current user's rank, points, tier badge, streak.
- **Leaderboard table**: rank number, avatar (initials), name, college, tier badge, points, accepted count.
- Current user's row is highlighted even if outside top 50 (shown at bottom with separator).
- **Podium widget** for top 3 (like Strava segments): 🥇🥈🥉 with names and points.
- Design inspiration: Strava segment leaderboard + Cult.fit achievements — dark cards with glowing tier colors, animated rank numbers, smooth gradient backgrounds per tier.
- Must be **premium, visually stunning** — not a plain table. Use gradient backgrounds, tier-colored glows, rank number animations.

#### `app/helper/my-stats/page.tsx`
- Personal stats page for the logged-in helper.
- Shows: current tier badge (large, with gradient matching tier color), total points, streak (fire emoji if > 3 days), milestone progress bars (e.g. "18/25 accepted for next milestone").
- Points history: last 20 point events in a feed (like a Strava activity feed) — "You earned +50 for accepted solution · 2h ago".
- Link to leaderboard.

---

### 7. Navigation Update

In `app/helper/layout.tsx`, add two nav links:
- 🏆 Leaderboard → `/helper/leaderboard`
- 📊 My Stats → `/helper/my-stats`

Do NOT change `NavBar.tsx` or any shared layout. Only edit `app/helper/layout.tsx`.

---

### 8. Type Updates

In `types/index.ts`, add:
```typescript
export type HelperTier = 'Seedling' | 'Helper' | 'Star' | 'Champion' | 'Legend';

export interface HelperPointEvent {
  id: string;
  helper_id: string;
  points: number;
  reason: string;
  reference_id?: string;
  created_at: string;
}

export interface HelperLeaderboardEntry {
  rank: number;
  helper_id: string;
  name: string;
  college_name?: string;
  college_domain?: string;
  total_points: number;
  accepted_count: number;
  response_count: number;
  tier: HelperTier;
  streak: number;
  profile_picture_url?: string;
}

export interface HelperStreak {
  helper_id: string;
  current_streak: number;
  last_active_date: string;
  longest_streak: number;
}
```

Also add a utility function `getTierFromPoints(points: number): HelperTier` in `lib/tiers.ts` — a pure function mapping points to tier. This is shared between backend and frontend.

---

### 9. Deliverables Checklist

- [ ] `migration-leaderboard.sql` — run in Supabase SQL Editor
- [ ] `lib/award-points.ts` — utility function
- [ ] `lib/tiers.ts` — tier calculation utility
- [ ] `app/api/leaderboard/route.ts` — GET endpoint
- [ ] `app/api/helpers/[id]/stats/route.ts` — GET endpoint
- [ ] `app/helper/leaderboard/page.tsx` — leaderboard UI
- [ ] `app/helper/my-stats/page.tsx` — personal stats UI
- [ ] Edit `app/api/responses/route.ts` — add `awardPoints()` call (nothing else)
- [ ] Edit `app/api/requests/[id]/accept/route.ts` — add `awardPoints()` call (nothing else)
- [ ] Edit `app/helper/layout.tsx` — add two nav links
- [ ] Edit `types/index.ts` — add new types
- [ ] `npm run build` — must pass with 0 errors

### Design Requirements (Non-negotiable):
- Leaderboard and stats pages must look **premium, not like a plain table**.
- Use gradients, tier-colored accents, glowing cards, smooth transitions.
- Typography: large rank numbers (font-black), tier badges as gradient pills.
- Reference aesthetics: Strava segment leaderboard, Cult.fit achievement screen, Duolingo league table.
- Mobile responsive.

---

### Provided for Reference — Current `types/index.ts`:
```typescript
export type UserRole = 'senior' | 'helper' | 'owner';
export type RequestStatus = 'open' | 'answered' | 'closed';
export type ResponseType = 'video' | 'text' | 'video_call';
export type Language = 'english' | 'hindi' | 'tamil' | 'telugu' | 'kannada' | 'malayalam' | 'marathi' | 'bengali';

export interface User {
  id: string; email: string; name: string; role: UserRole;
  phone?: string; language_preference: Language; college_domain?: string;
  college_name?: string; is_email_verified: boolean; is_kyc_verified: boolean;
  profile_picture_url?: string; created_at: string;
}

export interface Request {
  id: string; senior_id: string; title: string; description: string;
  audio_url?: string; language: Language; category: string;
  status: RequestStatus; expires_at?: string; created_at: string;
  senior?: User; responses?: Response[];
}

export interface Response {
  id: string; request_id: string; helper_id: string;
  video_url?: string; text_content?: string; call_url?: string;
  response_type: ResponseType; is_approved: boolean; is_rejected: boolean;
  accepted_by_senior: boolean; rejection_reason?: string;
  reviewed_by?: string; reviewed_at?: string; is_kyc_response: boolean;
  created_at: string; helper?: User; request?: Request;
}
```

---

Start by reading the existing files before touching anything, then implement in this order:
1. SQL migration file
2. `lib/tiers.ts` and `lib/award-points.ts`
3. API routes
4. UI pages
5. Minimal edits to existing files (responses route, accept route, helper layout)
6. Run `npm run build` and fix all errors
