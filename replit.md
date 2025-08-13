# Quanntaum RCA Intelligence Pro - AI-Powered Root Cause Analysis Platform

## Overview

Quanntaum RCA Intelligence Pro is a web-based AI-powered platform for root cause analysis (RCA) and safety investigations, adhering to ISO 14224 standards. It provides a comprehensive solution for analyzing equipment failures using Fault Tree Analysis and incidents using Event-Causal Factor Analysis (ECFA). The platform streamlines evidence gathering through dynamic questionnaires, offers explainable AI with complete audit trails, and supports diverse data ingestion formats. Its business vision is to deliver an enterprise-grade solution that eliminates recurring issues, reduces operational costs, and enhances safety and reliability across industrial facilities.

## User Preferences

Preferred communication style: Simple, everyday language.
Technical Requirements: Must follow ISO 14224 taxonomy, implement proper fault tree logic, ensure complete auditability.
User Feedback: User frustrated with repetitive debugging - demands working solutions immediately, not extended troubleshooting cycles.

## System Architecture

The platform employs a modern full-stack architecture, ensuring clear separation of concerns and scalability.

**Architectural Decisions & Design Patterns:**
- **Zero Hardcoding Policy**: All values, paths, and AI settings are configuration-driven, preventing static fallbacks.
- **Schema-Driven Operations**: Database interactions and data validation are strictly governed by defined schemas.
- **Path Parameter Routing ONLY**: All API calls adhere to a `/api/resource/:id` pattern.
- **State Persistence**: Critical data, especially evidence, persists across all workflow stages.
- **Universal Logic**: Designed to work across any equipment type or failure scenario through dynamic configuration.
- **Multi-Layered Enforcement System**: Git hooks, CI/CD, and runtime validation prevent protocol violations.

**UI/UX Decisions:**
- **Modern Enterprise Design**: Professional, intuitive interface with responsive layouts.
- **Visual Feedback**: Clear status indicators, color-coded badges, and enhanced visual selection.
- **Structured Workflow**: Tabbed interfaces, progress tracking, and visual indicators guide users through the multi-step RCA process.
- **Contextual Assistance**: AI provides real-time, equipment-specific guidance and intelligent suggestions.

**Technical Implementations:**
- **AI Hypothesis Generation**: AI-driven generation of failure hypotheses based on incident symptoms, requiring human verification.
- **Dynamic AI Model Selection**: AI providers and models are loaded dynamically from environment configurations (OpenAI, Anthropic, Gemini).
- **Evidence Analysis & Parsing**: Utilizes Python for data science-driven parsing of diverse file formats (CSV, Excel, PDF, images) with auto-column detection and signal processing. AI generates plain-language summaries.
- **Intelligent Elimination Logic**: Automated identification and elimination of secondary failure modes based on engineering logic.
- **Evidence Validation Gate**: Mandatory validation of evidence files (MIME type, AI content analysis) before RCA analysis.
- **Universal Timeline Engine**: Generates timeline questions based on incident keywords and contextual filtering.
- **Admin-Configurable Intelligence**: Intuitive admin interface allows configuration of all analysis behavior (confidence levels, diagnostic values, etc.).
- **Comprehensive Error Handling**: Enhanced AI testing system with retry logic and detailed error analysis for AI configuration.
- **Permanent Delete Enforcement**: Comprehensive system with zero soft deletes, audit logs, and FK constraint enforcement.
- **Information Architecture**: Exact 6-module structure with centralized navigation, Evidence Library as an independent top-level module, and RBAC.

**System Design Choices:**
- **Frontend**: React 18 with TypeScript, Wouter, TanStack Query, Radix UI/shadcn/ui, Tailwind CSS, Vite.
- **Backend**: Node.js with Express.js, TypeScript.
- **Database**: PostgreSQL via Neon Database, Drizzle ORM.
- **Database Design**: Normalized schema using JSONB for complex structured data, ISO 14224 compliant.

## External Dependencies

**Core Dependencies:**
- **Database**: Neon Database (serverless PostgreSQL)
- **UI Components**: Radix UI
- **Charts**: Recharts
- **File Upload**: react-dropzone, Multer (backend)
- **Form Handling**: React Hook Form, Zod
- **Date Handling**: date-fns
- **CSV Parsing**: papaparse
- **NLP**: Natural.js, Compromise.js
- **AI/LLM**: OpenAI API, Anthropic, Gemini (via dynamic configuration)

**Development Tools:**
- **Build**: Vite, esbuild
- **Database Migrations**: Drizzle Kit
- **TypeScript**
- **Styling**: Tailwind CSS, PostCSS
- **Python Integration**: `child_process.spawn()` for Python scripts (pandas, NumPy, SciPy)