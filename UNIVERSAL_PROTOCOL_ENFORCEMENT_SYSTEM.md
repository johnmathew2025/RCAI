# UNIVERSAL PROTOCOL ENFORCEMENT SYSTEM

## EMBEDDED COMPLIANCE REQUIREMENTS

### Universal Protocol & VITE Proxy Compliance for Every Code Change

**MANDATORY FOR ALL DEVELOPMENT WORK:**

1. **Never bypass or remove .husky/pre-commit and .husky/pre-push hooks.**
   - These hooks run protocol_check.sh and block any commit or push if violations exist.
   - Always run protocol_check.sh and resolve all violations before every commit or push.
   - If any violation is found, you must STOP, fix the code, and rerun the check until it passes.

2. **Ensure ALL API calls from frontend use only relative /api/route paths.**
   - Do NOT use absolute URLs or hardcoded ports in client code.
   - Always check that vite.config.ts (or vite.config.js) includes the required proxy config for /api routes.
   - Update or fix proxy config whenever API routing changes.

3. **Embed and display compliance instructions at the start of every development session.**
   - Display VITE PROXY COMPLIANCE INSTRUCTIONS in every compliance script output.
   - Never ignore or skip these instructions.
   - If in doubt, STOP and ask the user for clarification or review.

4. **Document every compliance action in commit messages or PRs.**

5. **Any attempt to commit or push code with protocol or proxy violations is a critical error and must be reported to the user immediately.**
   - No exceptions are allowed.

## ZERO TOLERANCE ENFORCEMENT

### Universal Protocol Standard Compliance
- NO hardcoded values, API keys, URLs, model names, provider names, or magic numbers are allowed.
- All configuration must be admin/database/environment-driven.
- No random value generation (Math.random, Date.now, etc.) in code—use only approved, deterministic, or admin-driven methods.
- Run protocol_check.sh before every commit or push.
- Any violation is unacceptable and will be blocked.
- If in doubt, always check protocol compliance before you commit.

### Vite Proxy Configuration Requirements
- ALL API calls from frontend must use relative paths: `/api/route`
- NO hardcoded ports or absolute URLs in client code
- vite.config.ts must include proper proxy configuration:
  ```js
  export default {
    server: {
      proxy: {
        '/api': 'http://localhost:5000'
      }
    }
  }
  ```

### Error Handling Requirements
- Always check backend responses are JSON, not HTML
- Implement proper error handling for proxy/routing issues
- Never bypass proxy with absolute URLs

## ENFORCEMENT MECHANISMS

### Pre-commit/Pre-push Hooks
- `.husky/pre-commit` runs protocol_check.sh
- `.husky/pre-push` runs protocol_check.sh
- Both block operations if violations found

### Compliance Scripts
- `protocol_check.sh` - Main compliance checker
- `protocol-violation-scanner.js` - Smart pattern detection
- Both display Vite Proxy Compliance Instructions

### Documentation
- `VITE_PROXY_COMPLIANCE_INSTRUCTIONS.md` - Complete instructions
- `UNIVERSAL_PROTOCOL_ENFORCEMENT_SYSTEM.md` - This document
- `replit.md` - Project-specific compliance status

## COMMON VIOLATIONS TO PREVENT

### Critical Violations
- Hardcoded API keys: `const apiKey = "sk-xxx"`
- Random generators: `Math.random()`, `Date.now()`
- Hardcoded URLs: `"https://api.openai.com"`, `"http://localhost:5000"`
- Magic numbers: `const MAX_SIZE = 1000`
- Absolute API calls: `fetch('http://localhost:5000/api/route')`

### Correct Patterns
- Environment variables: `process.env.API_KEY`
- Admin panel configuration: `admin.getModel()`
- Relative API calls: `fetch('/api/route')`
- Dynamic configuration: `config.getTimeout()`

## COMPLIANCE VERIFICATION

Before every commit/push:
1. Run `./protocol_check.sh`
2. Verify all API calls use relative paths
3. Check vite.config.ts proxy configuration
4. Ensure no hardcoded values exist
5. Resolve ALL violations before proceeding

## ESCALATION PROTOCOL

If violations are found:
1. STOP all development work
2. Fix the identified violations
3. Rerun compliance checks
4. Only proceed when ALL checks pass
5. Document fixes in commit message

**NO EXCEPTIONS ALLOWED - ZERO TOLERANCE POLICY**

Last Updated: 2025-07-27