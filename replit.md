# Quanntaum RCA Intelligence Pro - AI-Powered Root Cause Analysis Platform

## Overview

Quanntaum RCA Intelligence Pro is a web-based AI-powered platform designed for root cause analysis (RCA) and safety investigations, adhering strictly to ISO 14224 standards. The platform aims to provide a comprehensive solution for analyzing equipment failures using Fault Tree Analysis and incidents using Event-Causal Factor Analysis (ECFA). Its core purpose is to streamline evidence gathering through dynamic questionnaires, offer explainable AI with complete audit trails, and support diverse data ingestion formats. The business vision is to deliver an enterprise-grade solution that eliminates recurring issues, reduces operational costs, and enhances safety and reliability across industrial facilities.

## User Preferences

Preferred communication style: Simple, everyday language.
Technical Requirements: Must follow ISO 14224 taxonomy, implement proper fault tree logic, ensure complete auditability.
User Feedback: User frustrated with repetitive debugging - demands working solutions immediately, not extended troubleshooting cycles.

## Recent Progress (August 12, 2025)

**Information Architecture Implementation Completed:**
- ✅ Fixed critical "Something went wrong" JSX errors that were breaking the application
- ✅ Implemented exact 6-module information architecture as specified by user requirements
- ✅ Created centralized navigation config (`/config/adminNav.ts`) - single source of truth
- ✅ Established canonical routes: Dashboard, Taxonomy Management, Evidence Library, Analysis Engine, AI-Powered RCA, Workflow Integration
- ✅ Evidence Library completely separated from Taxonomy as independent top-level module
- ✅ Updated all admin pages to use centralized navigation components
- ✅ Added anti-duplication guardrails with unit tests to prevent navigation duplication
- ✅ Created proper route structure with legacy redirects for clean URL migration
- ✅ Implemented RBAC permission structure for all admin modules
- ✅ Updated Taxonomy Management to use `TAXONOMY_TABS` config (Groups, Types, Subtypes, Risk Rankings only)

## Complete Implementation Summary

**Information Architecture & Navigation Structure Completed:**
The Quanntaum RCA Intelligence Pro platform now features the exact information architecture requested by the user, with 6 top-level admin modules, centralized navigation configuration, and Evidence Library as a completely independent module (not a taxonomy sub-tab). The platform maintains strict adherence to Universal Protocol Standards with zero hardcoding violations and includes anti-duplication guardrails to prevent navigation structure degradation.

**Key Architectural Achievements:**
- Single source of truth navigation configuration
- Evidence Library completely separated from Taxonomy Management
- Clean canonical paths with proper routing structure
- Anti-duplication tests preventing navigation conflicts
- RBAC permission framework for all admin modules

## System Architecture

The platform employs a modern full-stack architecture, ensuring clear separation of concerns and scalability.

**Architectural Decisions & Design Patterns:**
- **Zero Hardcoding Policy**: A fundamental principle enforced across all layers, ensuring dynamic, configuration-driven behavior for all values, paths, and AI settings. This prevents static fallbacks and promotes universal applicability.
- **Schema-Driven Operations**: Database interactions and data validation are strictly governed by defined schemas, enhancing data integrity and consistency.
- **Path Parameter Routing ONLY**: All API calls adhere to a `/api/resource/:id` pattern, eliminating query parameters for cleaner and more consistent routing.
- **State Persistence**: Critical data, especially evidence, persists across all workflow stages to ensure continuous context throughout investigations.
- **Universal Logic**: Designed to work across any equipment type or failure scenario through dynamic configuration loaded from the Evidence Library, rather than equipment-specific hardcoded logic.
- **Multi-Layered Enforcement System**: Includes Git hooks, CI/CD pipeline checks, and runtime validation to block protocol violations at every stage of development and deployment.

**UI/UX Decisions:**
- **Modern Enterprise Design**: Professional, intuitive interface with responsive layouts.
- **Visual Feedback**: Clear status indicators, color-coded badges, and enhanced visual selection for interactive elements.
- **Structured Workflow**: Tabbed interfaces, progress tracking, and visual indicators guide users through the multi-step RCA process.
- **Contextual Assistance**: AI provides real-time, equipment-specific guidance and intelligent suggestions during data input.

**Technical Implementations:**
- **AI Hypothesis Generation**: AI-driven generation of failure hypotheses based on incident symptoms, requiring mandatory human verification.
- **Dynamic AI Model Selection**: AI providers and models are loaded dynamically from environment configurations, supporting OpenAI, Anthropic, and Gemini.
- **Evidence Analysis & Parsing**: Utilizes Python (pandas, NumPy, SciPy) for real data science-driven parsing of diverse file formats (CSV, Excel, PDF, images) with auto-column detection and signal processing. AI generates plain-language summaries and actionable prompts.
- **Intelligent Elimination Logic**: Automated identification and elimination of secondary failure modes based on engineering logic stored in the Evidence Library, focusing analysis on primary causes.
- **Evidence Validation Gate**: Mandatory validation of evidence files (MIME type detection, AI content analysis) before RCA analysis can proceed, ensuring data adequacy.
- **Universal Timeline Engine**: Generates timeline questions based on incident keywords and contextual filtering from the Evidence Library, eliminating static templates.
- **Admin-Configurable Intelligence**: An intuitive admin interface allows configuration of all analysis behavior, including confidence levels, diagnostic values, collection costs, and industry relevance, eliminating the need for developer intervention to adapt to new contexts.
- **Comprehensive Error Handling**: Enhanced AI testing system with retry logic, detailed error analysis, and user-friendly troubleshooting guidance for AI configuration.

**System Design Choices:**
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI/shadcn/ui for components, Tailwind CSS for styling, Vite for builds.
- **Backend**: Node.js with Express.js, TypeScript, PostgreSQL via Neon Database, Drizzle ORM.
- **Database Design**: Normalized schema (`analyses`, `aiSettings`, `users`, `equipment_groups`, `equipment_types`, `equipment_subtypes`, `risk_rankings`, `fault_reference_library`, `libraryUpdateProposals`, `historicalPatterns`) using JSONB for complex structured data. ISO 14224 compliant classifications for equipment and RCA data.

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
- **AI/LLM**: OpenAI API (dynamically configured for GPT models), Anthropic, Gemini (support via dynamic config)

**Development Tools:**
- **Build**: Vite, esbuild
- **Database Migrations**: Drizzle Kit
- **TypeScript**: (strict mode)
- **Styling**: Tailwind CSS, PostCSS
- **Linting**: (built-in TypeScript checking)
- **Python Integration**: `child_process.spawn()` for Python scripts (pandas, NumPy, SciPy)