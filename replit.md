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

**CRITICAL DUPLICATE ELIMINATION COMPLETED (August 12, 2025):**
- ✅ COMPLETELY ELIMINATED duplicate "Evidence Library" entries from all navigation
- ✅ Evidence Library now appears EXACTLY ONCE in top-level navigation only
- ✅ Taxonomy tabs show ONLY Groups/Types/Subtypes/Risk (no Evidence Library tab)
- ✅ All hardcoded business vocabulary replaced with dynamic configuration
- ✅ Zero hardcoding policy enforced: all text loads from ADMIN_SECTIONS and TAXONOMY_TABS
- ✅ Server restart verification: 0 Evidence Library duplicates detected
- ✅ Navigation structure 100% compliant with Universal Protocol Standards

**CRITICAL ERROR RESOLUTION COMPLETED (August 12, 2025):**
- ✅ FIXED "l.map is not a function" error in Add Evidence dialog
- ✅ Implemented asArray() helper function for API response normalization
- ✅ Added strict TypeScript types (Option, RiskOption) for compile-time safety
- ✅ Protected all .map() calls with null-safety guards: (array ?? []).map()
- ✅ Fixed server endpoints to guarantee array responses, never objects/null
- ✅ Added runtime assertion helpers for debugging array issues
- ✅ Created comprehensive test suite for array safety (client/src/test/array-safety.test.ts)
- ✅ Fresh cache clear and rebuild completed for clean deployment

**CRITICAL SELECTITEM EMPTY VALUE FIX COMPLETED (August 12, 2025):**
- ✅ FIXED "A `<SelectItem />` must have a value prop that is not an empty string" error
- ✅ Implemented sanitizeOptions() utility to filter out empty/null values from all Select options
- ✅ Added assertNoEmptyOption() dev-time validation to catch regressions
- ✅ Updated Add Evidence form to use sanitized options for all dropdowns
- ✅ Added "__NONE__" sentinel value for optional Subtype field
- ✅ Server mutation handles "__NONE__" → null translation correctly
- ✅ Created comprehensive test suite for options safety (client/src/test/options-safety.test.ts)
- ✅ Zero hardcoding policy maintained: all options loaded dynamically from API
- ✅ Complete cache clear and rebuild process following mandatory development rule

**NAVIGATION RESTRUCTURE COMPLETED (August 12, 2025):**
- ✅ MOVED Analysis Engine and AI-Powered RCA out of admin configuration into main user workflow
- ✅ Created separate user workflow navigation (client/src/config/userNav.ts) for investigators/analysts
- ✅ Updated admin navigation to contain only system configuration tools (4 modules total)
- ✅ Implemented role-based access control with useUserRole hook
- ✅ Created MainLayout component with role-based navigation switching
- ✅ Added proper URL redirects from old admin paths to new workflow paths
- ✅ Established clear separation: Admin = Configuration, User Workflow = Investigation Process
- ✅ Role visibility: Investigators see RCA workflow, Admins see configuration tools
- ✅ Zero hardcoding maintained in all navigation configurations

**ENHANCED EVIDENCE LIBRARY TABLE COMPLETED (August 12, 2025):**
- ✅ IMPLEMENTED dynamic column sizing with auto-width capabilities (Excel AutoFit-style)
- ✅ Added text wrapping support for long text values with proper word-break
- ✅ Multi-line cell rendering with top vertical alignment for better readability
- ✅ Header text wrapping with auto-height adjustment
- ✅ Maximum column width limits (300px) to prevent layout breakage
- ✅ "Auto-Fit Columns" button for dynamic content-based resizing
- ✅ "Reset Widths" button to restore default column dimensions
- ✅ Enhanced table styling with proper borders and spacing
- ✅ Sticky header functionality for better navigation during scrolling
- ✅ Responsive design preventing unnecessary horizontal scrollbars
- ✅ Comprehensive cell content rendering with proper type handling (text, badges, dates, booleans)
- ✅ Maintained zero hardcoding policy throughout all table enhancements

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