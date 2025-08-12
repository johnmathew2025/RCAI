/**
 * Protocol: Universal Protocol Standard v1.0
 * Routing Style: Path param only (no mixed mode)
 * Last Reviewed: 2025-07-26
 * Purpose: Deterministic RCA LLM interpretation schema - ZERO HARDCODING
 */

import { z } from "zod";

export const RCAInterpretationSchema = z.object({
  component: z.string().min(1, "Component identification required"),
  suspected_failure_mode: z.string().min(1, "Failure mode must be specified"),
  confidence: z.number().min(0).max(1, "Confidence must be between 0 and 1"),
  evidence_used: z.array(z.string()).min(1, "At least one evidence item must be referenced"),
  evidence_gaps: z.array(z.string()),
  root_cause_hypothesis: z.string().min(1, "Root cause hypothesis required"),
  recommendations: z.array(z.string()).min(1, "At least one recommendation required")
});

export type RCAInterpretation = z.infer<typeof RCAInterpretationSchema>;

// Export for universal compliance validation
export const validateRCAInterpretation = (data: unknown): RCAInterpretation => {
  try {
    return RCAInterpretationSchema.parse(data);
  } catch (error) {
    console.error('[RCA SCHEMA] Validation failed:', error);
    throw new Error('Malformed LLM output – please retry.');
  }
};