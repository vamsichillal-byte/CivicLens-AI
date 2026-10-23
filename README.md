# CivicLens AI — Smart Municipal Triage & Issue Management Platform

CivicLens AI is an enterprise-grade civic issue intelligence and municipal workflow platform. It leverages Google Gemini AI models to analyze citizen complaints, calculate transparent multi-factor safety priority scores, detect duplicate municipal reports using geospatial and textual clustering, and empower supervisors with accountable dispatch and resolution workflows.

---

## 🌟 Key Capabilities & Features

### 1. Citizen Issue Reporting with AI Pre-Screening
- **Comprehensive Reporting**: Multi-category support (Potholes, Garbage/Waste, Water Leaks, Broken Streetlights, Drainage/Flooding, and Other).
- **AI Pre-Screen & Duplicate Alert**: Real-time evaluation before submission gives citizens immediate feedback on estimated urgency, category confirmation, and flags existing open complaints in the vicinity.
- **Image & Geolocation Attachment**: Upload photos and capture precise GPS coordinates or street addresses.
- **Auditable Tracking**: Every submission generates an official tracked Report ID (e.g., `CVL-2026-XXXX`).

### 2. Google Gemini 3.8 Flash AI Engine
- **Server-Side API Call**: Uses the `@google/genai` TypeScript SDK exclusively on the server (`server.ts`). Secrets are never exposed to the client.
- **Structured JSON Output**: Extracts executive summary, verified category, urgency, potential safety hazards, and exactly three actionable field crew instructions.
- **Transparent 4-Factor Priority Score (0–100)**:
  - **Safety Impact (0–35)**: Evaluates life-safety risks, crosswalks, school zones, electric sparking, and structural cavitation.
  - **Infrastructure Damage (0–25)**: Evaluates ongoing structural erosion, water loss, or asset degradation.
  - **Population Exposure (0–25)**: Evaluates traffic arterial density, pedestrian foot-traffic, and vulnerable facilities.
  - **Recency Factor (0–15)**: Time without active intervention.
- **Deterministic Rule Fallback**: If the Gemini API key is absent or quota-limited, a deterministic civic rule engine provides seamless operation, clearly labelling output source for transparency.

### 3. Geospatial & Semantic Duplicate Detection
- **Haversine Distance**: Computes exact ground distance between coordinates.
- **Normalized Tokenization & Jaccard Overlap**: Analyzes title and description phrasing to detect matching incidents.
- **Non-Destructive Workflow**: Duplicates are never automatically discarded. Instead, linked relationships are highlighted for supervisors to confirm or dismiss.

### 4. Administrator Operations & Dispatch
- **Authorized Triage Queue**: Sort by AI Priority Score descending.
- **Status Lifecycle**: `Submitted` ➔ `Under Review` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved` (or `Rejected`).
- **Human Oversight**: AI recommendations remain suggestions until an authorized human supervisor approves or overrides.
- **Mandatory Justification Log**: Overriding AI priority scores requires a written reason committed to an immutable audit trail.
- **Resolution & Rejection Notes**: Citizen-visible closure summaries explaining work performed.

### 5. Municipal Analytics & SLA Tracking
- **Real-Time Data Calculations**: All visualizations are generated from actual stored complaint records.
- **True Resolution SLA**: Average resolution time is calculated dynamically from `createdAt` to `resolvedAt` timestamps.
- **Visual Dashboards**: Reports by category, status pipeline, priority severity tiers, and department workload.

### 6. AI Insights & Preventive Maintenance
- **Urgent Review Queue**: Surfaces high-risk complaints requiring immediate field dispatch.
- **Citywide Duplicate Clusters**: Detects geographic complaint concentrations (e.g. repeated drainage clogs along low-elevation transit corridors).
- **Resource Allocations & Preventive Guidance**: Provides operational recommendations supported by verifiable report IDs.

---

## 🧪 Empirical Evaluation Benchmark & Automated Testing

CivicLens AI includes an automated integration test suite (`npm test`) and an empirical quantitative evaluation benchmark (`npm run benchmark`).

### Executed Test Results

```
=============================================================
  CIVICLENS AI — QUANTITATIVE EVALUATION BENCHMARK
=============================================================
1. Category Classification Benchmark (N = 12 curated test cases):
   - Correct Classifications: 12 / 12
   - Measured Classification Accuracy: 100%

2. Geospatial Duplicate Detection Benchmark (N = 6 evaluation pairs):
   - True Positives (TP):  3
   - False Positives (FP): 0
   - True Negatives (TN):  3
   - False Negatives (FN): 0
   - Measured Precision:   100%
   - Measured Recall:      100%
   - Measured F1-Score:    100%

3. Core Integration Gates (N = 14 assertions):
   - Input validation & bounds checking: PASSED
   - Multi-factor priority mathematical bounds (0-100): PASSED
   - Haversine geometry calculation accuracy: PASSED
   - Citizen role data privacy boundary: PASSED
   - Dynamic SLA timestamp calculation: PASSED
=============================================================
```

*Methodology Disclosure: Evaluated on an empirical benchmark of N=12 curated civic complaints across all 6 categories and N=6 paired geospatial coordinate sets. Continuous supervisor review is enforced for all production dispatches.*

---

## 🔐 Security & Privacy Architecture

- **Server-Side Secret Isolation**: `GEMINI_API_KEY` is loaded in Node.js via `process.env.GEMINI_API_KEY`.
- **Role-Based Access Control**:
  - Citizens can only query their own submitted records via `/api/reports`.
  - Administrators have access to citywide records and status update endpoints.
- **Input Sanitization & Validation**: Server validates text lengths, coordinate limits, and file payload sizes.
- **Data Persistence**: File-backed JSON store (`/data/civic_reports.json`) maintains state across server reboots.

---

## 🚀 Running & Deploying CivicLens AI

### Development
```bash
# Install dependencies
npm install

# Start full-stack server (runs Express with Vite middleware on port 3000)
npm run dev
```

### Production Build & Launch
```bash
# Build frontend assets
npm run build

# Start production server
npm start
```

### Environment Configuration (`.env`)
```env
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=3000
```
