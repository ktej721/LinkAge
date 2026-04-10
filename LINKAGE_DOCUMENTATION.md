# LinkAge Project Documentation

## 🌟 Overview
**LinkAge** is a "Voice-First" web application designed to bridge the digital divide between generations. It connects senior citizens who need technical assistance with verified college student volunteers ("helpers"). The platform removes friction for seniors by offering a voice-first interface, allowing them to ask questions in their preferred language without needing to type, and volunteers can respond with text, pre-recorded video, or host live video calls to assist them in real-time.

## 🛠 Tech Stack
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **UI & Styling:** Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/), `lucide-react` (Icons), `tw-animate-css`, `tailwindcss-animate`
- **Database & Storage:** [Supabase](https://supabase.com/) (PostgreSQL & Object Storage)
- **Forms & Validation:** `react-hook-form`, `zod`
- **Authentication:** Custom JWT sessions, `bcryptjs` (for helper passwords), `nodemailer` (for Email OTP)
- **Video Calling:** Jitsi Meet (Native URL integration with `postLogoutUrl`)
- **Icons**: Lucide React

## 👥 User Roles & Personas
LinkAge is built around three distinct user roles, each with a dedicated dashboard and protected routing handled by Next.js Middleware:

1. **Senior (`/senior`)**
   - **Login approach:** Frictionless Email OTP (One-Time Password) - no passwords to remember.
   - **Capabilities:** Create help requests using audio recordings, view incoming responses, accept/reject solutions, and join live video calls.
   - **Experience:** Voice-first UI, large typography, high contrast, and translated content.

2. **Helper / Student (`/helper`)**
   - **Login approach:** Email & Password (added via migration to simplify recurring logins for students). Verified against valid college email domains.
   - **Capabilities:** Browse open requests from seniors, submit text or video responses, initiate live Jitsi video calls, and track their leaderboard progress.
   - **Experience:** Fast, list-oriented dashboard, gamified interface with tiers and streaks.

3. **Owner / Admin (`/admin` / `/owner`)**
   - **Login approach:** Secure login.
   - **Capabilities:** Review responses submitted by helpers (approving or rejecting safe/unsafe content), manage KYC/verification, oversee the platform.

## 🔄 Core Flows & Mechanisms

### 1. Request Creation Flow
1. **Initiation:** A senior logs into their dashboard and clicks to create a new request.
2. **Input:** They record their problem using their device's microphone.
3. **Storage:** The audio is uploaded securely to Supabase Storage.
4. **Database:** A new record is created in the `requests` table containing the `audio_url`, `language` preference, and a generated `title`/`description`.
5. **Lifespan:** Requests have an `expires_at` timestamp (typically 24 hours), after which they are considered closed if unsolved.

### 2. Response & Moderation Flow
1. A helper reviews the open requests feed and selects a request to answer.
2. The helper can choose to respond via:
   - **Text:** Direct message context.
   - **Video Recording:** Uploads an MP4/WebM to Supabase Storage.
   - **Live Video Call:** Initiates a Jitsi room.
3. **Safety Review:** Certain responses (like uploaded videos) may trigger an `is_approved = false` default state in the `responses` table, requiring an Admin/Owner to review and approve them before the senior can view them.

### 3. Live Video Call Flow (Jitsi Integration)
1. **Helper Starts Call:** The helper clicks "Start Call Now".
2. **Room Generation:** The system generates a secure Jitsi hash URL (`linkage-[req-id]-[hash]`). A response record of type `video_call` is saved to the database.
3. **Redirection (Helper):** The helper's browser natively navigates to `meet.jit.si/[room-code]`.
   - A configuration hash is appended containing `config.postLogoutUrl` which automatically redirects the helper back to the LinkAge callback URL when they hang up.
4. **Senior Joins:** The senior sees an active call button on their dashboard. Clicking it navigates them natively to the same Jitsi URL with their own `postLogoutUrl` pointing back to their dashboard.
5. **End of Call:** Both users automatically return to the LinkAge app seamlessly without feeling like they got lost on an external website.

### 4. Gamification & Leaderboard System
To keep college students engaged, a robust gamification system is implemented:
- **Points:** Helpers earn points for specific actions (e.g., getting a solution accepted by a senior).
- **Milestones:** Bulk point bonuses are awarded when helpers reach certain response thresholds (e.g., 5, 10, 25 solutions).
- **Streaks:** The system tracks daily activity (`helper_streaks`). Helpers earn a `first_daily_response` bonus to encourage consistent daily log-ins.
- **Tiers:** Helpers are categorized into leveling tiers based on their lifetime points:
  - 🌱 **Seedling** (0-99 points)
  - 🤝 **Helper** (100-299 points)
  - ⭐ **Star** (300-699 points)
  - 🏅 **Champion** (700-1499 points)
  - 👑 **Legend** (1500+ points)
- Visual UI elements (gradients, emojis, colors) dynamically adapt based on the helper's current tier.

## 🗄️ Database Architecture (Supabase SQL)
The PostgreSQL database utilizes UUIDs and restricts standard access via Row Level Security (RLS), relying instead on Next.js server-side API execution using a Service Role Key.

**Key Tables:**
- `users`: Stores emails, roles, KYC status, and college domains.
- `otp_tokens` / `password_reset_tokens`: Manages temporary authentication codes.
- `user_sessions`: JWT alternative for managing active web sessions securely.
- `requests`: Senior-created tickets (`audio_url`, `status`, `expires_at`).
- `responses`: Helper-created answers (`video_url`, `text_content`, `accepted_by_senior`).
- `helper_points`: Audit log of all points awarded to helpers.
- `helper_streaks`: Tracks consecutive daily activity per helper.
