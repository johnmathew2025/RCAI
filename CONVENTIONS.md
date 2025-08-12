# Universal Protocol Standard v1.0 - CONVENTIONS

## RCA LLM Diagnostic Compliance

All LLM interpretations must conform to `RCAInterpretation` schema.
- Must be validated via zod before DB insert
- No freeform or unstructured interpretation allowed
- All prompt templates must enforce JSON response with confidence scores

## Routing Protocol
- **Style**: Path parameters ONLY (no mixed mode)
- **Format**: `/api/incidents/:incidentId/evidence`
- **Header Required**: Every route/schema/data file must include:

```typescript
/**
 * Protocol: Universal Protocol Standard v1.0
 * Routing Style: Path param only (no mixed mode)
 * Last Reviewed: 2025-07-26
 */
```

## Zero Hardcoding Policy
- NO hardcoding of IDs, timestamps, model names, or API keys
- Use `UniversalAIConfig` for all dynamic values:
  - `UniversalAIConfig.generateTimestamp()` instead of `Date.now()`
  - `UniversalAIConfig.generateUUID()` instead of `Math.random()`
  - `UniversalAIConfig.getModelName()` instead of hardcoded model names

## Database Schema Protocol
- Table names: singular, lowercase, underscores
- Primary keys: `id` (UUID or serial integer)
- Foreign keys: `<table>_id`
- Required fields: `created_at`, `updated_at`

## API Response Format
```json
{
  "file_name": "vibration_waveform.txt",
  "file_type": "text/plain", 
  "incident_id": "abc-123",
  "status": "Uploaded",
  "llmInterpretation": { ... }
}
```

## Frontend Requirements
- Use MUI DataGrid for all tabular data
- Required columns: file_name, file_type, status, date_uploaded, uploaded_by
- Mandatory indicators: ✅ Green (Python analysis), ✅ Purple (LLM interpretation)

## Non-Negotiable Requirements
- NO deviation without system owner approval
- ALL new features must validate LLM JSON schema before merge
- Violations must be flagged and discussed before proceeding

Last Updated: 2025-07-26