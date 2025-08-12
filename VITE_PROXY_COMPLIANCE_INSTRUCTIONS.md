# VITE PROXY COMPLIANCE INSTRUCTIONS FOR REPLIT AGENT

====================================================
ZERO TOLERANCE POLICY: Universal Protocol Compliance
====================================================

You MUST comply with the Universal Protocol Standard for ALL code:

- NO hardcoded values, API keys, URLs, model names, provider names, ports, or magic numbers.
- NO random value generation in code (Math.random, Date.now, crypto.randomUUID, etc.).
- ALL configuration (including API endpoints, provider info, timeouts, and keys) must be admin/database/environment-driven.
- ALL API calls from frontend must use RELATIVE paths (e.g. "/api/route")—never hardcoded hostnames or ports.
- You MUST run protocol_check.sh and fix ALL violations before any commit or push.
- Any violation is UNACCEPTABLE and blocks your work.
- If in doubt, run protocol compliance checks and confirm with user.

===================================
VITE PROXY & API CALL INSTRUCTIONS
===================================

## 1. API Routing
- ALL API endpoints must be called from the client as `/api/route` (relative path).
- DO NOT use absolute URLs like `http://localhost:5000/api/...` or any hardcoded port.
- Backend must expose API routes under `/api/`.

## 2. Vite Proxy Configuration
Ensure `vite.config.ts` (or `vite.config.js`) includes the following for backend proxying:

```js
// Example for vite.config.ts
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
}
```
- Replace 5000 with your backend port if different.

## 3. Error Handling in API Calls
- ALWAYS check that the backend response is JSON, not HTML (to catch proxy/misroute issues).
- Example (React/TS):

```typescript
const response = await fetch('/api/your-route');
if (response.headers.get('content-type')?.includes('application/json')) {
  const data = await response.json();
  // Handle data
} else {
  throw new Error('Backend returned HTML instead of JSON. Check Vite proxy config.');
}
```

## 4. Environment Variables
- All configuration, timeouts, model names, API URLs, etc., must come from `.env`, admin panel, or database.
- DO NOT use static values or magic numbers in code.

## 5. Commit/Push Policy
- You MUST run `protocol_check.sh` before any commit or push.
- If any violation is found, STOP and FIX before proceeding.
- No code with violations may be committed or pushed.

## 6. Common Violations to Avoid
- Hardcoded API keys (e.g., `const apiKey = "sk-xxx"`)
- Random generators (`Math.random()`, `Date.now()`)
- Hardcoded URLs, ports, model names, or provider names (`"https://api.openai.com"`, `"gpt-4"`)
- Magic numbers/config in code (`const MAX_SIZE = 1000`)
- API calls that do not use `/api/...` relative path

## 7. If Backend Returns HTML Instead of JSON
- This is a sign of incorrect Vite proxy config or API route.
- Fix proxy config, never bypass with absolute URLs.

================================
EXAMPLE:
// CORRECT: (Client fetch)
fetch('/api/evidence-library')

// INCORRECT:
fetch('http://localhost:5000/api/evidence-library')
fetch('http://127.0.0.1:5000/api/evidence-library')
fetch('https://api.openai.com/')
================================

## REMINDER:
- These instructions are mandatory for all code and workflow changes.
- Non-compliance will block development and deployment.
- Ask the user if any technical or protocol detail is unclear.

LAST UPDATED: 2025-07-27