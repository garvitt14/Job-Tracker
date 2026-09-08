# Job Tracker — AI Career Workspace

A full-stack MERN application for managing a job search from first discovery through offer. Job Tracker combines a polished drag-and-drop workflow with a connected Groq-powered application agent, analytics, email follow-ups, and a user-initiated Chrome extension.

## What is included

### Modern application workspace

- Five-stage Kanban board: **Wishlist → Applied → Interview → Offer → Rejected**
- Accessible drag handles powered by `@dnd-kit/core`
- Optimistic status updates with automatic rollback and a toast when an API call fails
- Tasteful offer celebration, animated card movement, view transitions, and chart transitions
- Responsive light/dark themes; the selected theme persists in `localStorage`
- Content-shaped skeletons and clear empty states instead of generic spinners
- Recharts analytics for status, application momentum, companies, and AI match scores

### AI Studio (existing Groq integration)

All AI tools continue to use the existing `groq-sdk` client and `openai/gpt-oss-20b` model.

- **Multi-step application agent:** resume match → cover letter → interview questions → follow-up draft. The UI exposes every step and keeps completed outputs if a later step fails.
- **JD-to-resume match:** score, matched/missing terms, and concrete resume changes. Advice explicitly avoids inventing candidate experience.
- **Cover letter:** resume + JD grounded, editable, copyable, and regeneratable with professional or conversational tone.
- **Interview preparation:** technical, behavioral, and role-specific questions, with up to two evidence-based gap areas when match context is available.
- **Follow-up assistant:** drafts an editable stage-aware email and sends only after user approval through the existing Resend integration.
- **Weekly digest:** generated on demand (no persistent scheduler), with weekly totals, status breakdown, stale applications (7+ days), and suggested next actions.

PDF and DOCX processing reuses the existing in-memory resume parser. Raw files are not written to disk.

### Save to Tracker Chrome extension

The Manifest V3 extension in [`extension/`](extension/) runs only on supported LinkedIn and Naukri job pages. It reads the page only after the user opens the popup, lets the user review/edit every extracted field, and sends the confirmed application through the existing authenticated jobs API. It does **not** scrape in the background, poll either platform, or automate applications.

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS dark variant, Framer Motion, dnd-kit, Recharts, Axios
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT, Multer
- **AI:** Groq chat completions
- **Email:** Resend HTTP API (no SMTP/Nodemailer)
- **Deployment:** Vercel frontend + Render backend + MongoDB Atlas

## Local setup

### Prerequisites

- Node.js 20+
- A MongoDB Atlas connection string
- Groq API key
- Resend API key

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend

Copy the example and fill in secrets:

```bash
cp backend/.env.example backend/.env
```

```dotenv
MONGO_URI=mongodb+srv://...
JWT_SECRET=replace-with-a-long-random-secret
GROQ_API_KEY=gsk_...
RESEND_API_KEY=re_...
EMAIL_FROM=Job Tracker <onboarding@resend.dev>
PORT=5000
```

`EMAIL_FROM` is optional and defaults to Resend's onboarding sender. For production sending to arbitrary recipients, use a sender on a domain verified in Resend.

### 3. Configure the frontend

For local development, no frontend environment variable is required: Vite proxies `/api` to `http://127.0.0.1:5000`.

For Vercel, set:

```dotenv
VITE_API_URL=https://your-render-service.onrender.com/api
```

### 4. Run both services

In separate terminals:

```bash
cd backend
npm start
```

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## Chrome extension installation (unpacked)

1. Clone/download this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository's `extension` directory.
6. Pin **Save to Job Tracker** from Chrome's extensions menu.
7. Open the extension popup, open API settings (`•••`), and enter the Render backend URL, for example:
   `https://your-render-service.onrender.com/api`
8. Sign in with the same Job Tracker account used in the web app.
9. Visit a supported LinkedIn or Naukri job detail page, open the popup, review the extracted title/company/JD, and click **Save to Tracker**.

The extension stores the JWT in `chrome.storage.local`. Disconnect from the popup to remove it. Host access is limited to supported job-detail paths, Render backends, and local backend development. If the backend moves to a custom domain, add that exact origin to `extension/manifest.json` under `host_permissions`, then reload the unpacked extension.

## API additions

All routes below require `Authorization: Bearer <JWT>`.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/ai/score-file` | Score PDF/DOCX against a JD and return actionable suggestions |
| `POST` | `/api/ai/cover-letter-file` | Generate a grounded cover-letter draft |
| `POST` | `/api/ai/interview-questions` | Generate grouped interview questions |
| `POST` | `/api/ai/follow-up-draft` | Generate an editable follow-up draft |
| `GET` | `/api/ai/digest` | Generate the current on-demand weekly digest |
| `POST` | `/api/jobs/:id/follow-up/send` | Send an approved follow-up through Resend and persist send metadata |

The jobs schema changes are additive: `Wishlist`, contact email, activity timestamps, follow-up metadata, and extension source metadata. Existing status values and application documents remain valid.

## Validation

```bash
cd frontend
npm run lint
npm run build

cd ../backend
node --check server.js
node --check routes/ai.js
node --check routes/jobs.js
```

## Deployment notes

- No persistent worker or scheduler is required. The digest is generated when requested.
- Uploaded resumes stay in process memory only long enough to extract text and complete the request.
- Keep `GROQ_API_KEY`, `RESEND_API_KEY`, `JWT_SECRET`, and `MONGO_URI` only in Render environment settings—never in the frontend or extension.
- Vercel must receive `VITE_API_URL` at build time.
