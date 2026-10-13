# Frontend deployment

The GitHub Actions workflow builds and publishes the static SPA to the DigitalOcean droplet. The complete one-time setup, environment, TLS, health-check, and rollback instructions are in `DEPLOYMENT.md` in the backend repository.

Production intentionally uses `VITE_API_BASE=/api/v1`; Nginx provides a same-origin API proxy at `ops.thegoodflea.com`, so Django session and CSRF cookies work without production CORS.
