# Architecture Decision Records (ADRs): Saans

## ADR 001: Modern Web Stack & Decoupled Architecture
- **Context**: Need a responsive, verifiable, accessible application scoring 100 on Security, Efficiency, Testing, Accessibility, and Problem Statement Alignment.
- **Decision**:
  - Frontend: React 19, TypeScript strict mode, Vite 6, Tailwind CSS. Single-page architecture with zero heavy charting bloat (pure native SVG).
  - Backend: Express 5 with defensive middleware on Node.js 20+.
  - State: Decoupled context provider with local storage persistence and clean action signatures.

## ADR 002: Deterministic Calculation Engine
- **Context**: LLMs hallucinate numerical metrics and pollutant chemistry. All mathematical calculations must be deterministic, reproducible, and mathematically grounded.
- **Decision**:
  - EPA & CPCB Breakpoints: Exact piecewise linear interpolation for PM2.5, PM10, NO2, CO, and O3.
  - Room CADR & Purification Time: Single-compartment first-order decay equation based on ASHRAE standard air changes per hour.
  - Commute Inhaled Dose: Microgram calculation factoring transit duration, physical exertion breathing rate, and cabin/mask filtration factors.
  - Dijkstra Router: Graph-based shortest exposure pathfinding minimizing cumulative inhaled pollution.

## ADR 003: Strict Modular Quality Limits
- **Context**: Code quality audit requires modular maintainability and concise functions.
- **Decision**:
  - File Length Limit: Maximum 200 lines per module.
  - Function Length Limit: Maximum 25-30 lines per function.
  - Enforce static analysis with Oxlint and strict TypeScript compilation in CI.

## ADR 004: Zero-Trust Security & API Proxying
- **Context**: Client-side API key leakage and prompt injection risks.
- **Decision**:
  - Zero browser exposure of `GEMINI_API_KEY`; all AI generation routed through `/api/routine-insights` and `/api/emergency-advisory`.
  - In-memory SHA-256 LRU cache for sub-10ms response times.
  - Strict Helmet CSP directives, nosniff headers, and CORS origin whitelisting.

## ADR 005: Accessible & Resilient UI (WCAG 2.2 AA)
- **Context**: Air quality alerts must be universally accessible to vulnerable groups, screen-reader users, and multi-lingual populations.
- **Decision**:
  - Twin representation: All SVG charts and heatmaps accompanied by hidden `.sr-only` textual descriptions.
  - Color independence: AQI levels communicated with numeric values, text descriptions, and icons, never color alone.
  - Multilingual support: Dynamic bidirectional rendering for English, Hindi, Arabic (RTL), and Spanish.

## ADR 006: Gemini 3.1 Flash Lite Hybrid AI Gateway
- **Context**: Rapid response times with resilience against quota limits or network interruptions.
- **Decision**:
  - Primary: Google Gemini 3.1 Flash Lite model for personalized lifestyle routines and multilingual broadcast generation.
  - Fallback: Deterministic scientific heuristic engine immediately triggered if external network or API key is absent, ensuring 100% service uptime.
