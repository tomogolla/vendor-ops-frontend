# Vendor Ops

Internal tool for The Good Flea team to run the vendor sales pipeline (v1.3): applications move
through stages, each application is an order of booth and add-on lines for market weekends, and
administrators confirm, waitlist or decline each line against live capacity. Vendors are permanent
accounts with a derived label, and every vendor has a shared activity timeline.

## Architecture

```
Browser ── SvelteKit SPA (this repo, built to static files)
   │            │
   │  /api/v1/* │  same origin: Vite dev proxy locally, nginx in production
   ▼            ▼
Django + Django REST Framework (../backend, separate repo)  ──  PostgreSQL
```

- **Frontend** (`vendor-ops-frontend`): SvelteKit 3, Svelte 5 runes, Tailwind 4, DaisyUI 5, built with
  `adapter-static` as a single-page app. `src/lib/api.ts` is the fetch wrapper (session cookie, CSRF
  header, typed errors, 401 → login). API client layers map snake_case payloads to camelCase types:
  `src/lib/applications.ts` (applications, lines, stages, billing placeholders, summary),
  `src/lib/catalog.ts` (market weekends, booth variants, add-ons, capacity) and
  `src/lib/vendor-store.ts` (vendors, tasks, activity, notes, CSV imports) and `src/lib/emails.ts` (vendor
  email: messages, drafts, templates, settings, overview). Pure rules the UI relies on
  (board grouping, days in stage, which stage and line actions a role may take, capacity display,
  totals rows) live in those modules and are unit-tested against payloads captured from the backend
  (`src/lib/fixtures/`). No vendor data is kept in browser storage.
- **Money** is integer cents everywhere in code; `formatMoney(cents)` formats it (USD) for display and
  `parseDollars(text)` turns typed dollars into cents. Totals and discounts are always the server's.
- **Backend** (`vendor ops/backend`): Django 6 + DRF, PostgreSQL. Business rules live in services
  (`vendors/pipeline.py`, `vendors/services.py`, `catalog/services.py`, `tasks/services.py`,
  `imports/services.py`); views stay thin.
- **Auth**: Django session cookies with CSRF protection. Roles are `Administrator` and `Team Member`.
  Permissions are enforced by the API; the UI hides what a role cannot do and shows the server's message
  when a request is refused.

### Core records

| Model | Purpose |
| --- | --- |
| Vendor | Permanent account for a brand. Normalized email/phone/Instagram for matching; owner, active / outreach flags and a derived **label**: Prospect, Active (an application is Won), Inactive or Suspended. |
| Application | The pipeline card and the order. **Stage**: New → In review → Awaiting payment → Won, plus Declined and Withdrawn (provisional, shown collapsed). Holds the order discount, billed and first-paid dates, and server-computed totals. |
| ApplicationLine | A booth variant of a market weekend, or an add-on attached to a booth line. Status: requested, confirmed, waitlisted, declined, cancelled. The unit price is a snapshot. |
| MarketWeekend, BoothVariant, AddOn | What is sold. Variants have a capacity; add-ons may. Only confirmed lines use capacity, and they hold it until released. |
| Task | `DISCOVERY_CALL`, `APPLICATION_REVIEW`, `FOLLOW_UP` and `EMAIL_REVIEW` (created with an email draft), linked to the vendor and usually an application. |
| ActivityEvent | Append-only vendor timeline; events can belong to an application. |
| InternalNote, LeadIntakeEvent, ImportBatch | Notes, how a vendor entered, and CSV imports. |

### Pipeline rules (enforced by the backend)

- Every entry (the New application form, the API's vendor registration and CSV import) creates an
  **application at New** with a discovery call task. If the vendor already has an application at New or
  In review, the submission's lines and notes are **bundled** into it instead (the API answers 200 with
  `bundled: true`; the UI shows a notice and opens that application).
- **Calls** move New to In review: logging any attempt on the application's call task does it. After five
  unanswered attempts the call closes and the application is flagged `call exhausted`.
- **Lines** are decided by administrators: Confirm (refused when capacity is short; the server's message
  includes what is left), Waitlist, Decline, and Release hold (reason required; not allowed once the
  application is paid). An add-on is confirmed only after its booth line.
- **Billing placeholders** (`TODO(invoicing)`): Mark billed (In review with a confirmed line → Awaiting
  payment) and Mark first payment received (→ Won, the vendor becomes Active). Real invoices replace them
  in the next release.

## Routes and menu

The menu (Overview, Applications, Vendors, Market weekends, Tasks, Finance, Settings) is defined once in
`src/lib/nav.ts` and rendered by both the sidebar and the mobile dropdown.

| Route | What it is |
| --- | --- |
| `/` | Overview: calls due, applications imported from CSV still at New, stage counts, oldest awaiting payment, capacity alerts, vendor email counts and recent email activity. |
| `/applications` | Board of applications by stage (New, In review, Awaiting payment, Won, collapsed Closed), with a table view. Filters live in the query string (`source`, `owner`, `waitlisted`, `call`, `view`, `stage`, `page`). No drag-and-drop: stage changes go through the application page. |
| `/applications/new` | New application: vendor details (with duplicate warnings), order lines from the catalog, source, notes, discount (administrators) and an optional first call. |
| `/applications/[id]` | Application: totals, order lines and line decisions, call actions, stage actions, vendor timeline and notes. **Emails** tab (`?tab=emails`, `&email=<id>` opens one, `&task=<review task id>` opens that task's email): history, details, draft editing with earlier versions, approve, cancel, New email. |
| `/vendors`, `/vendors/[id]`, `/vendors/[id]/edit` | Vendors by label with search; vendor overview, applications, bookings, compliance, timeline, notes; Suspend / Reinstate (administrators). |
| `/market-weekends`, `/market-weekends/new`, `/market-weekends/[id]`, `/market-weekends/[id]/edit` | Weekends with capacity bars; booked vendors and the waitlist with promotion suggestions; weekend, variant and add-on editing (administrators). |
| `/tasks` | Task Center; tasks open on their application when they have one. Email review tasks (Email Reviews view) have **Review email** instead of Complete: they close when the email is approved or cancelled. |
| `/settings/emails` | Settings → Emails: sending status (chosen vs effective mode), template list, and the message log (`?tab=sending|templates|messages`, `&bucket=` filter). `/settings` redirects here. |
| `/settings/emails/templates/[key]` | Template editor (administrators; others can view and preview): subject, HTML and text, mode, allowed variables, preview with sample or real data. |
| `/finance` | Placeholder until invoices, payments and payers arrive. |
| `/customers`, `/payments` | Mock pages, not in the menu (`TODO(finance)`). |

## Local development

Requirements: Node 24+, Python 3.14, PostgreSQL 16+.

### 1. Database

Create a role and database (the role needs `CREATEDB` so Django can create the test database):

```sql
CREATE ROLE vendor_ops WITH LOGIN PASSWORD 'choose-a-password' CREATEDB;
CREATE DATABASE vendor_ops OWNER vendor_ops;
```

Use `psql`, pgAdmin's Query Tool, or any SQL client.

### 2. Backend (`vendor ops/backend`)

Use the backend branch that carries the v1.3 pipeline (`feat/pipeline-v13` until it is merged).

```sh
cd ../backend
python -m venv .venv
.venv\Scripts\activate              # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env              # macOS/Linux: cp .env.example .env — then edit it
python manage.py migrate
python manage.py seed_dev           # demo users, two market weekends and applications in every stage
python manage.py runserver 8000
```

`seed_dev` only runs with `DJANGO_DEBUG=true` and does nothing if vendors already exist. Pass
`--password` to choose the demo password. To add real users: `python manage.py createsuperuser`, then
set roles in the Django admin (`/admin/`) or via `POST /api/v1/users/` as an administrator.

### 3. Frontend (this repo)

The Vite dev server proxies `/api` to the backend on port 8000, so the session and CSRF cookies are
same-origin. Sign in with a backend user (for example the `seed_dev` users).

```sh
npm install
copy .env.example .env              # optional; defaults work with the backend on :8000
npm run dev                         # http://localhost:5173 — /api is proxied to Django
```

### Environment variables

Backend (`backend/.env`, see `.env.example`):

| Variable | Example | Notes |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | long random string | Required. |
| `DJANGO_DEBUG` | `true` / `false` | `false` in production. |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated. |
| `DATABASE_URL` | `postgres://vendor_ops:pw@localhost:5432/vendor_ops` | Required. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Only needed if the SPA calls the API cross-origin. |
| `CSRF_TRUSTED_ORIGINS` | `https://vendors.example.com` | Origins allowed to POST with cookies. |
| `DJANGO_SECURE_COOKIES` | `true` | Production behind HTTPS: secure cookies, trusts `X-Forwarded-Proto`. |
| `BUSINESS_TIMEZONE` | `America/New_York` | For task due dates. |
| `BUSINESS_DAYS` | `0,1,2,3,4` | 0 = Monday. |
| `BUSINESS_OPEN` / `BUSINESS_CLOSE` | `09:00` / `17:00` | |
| `DISCOVERY_CALL_DUE_BUSINESS_HOURS` | `2` | |

Frontend (`.env`, see `.env.example`):

| Variable | Default | Notes |
| --- | --- | --- |
| `API_PROXY_TARGET` | `http://localhost:8000` | Where `npm run dev` proxies `/api`. |
| `VITE_API_BASE` | `/api/v1` | Change only if the API is on another origin. |

### Commands

| Task | Command |
| --- | --- |
| Backend migrations | `python manage.py makemigrations` / `python manage.py migrate` |
| Seed dev data | `python manage.py seed_dev [--password ...]` |
| Backend tests | `python manage.py test` |
| Run API | `python manage.py runserver 8000` |
| Frontend dev server | `npm run dev` |
| Frontend type check | `npm run check` |
| Frontend tests | `npm test` |
| Frontend production build | `npm run build` (output in `build/`) |

## API overview (`/api/v1/`)

The backend README is the reference; these are the endpoints this frontend uses.

| Endpoint | Methods | Notes |
| --- | --- | --- |
| `health/` | GET | Public. Checks the database. |
| `auth/csrf/`, `auth/login/`, `auth/logout/`, `auth/me/` | GET/POST | Session auth. |
| `team/` | GET | Active users for owner pickers. |
| `applications/` | GET, POST | Filters: `stage` (comma list), `has_waitlisted_lines`, `call` (`none` / `attempted_not_reached`), `owner` (vendor owner: `me` / `none` / id), `source`, `weekend`, `vendor`. POST takes `vendor` or `vendor_data`, `source`, `notes`, `requested_lines`; 200 with `bundled: true` when bundled. |
| `applications/{id}/` | GET, PATCH | Discount fields: administrators only. |
| `applications/summary/` | GET | Counts per stage (same filters) and the 10 oldest awaiting payment. |
| `applications/{id}/stage/` | POST | `{stage, reason}`; administrators. |
| `applications/{id}/lines/` | GET, POST | Any signed-in user may add lines. |
| `application-lines/{id}/` | GET, PATCH, DELETE | Quantity and delete only while requested. |
| `application-lines/{id}/confirm/`, `waitlist/`, `decline/`, `release/` | POST | Administrators; `release` needs `reason`. |
| `applications/{id}/mark-billed/`, `mark-first-payment/` | POST | Administrators; interim placeholders. |
| `market-weekends/` and `{id}/variants/`, `{id}/add-ons/` | GET, POST, PATCH, DELETE | Writes: administrators. Detail includes capacity usage and promotion suggestions. |
| `vendors/` | GET, POST | Filters: `label` (comma list), `search`, `owner`, `lead_source`. |
| `vendors/{id}/`, `vendors/{id}/activity/`, `vendors/{id}/notes/`, `vendors/duplicates/` | GET, PATCH, POST | Profile, timeline, notes, duplicate check. |
| `vendors/{id}/status/` | POST | Deprecated; used only for Suspend (`suspended`) and Reinstate (`approved`). |
| `tasks/`, `tasks/{id}/`, `tasks/{id}/log-call/` | GET, POST, PATCH | Filters include `application`, `task_type`, `is_open`, `owner`, `due_before`. |
| `email/settings/` | GET, PATCH | Stored and effective sending settings; never credentials. PATCH: administrators. |
| `email/templates/`, `email/templates/{key}/`, `.../preview/` | GET, PATCH, POST | PATCH: administrators. Preview renders unsaved edits with sample or application data; it saves nothing. |
| `email/messages/`, `email/messages/{id}/`, `.../revisions/`, `.../approve/`, `.../cancel/` | GET, PATCH, POST | Filters: `application`, `template`, `status`, `bucket`, `search`, `ordering`. PATCH edits a draft. Approve/cancel: administrators, the review task's owner, the application's reviewer. |
| `applications/{id}/emails/` | GET, POST | The application's emails; POST prepares a draft by hand. |
| `email/overview/` | GET | Counts per bucket (each email once) and recent email activity. |
| `imports/vendors/preview/`, `imports/vendors/confirm/` | POST (multipart `file`) | Administrators; every row becomes an application at New. |

Lists are paginated (`page`, `page_size` up to 500) and return `{count, next, previous, results}`.
Unauthenticated requests get 401; forbidden ones 403.

## Vendor email (Slice 2)

Django prepares, schedules and sends every email; this frontend only shows them and calls the API to
edit, approve, cancel or prepare drafts. The backend contract is `backend/docs/email-frontend-guide.md`.

- **Permissions come from the server.** Each email carries `permissions {can_edit, can_approve,
  can_cancel}`; buttons follow them (`messageActions` in `src/lib/emails.ts`). A draft that
  `no_longer_applies` offers only Cancel, because the server refuses to approve it.
- **Email HTML is untrusted.** It is shown only in `EmailPreviewFrame`: an `<iframe sandbox="">` (no
  scripts, forms, popups or navigation) whose document also carries a strict Content-Security-Policy.
  It is never rendered with `{@html}`.
- **Review tasks** (`EMAIL_REVIEW`) cannot be completed from the Task Center; the API refuses it.
  Review email opens the application's Emails tab, which finds the email by its `review_task.id`.
- **Overview counts** use the backend's buckets, so each email is counted once (Sent includes
  delivered). Failed covers failed, bounced and spam reports.
- **Tests**: `src/lib/emails.test.ts` (mapping, rules and API calls with a mocked `fetch`) and
  `src/lib/email-components.test.ts` (components rendered with Svelte's server renderer), both
  against payloads captured from the backend in `src/lib/fixtures/email-*.json`. No real email is sent.

## Deployment (DigitalOcean Droplet)

One Ubuntu Droplet running PostgreSQL, gunicorn (Django) and nginx (static SPA + reverse proxy).

1. **System packages**: `sudo apt install python3-venv postgresql nginx certbot python3-certbot-nginx`
   and Node 24 (for building, or build locally and copy `build/`).
2. **Database**: create the role and database as above with a strong password. Keep PostgreSQL bound
   to localhost. Schedule backups (`pg_dump` cron or DigitalOcean Managed Database / Droplet backups).
3. **Backend**: clone to `/srv/vendor-ops/backend`, create the venv, `pip install -r requirements.txt`,
   write `.env` (`DJANGO_DEBUG=false`, real `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS=vendors.example.com`,
   `CSRF_TRUSTED_ORIGINS=https://vendors.example.com`, `DJANGO_SECURE_COOKIES=true`), then
   `python manage.py migrate`, `python manage.py collectstatic`, `python manage.py createsuperuser`,
   and `python manage.py check --deploy`.
4. **gunicorn** as a systemd service, e.g. `ExecStart=/srv/vendor-ops/backend/.venv/bin/gunicorn
   config.wsgi:application --bind 127.0.0.1:8001 --workers 3`, `EnvironmentFile` not needed because
   settings read `.env`.
5. **Frontend**: `npm ci && npm run build`, copy `build/` to `/srv/vendor-ops/frontend`.
6. **nginx** (one server block):
   ```nginx
   server {
       server_name vendors.example.com;
       root /srv/vendor-ops/frontend;
       location /api/    { proxy_pass http://127.0.0.1:8001; include proxy_params; }
       location /admin/  { proxy_pass http://127.0.0.1:8001; include proxy_params; }
       location /static/ { alias /srv/vendor-ops/backend/staticfiles/; }
       location /        { try_files $uri $uri/ /index.html; }
       client_max_body_size 3m;
   }
   ```
   `proxy_params` must forward `X-Forwarded-Proto`. Then `sudo certbot --nginx -d vendors.example.com`.
7. **Updates**: pull both repos, `pip install -r requirements.txt`, `migrate`, `collectstatic`,
   rebuild the frontend, `sudo systemctl restart gunicorn`.

Never commit `.env` files, database dumps, or real vendor exports.

## Not in this release

Invoices, payments and payers (Stripe/Shopify; the billing actions are interim placeholders), the
calendar view of market weekends, revenue figures, notifications, the public application form, and
the customers and payments pages (still mock UI, unlinked).
