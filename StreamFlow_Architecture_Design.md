# Student Helper: Simple Architecture

**Project:** Student Study Assistant App | **Version:** 1.0 | **Date:** May 25, 2026 | **Type:** University Project

---

## Executive Summary
Simple 3-tier architecture for student study app. Frontend (React Native mobile) → Backend API (Node.js Express) → Database (SQLite/PostgreSQL). Features: OCR scanning, AI summaries, study tracking, file management, authentication.

---

## System Architecture

```
┌─────────────────────┐
│   React Native App  │  (Mobile - iOS/Android)
│  ├─ Auth Screen     │
│  ├─ Scan Screen     │
│  ├─ File Manager    │
│  ├─ Focus Mode      │
│  └─ Stats           │
└──────────────┬──────┘
               │ HTTP/REST API
               ↓
┌──────────────────────────────┐
│  Node.js Express Backend     │
│  ├─ Auth Routes              │
│  ├─ OCR Routes (→ Tesseract) │
│  ├─ AI Routes (→ Gemini)     │
│  ├─ Student Routes           │
│  └─ File Upload Handler      │
└──────────────┬───────────────┘
               │
    ┌──────────┼──────────┐
    ↓          ↓          ↓
┌────────┐ ┌────────┐ ┌──────────┐
│SQLite/ │ │Local   │ │External  │
│Postgre │ │File    │ │Services  │
│SQL     │ │Storage │ │ (Gemini) │
└────────┘ └────────┘ └──────────┘
```

**3 Layers:**
1. **Frontend (React Native):** Mobile app, local state management, offline support
2. **Backend (Node.js):** REST API, business logic, service integration
3. **Database & Storage:** Local SQLite or PostgreSQL, file uploads

---

## Core Features (What It Does)

| Feature | How It Works |
|---------|-------------|
| **User Auth** | Login/Register → JWT token stored in app → Authenticate API calls |
| **Scan Document** | Take photo → Send to Tesseract OCR → Extract text → Save to DB |
| **AI Summary** | Extracted text → Call Gemini API → Get summary → Display in app |
| **File Manager** | View uploaded documents, organize, delete, export |
| **Study Stats** | Track reading time, documents scanned, AI summaries used |
| **Focus Mode** | Timer-based study session, block distractions |
| **Offline Support** | Store files locally, sync when online |

---

## Requirements

| Category | Target |
|----------|--------|
| **Users** | 50-100 concurrent (university students) |
| **Response Time** | < 1 second for API calls |
| **OCR Accuracy** | > 90% for printed text |
| **Uptime** | 99% (not critical, university project) |
| **Storage** | 10-50 GB (documents + user data) |
| **Data** | User profiles, documents, scans, summaries |
| **Scalability** | Simple - single server is fine |
| **Cost** | Free or minimal (Google Gemini API has free tier) |

---

## Technology Stack (What You Have)

**Frontend:** React Native (TypeScript), Expo  
**Backend:** Node.js, Express.js  
**Database:** SQLite (local dev) or PostgreSQL (production)  
**Authentication:** JWT tokens, bcrypt for passwords  
**OCR:** Tesseract.js or Pytesseract (Python microservice)  
**AI:** Google Gemini API (free tier available)  
**File Storage:** Local filesystem or AWS S3 (if deployed)  
**Deployment:** Heroku, Render, or simple VPS

---

## Design Decisions

| Decision | Why |
|----------|-----|
| **React Native** | Write once, deploy iOS + Android |
| **Express.js** | Simple, fast REST API setup |
| **SQLite locally, PostgreSQL in production** | SQLite for dev (no setup), PostgreSQL for scalability |
| **JWT Authentication** | Stateless, works with mobile apps |
| **Tesseract OCR** | Open-source, free, good accuracy |
| **Google Gemini API** | Free tier sufficient for student project |
| **Local file storage** | Simple, no cloud costs (can upgrade later) |

---

## Technical Approach

### 1. API Endpoints (Backend)
```
POST   /auth/register          - User registration
POST   /auth/login             - User login (returns JWT)
POST   /documents/upload       - Upload photo
POST   /ocr/extract            - OCR text extraction
POST   /ai/summarize           - Get AI summary
GET    /documents              - List user documents
DELETE /documents/:id          - Delete document
GET    /stats                  - Get study stats
```

### 2. Data Flow
```
1. User takes photo in app
2. Upload to /documents/upload
3. Backend saves file locally
4. Call Tesseract OCR on file
5. Extract text → Save to DB
6. Return text to app
7. User clicks "Summarize"
8. Call Google Gemini API
9. Return summary to app
```

### 3. Database Schema
```sql
Users:  id, email, password_hash, created_at
Documents: id, user_id, filename, file_path, upload_date
Scans: id, document_id, extracted_text, ocr_accuracy
Summaries: id, scan_id, summary_text, created_at
```

### 4. What You Actually Need
- Express.js API (you have this)
- SQLite database (simple)
- Tesseract.js for OCR (npm package)
- Fetch Gemini API in backend
- React Native screens (you have these)

---

## Implementation Roadmap (University Project)

| Phase | Timeline | What to Do |
|-------|----------|-----------|
| **Phase 1: MVP** | Week 1-2 | Setup database, auth endpoints, basic API structure |
| **Phase 2: Core Features** | Week 3-4 | File upload, Tesseract OCR integration, document storage |
| **Phase 3: AI** | Week 5-6 | Gemini API integration, summarization feature |
| **Phase 4: UI/Polish** | Week 7-8 | Connect frontend screens, error handling, testing |
| **Phase 5: Deploy** | Week 9 | Deploy to Heroku/Render, test on mobile device |

**Realistic for a semester: 8-10 weeks**

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **API Response Time** | < 1 second | Server logs, timing middleware |
| **OCR Accuracy** | > 85% | Test with sample documents |
| **Feature Completion** | All 7 features done | Checklist during testing |
| **User Test** | 3-5 test users happy | Simple survey/feedback |
| **Code Quality** | Passes linter, basic tests | ESLint, Jest |
| **Mobile Performance** | Smooth 60 FPS | App testing on device |
| **Zero Critical Bugs** | 0 crash logs | Firebase Crashlytics or similar |

---

## Security & Deployment

- **Auth:** JWT tokens, bcrypt password hashing
- **HTTPS:** All API calls encrypted (TLS 1.2+)
- **Database:** Store passwords hashed, no secrets in code
- **File Storage:** Uploaded documents accessible only by owner
- **Deployment:** Heroku, Render, or AWS free tier
- **Backups:** Regular database backups (simple cron job)

---

**Document:** Student Helper Architecture | v1.0 | May 25, 2026
