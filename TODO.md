# 📋 Next Development Milestones & Roadmap

> **Current State Saved**: Backend basic auth routes (`/api/auth/register`, `/api/auth/login`), local IndexedDB fallback, Convex schema, and CI/CD pipeline are in place.

---

## 🎯 High-Priority To-Do List (Next Application Startup)

### 1. 🎨 Dedicated Frontend Authentication Interface
- [ ] Build a dedicated, full-screen iOS-styled **Login & Sign-Up Screen** (`src/components/auth/AuthScreen.tsx`).
- [ ] Include email/password input validation, show/hide password toggle, and forgot password flow.
- [ ] Implement seamless transition between Guest/Demo mode and Authenticated account mode.
- [ ] Add user profile settings drawer with avatar customization, password reset, and currency preferences.

---

### 2. 🔐 Dual-Token Authentication System (Access & Refresh Tokens)
- [ ] Implement **Short-Lived Access Tokens** (JWT, ~15 minutes expiry) for fast, stateless API authentication.
- [ ] Implement **Long-Lived Refresh Tokens** (JWT / secure random token, ~30 days expiry) stored securely (httpOnly cookies or secure storage).
- [ ] Build token rotation endpoint: `POST /api/auth/refresh` to automatically issue new access tokens without logging the user out.
- [ ] Create Axios / Fetch API client interceptor (`src/services/api.ts`) that automatically handles 401 errors by requesting a token refresh and retrying the failed request seamlessly.

---

### 3. 🛡️ Enterprise Security Checks & Middleware Protection
- [ ] Implement Express Authentication Middleware (`server/middleware/authMiddleware.ts`) to verify JWT tokens on all private API calls (`/api/trips`, `/api/expenses`, `/api/settlements`, `/api/sync`).
- [ ] Implement session validation & revocation table in database (`user_sessions` or `refresh_tokens`).
- [ ] Enforce cryptographic password hashing using `bcrypt` / `argon2` before storing user credentials.
- [ ] Add security headers (Helmet), Rate Limiting (`express-rate-limit`) on `/api/auth/*` endpoints to prevent brute-force attacks, and CORS origin restriction.
- [ ] Ensure RBAC token claims match requested trip operations to prevent privilege escalation.

---

## 🚀 Quick Commands to Resume

```bash
# 1. Start backend server
npm run server

# 2. Start frontend dev server
npm run dev

# 3. Run unit tests
npx vitest run

# 4. Refresh documentation
npm run docs
```
