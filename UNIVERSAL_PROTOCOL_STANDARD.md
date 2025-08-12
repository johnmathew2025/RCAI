# UNIVERSAL PROTOCOL STANDARD - PERMANENTLY EMBEDDED

**CRITICAL**: This protocol MUST be strictly followed for all current and future development on this application (including by AI agents and human developers).

**STATUS**: PERMANENTLY EMBEDDED - January 26, 2025
**ENFORCEMENT**: MANDATORY - NO EXCEPTIONS ALLOWED
**VIOLATION IMPACT**: Costs user time and money - ZERO TOLERANCE POLICY

If you do not understand or spot ambiguity, STOP and ask for clarification before proceeding.

==========================================================================================
0. NO HARD CODING UNDER ANY CIRCUMSTANCES
==========================================================================================
**ABSOLUTE RULE**: NO hardcoding allowed anywhere in the system
- NO Math.random(), Date.now(), static paths, hardcoded IDs
- ALL values must be dynamic, config-driven, or parameterized
- NO magic numbers, static keys, or fallback values
- ANY hardcoding is a CRITICAL ERROR requiring immediate fix

==========================================================================================
1. ROUTING & ID PASSING
==========================================================================================
**MANDATORY STANDARD**: Path parameter routing ONLY
- ALL routes MUST use: `/api/incidents/:id/endpoint` format
- NO query parameters for incident IDs
- NO hardcoded route fragments or fallback values
- ALL navigation, API endpoints, and ID access MUST use path parameters
- Legacy patterns MUST be refactored immediately

**PROTOCOL HEADERS REQUIRED**: Every file handling routing MUST include:
```
/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * 
 * ROUTING: Path parameter style (/api/incidents/:id/endpoint)
 * NO HARDCODING: All values dynamic, config-driven
 * STATE PERSISTENCE: Data associated with incident ID across all stages
 * PROTOCOL: UNIVERSAL_PROTOCOL_STANDARD.md
 * DATE: [Current Date]
 * EXCEPTIONS: None
 */
```

==========================================================================================
2. STATE & DATA FLOW
==========================================================================================
**MANDATORY PERSISTENCE**: All evidence files MUST remain associated with correct incident ID
- State MUST persist through ALL workflow stages (frontend and backend)
- Backend MUST expose endpoints matching frontend protocol: `/api/incidents/:id/evidence-files`
- Data parsing MUST always associate evidence to correct incident
- NO workflow step may "drop" state - evidence persists at ALL times
- ALL workflow steps MUST display evidence based on current incident context

==========================================================================================
3. COMPONENT & UI CONSISTENCY  
==========================================================================================
**MANDATORY STANDARDS**:
- ALL tabular data MUST use DataGrid component from @mui/x-data-grid (version 6+)
- Table columns MUST match backend field names
- Column order: id, entity fields, timestamps, status, actions
- Every evidence grid MUST include: file_name, file_type, status, date_uploaded, uploaded_by
- ALL tables MUST support sorting, filtering, pagination for >50 records
- ALL forms MUST use common form component with field-level validation
- Error messages MUST be clear, user-facing, actionable

==========================================================================================
4. DATABASE & API SCHEMA PROTOCOL
==========================================================================================
**MANDATORY SCHEMA STANDARDS**:
- Table names: singular, lowercase, underscores (e.g., evidence_file)
- Primary key: id (UUID or serial integer)
- Foreign keys: `<referenced_table>_id` with proper constraints
- Timestamps: created_at, updated_at (auto-managed)
- NO nullable fields unless absolutely necessary
- API endpoints: REST conventions `/api/<resource>`
- API responses: `{ data: ..., error: null }` or `{ data: null, error: <message> }`
- **CRITICAL**: ALL deprecated schema fields (evidenceFiles) MUST be removed completely

==========================================================================================
5. ERROR HANDLING
==========================================================================================
**MANDATORY ERROR PROTOCOLS**:
- Frontend: Clear error messages with obvious resolution paths
- Backend: Specific, user-friendly errors with proper HTTP status codes
- NO silent failures or generic error messages
- ALL errors must provide actionable guidance

==========================================================================================
6. DOCUMENTATION
==========================================================================================
**MANDATORY DOCUMENTATION**:
- Comment block at top of EVERY file handling routing/data/schema
- Must describe: protocol in use, exceptions and why, date of last review
- Maintain UNIVERSAL_PROTOCOL_STANDARD.md in project root
- ALWAYS refer to protocol before starting new work

==========================================================================================
7. GENERAL REQUIREMENTS
==========================================================================================
**MANDATORY COMPLIANCE**:
- NO HARD CODING of any values - all dynamic/config-driven
- ALL code TypeScript-typed with interfaces
- EVERY feature/change checked for protocol compliance before merge
- Protocol violations MUST be flagged and fixed immediately
- NO deviations without explicit approval

==========================================================================================

# THIS PROTOCOL IS NON-NEGOTIABLE AND APPLIES TO ALL AI/HUMAN CONTRIBUTORS
# VIOLATIONS COST USER TIME AND MONEY - ZERO TOLERANCE POLICY
# ANY VIOLATION IS A CRITICAL ERROR REQUIRING IMMEDIATE FIX

==========================================================================================

## PERMANENT EMBEDDING STATUS
- **Date Embedded**: January 26, 2025
- **Purpose**: Prevent recurring protocol violations that cost user time and money
- **Enforcement**: Automatic compliance checking required before any code changes
- **Impact**: Zero tolerance for violations - all must be fixed immediately

## AUTOMATIC ENFORCEMENT SYSTEM
This protocol is now permanently embedded in project documentation and MUST be referenced before any development work. Any violation of these standards is considered a critical error.
