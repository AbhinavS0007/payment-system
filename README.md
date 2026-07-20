# Blue Isle · Payment Request & Approval System

A MERN application for Blue Isle Interiors Pvt. Ltd. Employees raise payment requests, Finance approves them, requests above a threshold need Director approval, payments are recorded with UTR references, and every action lands in an immutable audit trail.

## Roles

| Role | Can do |
|---|---|
| **Employee** | Create/edit own requests, submit, resubmit after send-back, track status |
| **Finance** | Approve / reject / send back submitted requests, record payments, close, view dashboard, export CSV |
| **Director** | Everything Finance can do, plus second-level approval above the threshold, manage team, change settings |

## Request lifecycle

Draft → Submitted → Finance Approved *(only if above threshold)* → Approved → Paid → Closed.
Any review stage can also Reject or Send Back (employee edits and resubmits).
Default Director threshold: ₹50,000 — changeable in Settings.

---

## 1. Setup — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — from MongoDB Atlas (free M0 cluster → Connect → Drivers)
- `JWT_SECRET` — any long random string
- `CLIENT_URL` — your frontend URL (comma-separate multiple, e.g. `http://localhost:5173,https://payments.blueisleinteriors.com`)

Create your first Director account:

```bash
npm run seed
# Email: amlandeep@blueisleinteriors.com  Password: ChangeMe@123
```

Run:

```bash
npm run dev     # local, with reload
npm start       # production
```

## 2. Setup — Frontend

```bash
cd frontend
npm install
cp .env.example .env    # set VITE_API_URL to your backend URL
npm run dev             # http://localhost:5173
```

## 3. Deployment (same pattern as MeetingOS)

**Backend → Render**
1. Push the repo to GitHub.
2. Render → New Web Service → root directory `backend`.
3. Build: `npm install` · Start: `npm start`.
4. Add env vars: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL).
5. In MongoDB Atlas → Network Access → allow `0.0.0.0/0` (or Render's IPs).
6. After first deploy, open Render Shell and run `npm run seed` once.

**Frontend → Vercel**
1. Vercel → New Project → root directory `frontend`.
2. Framework: Vite. Env var: `VITE_API_URL` = your Render URL (no trailing slash).
3. Add a `vercel.json` rewrite so React Router routes work on refresh — already included.

## 4. First steps after going live

1. Log in as Director, change your password via Team page (edit your own user later or reseed).
2. Team → add Finance user and employees.
3. Settings → confirm the ₹50,000 threshold suits you.
4. Raise a test request end-to-end before rolling out.

## Attachments

Invoices/payment proofs are stored as **links** (Google Drive, WhatsApp image link, Cloudinary). This keeps the backend free of file storage. If you later want direct uploads, add Cloudinary's free tier and a small upload endpoint.

## Ideas for phase 2

- Slack webhook: ping #finance when a request is submitted
- Per-project budget caps with warnings at 80%
- Multi-company toggle (Brivanta, Science2Home)
- WhatsApp notification to requester on approval/payment
