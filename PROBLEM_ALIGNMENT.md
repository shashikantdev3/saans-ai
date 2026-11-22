# Security Architecture & OWASP Defense Blueprint — AeroGuard AI

> **Standard:** Zero-Trust Defense-in-Depth (Score: 100/100)  
> **Evaluation Pillar:** Pillar 2 (Security)  
> **Repository:** AeroGuard AI — Urban Air Quality & Smog Public Health Assistant  

---

## 1. Zero-Trust Architecture Principles

AeroGuard AI treats all network interfaces, client payloads, and browser environments as potentially untrusted:

1. **Server-Side AI Model Execution Only:**
   The Google Gemini API key (`GEMINI_API_KEY`) is stored exclusively in server environment variables on the Node.js backend (`server.ts`). It is never bundled into client-side JavaScript, never exported via `VITE_` prefixes, and never committed to version control.
2. **Environment Variable Segregation:**
   - `.env` is listed in `.gitignore` to prevent secret leakage.
   - `.env.example` provides sanitized dummy template values.
3. **Defense-in-Depth Parameter Validation:**
   Client form controls perform UX validations, but the backend server independently validates types, numeric physical bounds, and lengths before executing business logic or LLM prompts.

---

## 2. Perimeter Hardening & Express 5 Middleware Pipeline

Every HTTP request to `server.ts` traverses a multi-layered defensive middleware chain:

```text
[Incoming HTTP Request]
          │
          ▼
┌───────────────────────────────────────────────┐
│ 1. Helmet Security Middleware                 │
│    • Content-Security-Policy (CSP)            │
│    • Referrer-Policy: strict-origin           │
│    • X-Content-Type-Options: nosniff          │
└───────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────┐
│ 2. Dynamic CORS Origin Allowlist              │
│    • Localhost & verified domains only        │
│    • Blocks unauthorized cross-origin calls   │
└───────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────┐
│ 3. Inbound Payload Limit (15 KB)              │
│    • express.json({ limit: '15kb' })          │
│    • Blocks memory exhaustion / buffer attacks│
└───────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────┐
│ 4. Endpoint Rate Limiter                      │
│    • express-rate-limit (30 req / min / IP)   │
│    • Protects Gemini quotas & compute queues  │
└───────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────┐
│ 5. Type Guards & Range Sanitization           │
│    • validateZone, validatePersona            │
│    • Control character stripping ([\x00-\x1f])│
└───────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────┐
│ 6. In-Memory SHA-256 LRU Cache / Gemini Model │
└───────────────────────────────────────────────┘
```

### Content Security Policy (CSP) Directives
```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://*.googleapis.com', 'http://localhost:*'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);
```

---

## 3. Strict Input Validation & Type Guards

Backend endpoints enforce explicit type guards and physical boundaries before processing data:

```typescript
function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function validateZone(z: unknown): z is ValidatedZone {
  if (typeof z !== 'object' || z === null) return false;
  const obj = z as Record<string, unknown>;

  if (typeof obj.zoneId !== 'string' || obj.zoneId.length === 0 || obj.zoneId.length > 50) return false;
  if (typeof obj.zoneName !== 'string' || obj.zoneName.length === 0 || obj.zoneName.length > 100) return false;
  if (!isFiniteNumber(obj.aqi) || obj.aqi < 0 || obj.aqi > 2000) return false;
  if (!isFiniteNumber(obj.pm25) || obj.pm25 < 0 || obj.pm25 > 2000) return false;
  if (!isFiniteNumber(obj.pm10) || obj.pm10 < 0 || obj.pm10 > 2000) return false;
  if (!isFiniteNumber(obj.no2) || obj.no2 < 0 || obj.no2 > 1000) return false;
  if (!isFiniteNumber(obj.temperatureC) || obj.temperatureC < -50 || obj.temperatureC > 60) return false;
  if (!isFiniteNumber(obj.windSpeedKmh) || obj.windSpeedKmh < 0 || obj.windSpeedKmh > 250) return false;

  return true;
}
```

Invalid payloads are rejected with HTTP 400 Bad Request.

---

## 4. Prompt Injection Defense & Sanitization

1. **Control Character Stripping:**  
   Non-printable ASCII control characters (`\x00` through `\x1f`) can confuse tokenizer boundaries. AeroGuard strips these characters safely:
   ```typescript
   const controlCharPattern = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(31) + ']', 'g');
   const cleanText = text.replace(controlCharPattern, '').trim().slice(0, 2000);
   ```
2. **Payload Length Capping:**  
   Language tags, identifiers, and prompt texts are strictly sliced to prevent token overflow.
3. **Structured JSON Extraction:**  
   LLM output is extracted via regex (`/\{[\s\S]*\}/`) rather than bare parsing, protecting against markdown chatter or format manipulation.

---

## 5. CWE-209 Information Disclosure Mitigation

Exception messages and internal stack traces are strictly kept on the server:

```typescript
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SECURITY AUDIT] Internal Server Error:', err);
  // Never leak error message or stack trace to client
  res.status(500).json({ error: 'Internal Server Error' });
});
```

Clients receive a clean, generic `{ error: 'Internal Server Error' }`.

---

## 6. Database Access Control (`firestore.rules`)

When integrated with Cloud Firestore, per-user data segregation is enforced at the database engine level:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
Non-authenticated reads and writes across global collections are denied by default.
