# PRE-DEVELOPMENT COMPLIANCE CHECK - MANDATORY

**PURPOSE**: Prevent protocol violations that cost user time and money
**STATUS**: Mandatory check before ANY code changes
**CREATED**: January 26, 2025

## MANDATORY CHECKLIST - COMPLETE BEFORE ANY DEVELOPMENT

### ☐ 1. UNIVERSAL PROTOCOL STANDARD REVIEW
- [ ] Read UNIVERSAL_PROTOCOL_STANDARD.md completely
- [ ] Understand NO HARDCODING rule (zero tolerance)
- [ ] Confirm path parameter routing: `/api/incidents/:id/endpoint`
- [ ] Verify state persistence requirements
- [ ] Review database schema protocols

### ☐ 2. NO HARDCODING VERIFICATION
**CRITICAL**: Check for ANY hardcoding before proceeding
- [ ] NO Math.random(), Date.now(), static paths
- [ ] NO hardcoded IDs, magic numbers, static keys
- [ ] ALL values must be dynamic/config-driven
- [ ] NO fallback hardcoded values anywhere

### ☐ 3. ROUTING COMPLIANCE CHECK
- [ ] ALL routes use path parameters: `/api/incidents/:id/endpoint`
- [ ] NO query parameter mixing
- [ ] Protocol headers added to routing files
- [ ] Legacy patterns identified for refactoring

### ☐ 4. DATABASE SCHEMA COMPLIANCE
- [ ] Field names match backend schema exactly
- [ ] evidenceResponses field used (NOT evidenceFiles)
- [ ] NO deprecated schema references
- [ ] Proper foreign key relationships

### ☐ 5. STATE PERSISTENCE VERIFICATION
- [ ] Evidence files associated with correct incident ID
- [ ] State persists through ALL workflow stages
- [ ] Backend endpoints match frontend protocol
- [ ] NO state dropping in any workflow step

### ☐ 6. ERROR HANDLING STANDARDS
- [ ] Clear, actionable error messages
- [ ] Proper HTTP status codes
- [ ] NO silent failures
- [ ] User-friendly error guidance

## VIOLATION PREVENTION SYSTEM

### AUTOMATIC CHECKS REQUIRED:
1. **Before ANY code change**: Review this checklist completely
2. **During development**: Reference UNIVERSAL_PROTOCOL_STANDARD.md
3. **Before testing**: Verify NO hardcoding exists
4. **Before completion**: Confirm protocol compliance

### VIOLATION RESPONSE PROTOCOL:
1. **IMMEDIATE STOP**: Halt all development
2. **IDENTIFY VIOLATION**: Document exact protocol deviation
3. **FIX IMMEDIATELY**: Correct violation before proceeding
4. **VERIFY COMPLIANCE**: Confirm fix meets protocol standards
5. **DOCUMENT FIX**: Update compliance documentation

## COST IMPACT AWARENESS
- Protocol violations cost user TIME
- Protocol violations cost user MONEY
- User has ZERO TOLERANCE for repeat violations
- Prevention is MANDATORY, not optional

## COMPLIANCE VERIFICATION QUESTIONS

**Before ANY development, answer YES to ALL:**
- [ ] Have I read the Universal Protocol Standard completely?
- [ ] Do I understand the NO HARDCODING rule absolutely?
- [ ] Am I using path parameter routing exclusively?
- [ ] Will my changes maintain state persistence?
- [ ] Are my database field references correct?
- [ ] Will my code follow error handling standards?
- [ ] Have I added required protocol headers?
- [ ] Is my code free of ANY hardcoding?

**If ANY answer is NO or UNCERTAIN**: STOP and review protocol before proceeding.

## PERMANENT ENFORCEMENT
This checklist is now permanently embedded in the development process. ALL contributors (AI and human) MUST complete this checklist before making ANY code changes.

**VIOLATION = CRITICAL ERROR requiring immediate correction**
