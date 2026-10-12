# Vendor Ops

Internal tool for The Good Flea team to manage vendors from first lead to approved vendor:
lead registration, CSV lead imports, applications, discovery calls and reviews, with a shared
activity timeline for every vendor.

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
  header, typed errors, 401 → login). `src/lib/vendor-store.ts` is the API client layer and the UI
  types. No vendor data is kept in browser storage.
- **Backend** (`vendor ops/backend`): Django 6 + DRF, PostgreSQL. Business rules live in services
  (`vendors/services.py`, `tasks/services.py`, `imports/services.py`); views stay thin.
- **Auth**: Django session cookies with CSRF protection. Roles are `Administrator` and `Team Member`
  (a `role` field on a custom user model). Permissions are enforced by the API; the UI only hides
  what a role cannot do.

### Core records

| Model | Purpose |
| --- | --- |
| Vendor | Permanent profile from first lead onwards. Normalized email/phone/Instagram for matching; journey stage, qualification, latest application status, owner, active / outreach flags. |
| LeadIntakeEvent | Each time a vendor enters or re-enters: manual registration, CSV import (with batch), application submission. |
| Application | A formal application; a vendor can have several. Status, reviewer, booth needs, preferred dates, decision. |
| Task | General task (`DISCOVERY_CALL`, `APPLICATION_REVIEW`, `FOLLOW_UP`) with owner, due date, outcome, attempts, callback and call-script details. At most one open discovery call per vendor and one open review per application (database constraints). |
| ActivityEvent | Append-only vendor timeline. Not editable through the API or admin. |
| InternalNote | Typed notes (lead intake, discovery call, qualification, application review, general). |
| ImportBatch | One confirmed CSV import and its summary. |

The frontend shows one **status** per vendor (`lead`, `applied`, `in_review`, `waitlisted`,
`approved`, `declined`, `suspended`), which the API derives from journey stage, qualification and
the latest application.

### Automation (backend)

- **Manual lead** (`POST /vendors/`): normalize contact details → 409 with matches if email, phone or
  Instagram already exists (re-send with `confirm_duplicate: true` to create anyway; vendors are never
  merged, and a matching business name alone is only a hint) → vendor, intake event, activity, and a
  high-priority discovery call for the chosen owner or the team queue, due within 2 business hours
  (next opening if outside business hours).
- **Application** (`POST /applications/`): match the vendor by contact details or create one →
  application, activity, a discovery call (skipped if one is open or the vendor was already reached
  with an "Interested" call) and a review task.
- **CSV import**: preview classifies rows as new / matched / possible duplicate / invalid / skipped;
  confirm re-checks on the server and imports in one transaction. New vendors get a discovery call
  unless the row is marked already contacted, inactive or excluded from outreach.

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

```sh
cd ../backend
python -m venv .venv
.venv\Scripts\activate              # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env              # macOS/Linux: cp .env.example .env — then edit it
python manage.py migrate
python manage.py seed_dev           # demo users + vendors; prints the generated passwords
python manage.py runserver 8000
```

`seed_dev` only runs with `DJANGO_DEBUG=true` and does nothing if vendors already exist. Pass
`--password` to choose the demo password. To add real users: `python manage.py createsuperuser`, then
set roles in the Django admin (`/admin/`) or via `POST /api/v1/users/` as an administrator.

### 3. Frontend (this repo)

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

| Endpoint | Methods | Notes |
| --- | --- | --- |
| `health/` | GET | Public. Checks the database. |
| `auth/csrf/`, `auth/login/`, `auth/logout/`, `auth/me/` | GET/POST | Session auth. |
| `team/` | GET | Active users for owner pickers. |
| `users/` | GET, POST, PATCH | Administrators only. |
| `vendors/` | GET, POST | Filters: `status` (comma list), `application_status`, `lead_source`, `owner` (`me`/`none`/id), `call` (`due`/`none`), `created_after/before`, `search`, `ordering`. |
| `vendors/{id}/` | GET, PATCH | Owner / active / outreach flags: administrators only. |
| `vendors/{id}/status/` | POST | `{status, note}`; team members may only move a lead to `applied`. |
| `vendors/{id}/qualification/` | POST | Administrators only. |
| `vendors/{id}/activity/` | GET | Read-only timeline. |
| `vendors/{id}/notes/` | GET, POST | Internal notes. |
| `vendors/duplicates/` | GET | `email`, `phone`, `instagram`, `brand_name`, `exclude`. |
| `applications/`, `applications/{id}/` | GET, POST, PATCH | Status/reviewer changes: administrators only. |
| `tasks/`, `tasks/{id}/` | GET, POST, PATCH | Team members see their own tasks plus the unassigned queue, and can claim queue tasks. Filters: `owner`, `task_type`, `status`, `is_open`, `vendor`, `due_before`. |
| `tasks/{id}/log-call/` | POST | `{outcome, notes, callback_at, call_details}`. |
| `imports/vendors/preview/`, `imports/vendors/confirm/` | POST (multipart `file`) | Administrators only; `include_lines` imports chosen possible duplicates. |

Lists are paginated (`page`, `page_size` up to 500) and return `{count, next, previous, results}`.
Unauthenticated requests get 401; forbidden ones 403.

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

## Not in this milestone

Invoices and payments, bookings and inventory, Stripe/Shopify, market preparation, the public
application form, and the customers pages (still mock UI). Market weekends, payments and customers
routes are unchanged prototypes.
