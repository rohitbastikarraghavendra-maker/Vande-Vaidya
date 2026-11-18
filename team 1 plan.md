# Team 1 — Plan: Patient Voice Assistant + Clinical Triage Engine

> Read with `team-1/architecture.md`. The **Cross-Team Integration Contract** at the end of that file is frozen at 0:30 and is the only thing Team 1 shares with Team 2.

## 1. Team objective

Ship a voice-first patient app that lets a rural patient speak naturally in Kanglish / Hinglish / English, asks at most a few targeted follow-up questions, applies a **deterministic red-flag engine that the LLM can never downgrade**, shows a dead-simple result (with an immediate emergency screen when needed), generates an English SBAR clinical note, and emits one validated `Assessment` JSON through `saveAssessment()`.

Team 1 must be fully demoable on its own: if Team 2 does not exist, the patient flow still works end to end and the assessment can be downloaded as JSON.

## 2. Scope

**In scope:** patient UI (5 screens), audio capture, STT proxy, LLM extraction proxy, follow-up question bank, red-flag + triage engine (pure TypeScript), patient-facing messages in 4 languages, SBAR note generation, patient ID handling, `Assessment` assembly + Zod validation, calling `saveAssessment`.

**Out of scope (owned by Team 2):** storage implementation, server-side assessment store, ASHA dashboard, referrals, facility selection, offline sync.

## 3. Feature priorities

### P0 — must have for demo

| # | Feature | Notes |
|---|---|---|
| P0-1 | Big mic button, start/stop, "Listening…" / "Thinking…" states | One primary action per screen |
| P0-2 | STT via server proxy (Kannada, Hindi, English; code-mixed) | Cloud provider with Indian-language support (see architecture §4) |
| P0-3 | Code-mixed understanding | LLM normalizes to English + maps symptoms to canonical codes |
| P0-4 | Transcript displayed; original kept in `Assessment.transcript` | Editing = P1 |
| P0-5 | Structured extraction via LLM with JSON schema + Zod validation | One LLM call per patient turn |
| P0-6 | Adaptive follow-ups from a **pre-written question bank** (max 4 questions, yes/no buttons + voice) | No LLM-generated question text |
| P0-7 | Deterministic red-flag engine: structured rules + multilingual keyword rules | Runs in the browser; works when LLM is down |
| P0-8 | Triage engine LOW/MEDIUM/HIGH/EMERGENCY with `max()` override | LLM can only raise |
| P0-9 | Emergency short-circuit screen: red, "Call 108", local-language text, shown before any save | Never waits for network |
| P0-10 | Patient-friendly result screen (colour + icon + one sentence, 4 languages pre-written) | No clinical terms |
| P0-11 | English SBAR note — **template-generated** from structured data | Reported vs inferred separated; vitals "NOT RECORDED" |
| P0-12 | Patient ID: UUID `patient_id` + `PAT-XXXX` display code, stored on device; new UUID per assessment | `patient_id != assessment_id` |
| P0-13 | Assessment assembly + `AssessmentSchema.parse` + `saveAssessment` (fire-and-forget) + "Download JSON" | Integration fallback |
| P0-14 | Failure states: STT error → retry/type; LLM error → retry, then keyword-only fallback; never crash | Error boundary on every screen |
| P0-15 | Welcome screen: language tiles + optional sex (Man / Woman / Skip) + optional age stepper | Needed for pregnancy rules; never guessed |

### P1 — should have once P0 flow works

- Text-to-speech for questions and results (pre-generated audio files per language for the fixed phrase bank; browser `speechSynthesis` fallback)
- Tamil / Tanglish (add `ta-IN` to STT language list, question bank, keyword lexicon)
- Automatic language detection (use STT-returned language code; welcome tile becomes a hint)
- Editable transcript (tap text → edit → re-run extraction)
- Live extraction chips (symptoms shown as chips under the transcript)
- Confidence indicator on result screen (for ASHA/doctor view only — patient sees no percentages)
- Missing-information indicator
- Conversation history view (scrollable turns)
- STT retry with backoff; LLM retry with stricter "repair" prompt
- Audio playback of emergency instructions (auto-plays on emergency screen)
- LLM-polished SBAR "situation" sentence (`generated_by: TEMPLATE_PLUS_LLM`), template remains the fallback
- "I have a code" for returning patients on the same device

### P2 — bonus, only after full P0 demo runs twice cleanly

- Partial/streaming transcription
- Red-flag detection on partial transcripts
- Emergency interruption mid-utterance
- Voice activity detection (auto-stop on silence)
- Low-bandwidth audio mode (16 kHz mono, Opus)
- On-device emergency phrase detection with no cloud STT (Web Speech API / small local model)
- Additional Indian languages (te-IN, ml-IN, mr-IN, bn-IN)
- Time-to-triage analytics
- `DEMO_MODE` canned responses if external AI API fails (strongly recommended as the *first* P2 item — 30 min)

### POST-HACKATHON — do not build

- Diagnosis, differential diagnosis, or any medication/dosage advice
- Vitals capture, device integration, image input
- User accounts, auth, consent management, ABHA/ABDM integration
- Fine-tuning or self-hosting STT/LLM models
- Clinical validation of rules (rules must be reviewed by clinicians before any real use)
- Multi-turn free-form chatbot

## 4. Explicit non-goals

- It is **not** a diagnosis system and never names a disease to the patient.
- It never prescribes or suggests medicines, doses or home remedies beyond "rest / fluids / monitor / consult".
- It does not record or invent vitals, age, sex, or history.
- It does not store referrals or sync data (Team 2).
- Cloud STT/LLM is **not** claimed to work offline.

## 5. User flow

```
Welcome / Language
  [ಕನ್ನಡ] [हिंदी] [English] [தமிழ் (P1)]   + optional: Man / Woman / Skip, age
        │
        ▼
Tap to speak  ──(mic denied / STT fail)──▶ "Try again" or "Type instead"
        │ record → stop
        ▼
Conversation
  patient bubble (transcript)
  ── keyword engine (instant) ── EMERGENCY? ──yes──▶ Emergency screen
  ── /api/extract ── rules + triage ── EMERGENCY? ──yes──▶ Emergency screen
  ── missing critical info? ──yes──▶ ask 1 question (text + audio, [✓ Yes] [✗ No] [🎤 Speak])
        │                               └─ answer → rules re-run instantly → loop (max 4 questions / 2 voice rounds)
        ▼ no
Triage result (green / yellow / orange)  ── "Show this to your ASHA worker" + PAT code
        │
        └─ Assessment built → validated → saveAssessment() in background
```

Emergency screen: full-screen red, ⚠ icon, one sentence in the selected language, huge **Call 108** button (`tel:108`), secondary "Show to health worker" which expands the English summary, PAT code visible. It is rendered **before** the assessment is saved.

## 6. Components to build

| Area | Component / module | Owner (suggested) |
|---|---|---|
| UI | `WelcomeScreen`, `SpeakScreen`, `ConversationScreen`, `ResultScreen`, `EmergencyScreen`, `MicButton`, `QuestionCard`, `ErrorBanner`, `ErrorBoundary` | Dev D |
| Audio | `useRecorder` (MediaRecorder → WAV/webm blob), mic permission handling | Dev A |
| Services | `sttClient`, `extractClient` (timeouts, retry), `ttsClient` (P1) | Dev A / Dev B |
| Server (Team 1 routes) | `POST /api/stt`, `POST /api/extract`, `POST /api/tts` (P1), `FORCE_FAIL` switch | Dev A / Dev B |
| LLM | Extraction system prompt, few-shot examples, `ExtractionResultSchema` | Dev B |
| Engine (`packages/triage-engine`) | `symptomRules`, `keywordLexicon`, `evaluateRedFlags`, `decideTriage`, `selectNextQuestion`, `questionBank`, `buildClinicalNote`, `buildAssessment` | Dev C |
| State | `useTriageSession` reducer (turns, extraction, answers, flags, phase) | Dev C + Dev D |
| i18n | `patientMessages` (4 levels × 4 languages), question bank translations | Dev D + native speakers on the team |
| Identity | `patientIdentity.ts` (localStorage, UUID, PAT code) | Dev D |

## 7. Suggested ownership (4 developers; with 3, merge Dev A + Dev B)

- **Dev A — Voice & STT:** recorder hook, `/api/stt` proxy, provider integration, STT failure UX, (P1) TTS.
- **Dev B — LLM extraction:** `/api/extract`, prompt + few-shots, Zod schema, retry/repair, timeouts, `FORCE_FAIL`.
- **Dev C — Clinical engine (most safety-critical):** rules, lexicon, triage, override, question selection, SBAR template, assessment builder, unit tests for all 7 scenarios.
- **Dev D — Patient UI & integration:** screens, state machine wiring, i18n strings, emergency screen, patient ID, `saveAssessment`, download JSON.
- **Team lead (one of the above):** owns contract freeze at 0:30, reviews every change to `packages/shared`.

## 8. Task breakdown

| ID | Task | Est. | Depends on |
|---|---|---|---|
| T1-01 | Monorepo scaffold (pnpm workspaces, Vite React TS for `apps/patient`, Express server, Vite `/api` proxy) — **jointly with Team 2, done once** | 30m | — |
| T1-02 | Contract freeze: review `packages/shared` types/schemas/fixtures with Team 2 | 30m | T1-01 |
| T1-03 | Recorder hook + MicButton + permission errors | 45m | T1-01 |
| T1-04 | `/api/stt` proxy to provider; return `{text, language, provider}` | 45m | T1-01, API key |
| T1-05 | Extraction prompt + `ExtractionResultSchema` + `/api/extract` with timeout/retry | 90m | T1-02 |
| T1-06 | Keyword lexicon (kn/hi/ta/en romanized + native script) + structured rules | 60m | T1-02 |
| T1-07 | `decideTriage` + override + unit tests (incl. downgrade test) | 45m | T1-06 |
| T1-08 | Question bank (8 complaint groups, ≤4 Qs each, 3–4 languages) + `selectNextQuestion` | 60m | T1-06 |
| T1-09 | Session state machine (`useTriageSession`) wiring STT → extract → rules → question/result | 60m | T1-03..08 |
| T1-10 | Result + Emergency screens + patient messages in 3–4 languages | 45m | T1-07 |
| T1-11 | SBAR template note builder | 45m | T1-07 |
| T1-12 | Patient identity + `buildAssessment` + `AssessmentSchema.parse` + save + download | 45m | T1-11 |
| T1-13 | Failure handling: error boundary, STT retry/type, LLM retry/fallback, `FORCE_FAIL` | 45m | T1-09 |
| T1-14 | Scenario tests 1–6 with mocked extraction (vitest) + live run | 45m | all |
| T1-15 | P1 items in order: TTS for fixed phrases → editable transcript → chips → Tamil | rest | P0 done |

## 9. Dependencies

| Dependency | Type | Mitigation |
|---|---|---|
| STT API key (Indian-language capable) | External | Get at 0:00. Fallback: browser Web Speech API (Chrome, `kn-IN`/`hi-IN`) behind a toggle, then "Type instead". |
| LLM API key (JSON-schema structured output, fast tier) | External | Fallback: keyword-only triage + conservative MEDIUM. P2 `DEMO_MODE`. |
| `packages/shared` contract | Internal, joint | Frozen at 0:30. |
| `HttpAssessmentRepository` | Team 2 delivers by ~2:30 | Team 1 uses `ConsoleAssessmentRepository` until 5:30. Zero blocking. |
| Native speakers to review question translations and lexicon | People | Do in 0:30–1:30 in parallel; mark unverified strings. |
| HTTPS / localhost for mic access | Browser | Demo on `localhost`; if on phone, use a tunnel with HTTPS. |

## 10. API requirements

All Team 1 endpoints live in the single BFF server (`server/src/routes/ai/`). Keys only in `server/.env`.

| Endpoint | Request | Response | Timeout / retry |
|---|---|---|---|
| `POST /api/stt` | `multipart/form-data`: `audio` (≤ 30 s, wav/webm), `language_hint` (`kn-IN`…, optional) | `{ text, language: LanguageCode \| null, provider, duration_ms }` | client timeout 12 s, 1 auto-retry |
| `POST /api/extract` | `{ language_hint, patient: PatientSnapshot, turns: ConversationTurn[], answered_question_ids: string[] }` | `ExtractionResult` (architecture §6) | client timeout 10 s, 1 retry with repair prompt |
| `POST /api/tts` (P1) | `{ text, language }` | `audio/mpeg` | 6 s, no retry (show text) |
| `GET /api/health` | — | `{ ok }` | used by patient app to show a small "connection" hint |

Env: `STT_PROVIDER`, `STT_API_KEY`, `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `FORCE_FAIL` (`none|stt|llm|tts`), `PORT=8787`.

## 11. Shared contract responsibilities

Team 1 **must**:
1. Produce `Assessment` objects that pass `AssessmentSchema.parse` (strict) — enforced in `buildAssessment`, covered by a test.
2. Generate `assessment_id` (new UUID each time) and reuse `patient_id` from device identity.
3. Fill every Team-1-owned field; write only the documented defaults into `referral` and `sync`.
4. Never set `triage.level` lower than `triage.rule_level`; set `requires_escalation = (level === "EMERGENCY")` and `escalation` non-null iff true.
5. Never fabricate `age`, `sex`, `name`, vitals or history. Unknown = `null` / `"unknown"`.
6. Make output for Scenarios 1–4 match fixture `triage.level`, `requires_escalation`, red-flag codes.
7. Call only `saveAssessment`. Never read Team 2 storage.

## 12. Failure handling (summary — details in architecture §16)

| Failure | Patient sees | System does |
|---|---|---|
| Mic permission denied | "Allow microphone" + "Type instead" | No crash |
| STT error/timeout | "Couldn't hear clearly. Try again." [🎤] [⌨ Type] | 1 auto-retry; turn not lost |
| STT returns empty | Same as above | — |
| LLM error/timeout | "Checking…" then retry once | Keyword engine result already computed |
| LLM fails twice | If keyword flags → their level; else result "Please consult a health worker" (MEDIUM) | `pipeline.degraded = true`, `decided_by = FALLBACK`, `confidence = LOW` |
| LLM returns invalid JSON | — | Zod fail → repair retry → fallback |
| TTS fails | Text only | Never blocks |
| `saveAssessment` fails | Nothing blocking; small "Saved on this phone" note | Repository outbox retries; Download JSON available |
| Any render error | "Something went wrong — [Start again]" + emergency number always visible | Error boundary |

## 13. Testing strategy

1. **Unit (vitest, `packages/triage-engine`) — required for P0:** each rule fires on its symptom combo; keyword lexicon matches romanized + native script; `decideTriage` never returns below `rule_level`; LLM downgrade test; uncertainty floor; fallback path; question selection stops on emergency and after budget; `buildAssessment` output passes `AssessmentSchema`.
2. **Golden scenario tests:** for Scenarios 1–5, a recorded `ExtractionResult` fixture (`apps/patient/test/extractions/*.json`) feeds the engine; assert level, flags, escalation. No network needed.
3. **Live prompt checks:** a script `pnpm test:llm` sends the 6 scenario transcripts to `/api/extract` and prints codes/levels — run at 3:30 and 6:30.
4. **Manual voice run-through** with a native speaker for each scenario, twice, on the demo laptop and mic.
5. **Failure drills:** `FORCE_FAIL=stt`, `FORCE_FAIL=llm`, server stopped, mic denied.

## 14. Test scenarios

### Shared Integration Test Scenarios (identical in both team plans)

Both teams test against these seven scenarios. Each has a fixture in `packages/shared/mock/` where applicable. "Script" is what the demo presenter says or does on the patient app.

| # | Scenario | Script (patient speech / action) | Expected Team 1 output | Expected Team 2 behaviour |
|---|---|---|---|---|
| 1 | **LOW** | *Hinglish:* "Main Sunita, 28 saal. Mujhe kal se thoda sa sardi hai aur naak beh rahi hai, bukhar nahi hai." → follow-up "breathing difficulty?" → **No** button | `triage.level = LOW`, `red_flags = []`, `requires_escalation = false`, fever recorded as `present:false` | Green row at bottom of list; "No referral needed" default; counted in Total only |
| 2 | **MEDIUM** | *Kanglish:* "Nanna hesaru Manjunath, thirty five. Nange one week inda fever ide, body pain ide, appetite illa." → breathing/confusion? **No** → drinking? "Haudu, kudeetini" | `MEDIUM`, red flag `PROLONGED_FEVER` (MEDIUM), `fever.duration_hours = 168` | Yellow; same patient as the history fixture → **1 patient, 2 assessments**; facility suggestion = PHC or above |
| 3 | **HIGH** | *Hinglish:* "Mera naam Priya hai, 22 saal. Mere pet mein right side bahut tez dard hai since morning, ulti bhi ho rahi hai." → pregnant? "Pata nahi" → fever? "Haan thoda" → bleeding/fainting? **No** | `HIGH`, flags `SEVERE_ABDOMINAL_PAIN` + `PREGNANCY_ABDOMINAL_PAIN`, `pregnancy_status = unknown`, `requires_escalation = false` | Orange; counted in High-priority; facility suggestion filters to CHC+ with `obstetric_emergency` first |
| 4 | **EMERGENCY** | *Kanglish:* "Nange half an hour inda chest alli tumba pain ide, usiraata kashta aagtide, bevaru bartide. Nanage fifty four years." | Emergency screen **with no follow-up questions**, `EMERGENCY`, `CHEST_PAIN_DYSPNEA` (source `DETERMINISTIC_RULE` or `KEYWORD_RULE`), `requires_escalation = true`, `escalation` non-null, `sex = unknown` (not fabricated) | Red sticky banner; patient pinned at top; facility list shows emergency-capable hospitals first, nearer non-capable PHC/Sub-centre greyed "Not equipped for emergencies"; referral can be created |
| 5 | **Code-mixing** | (a) *Hinglish:* "Mereko kal se chest mein pain ho raha hai." → breathing? **No** → sweating? **No** → arm/jaw? **No** — (b) *Kanglish:* "Nange two days inda fever ide." | (a) `HIGH` via `CHEST_PAIN` floor (chest pain alone never below HIGH), `normalized_english` correct; (b) follow-up questions asked, then `LOW` or `MEDIUM` per answers | Displays `transcript.original` and `normalized_english` side by side |
| 6 | **API failure** | (a) Server env `FORCE_FAIL=llm` and say Scenario 4 → (b) `FORCE_FAIL=llm` and say "Nange thale novu ide" → (c) `FORCE_FAIL=stt` | (a) Keyword engine still gives `EMERGENCY` (`KEYWORD_RULE`), `pipeline.degraded = true`; (b) Retry offered; if still failing → `MEDIUM`, `decided_by = FALLBACK`, `confidence = LOW`, "consult health worker"; (c) "Couldn't hear — try again / type instead", **no crash** | Shows a "Degraded automated assessment" badge when `pipeline.degraded = true`; never alters level |
| 7 | **Offline ASHA** | ASHA app: toggle **Simulate offline** (and/or DevTools → Offline). Open patients, open emergency patient, create referral, change status. Go online → **Sync now** | Patient app unaffected (if it is the emergency case, the emergency screen still shows without the server) | Records, notes, facilities all visible offline; referral saved locally; OFFLINE pill + queue count increments; after sync queue = 0 and server has the referral |

**Extra Team 1 unit-test case (no UI): "LLM tries to downgrade".** Mock extraction returns `suggested_level: "LOW"` for Scenario 4 symptoms → final level must be `EMERGENCY`, `decided_by = "RULE"`.

## 15. 8-hour timeline

| Time | Dev A (Voice/STT) | Dev B (LLM) | Dev C (Engine) | Dev D (UI/Integration) | Checkpoint |
|---|---|---|---|---|---|
| **0:00–0:30** Contract freeze | Get STT key, curl test one Kannada clip | Get LLM key, test JSON-schema output | Review `types.ts`, symptom codes, red-flag codes | Scaffold `apps/patient` with Team 2 | ✅ `packages/shared` frozen, fixtures validate |
| **0:30–1:30** Foundation | `useRecorder`, MicButton, permission errors | `ExtractionResultSchema`, prompt v1, `/api/extract` stub returning fixture | Rule table + keyword lexicon v1 (with native speakers) | 5 screen shells, router/phase state, patient identity | Mic → blob works; `/api/extract` returns validated fixture |
| **1:30–2:30** Core | `/api/stt` live; returns text for Kanglish/Hinglish | Prompt v2 with few-shots; live extraction for Scenarios 1–4 | `evaluateRedFlags`, `decideTriage` + unit tests | Conversation screen shows transcript; Emergency + Result screens | **Voice → transcript on screen** |
| **2:30–3:30** Core | STT failure UX, retry, Type-instead | Timeout + retry + repair prompt; `FORCE_FAIL` | Question bank + `selectNextQuestion`; tests | Wire `useTriageSession`: STT → keyword → extract → rules | **Scenario 4 reaches Emergency screen by voice** |
| **3:30–4:30** Core | Help Dev D with QuestionCard voice answers | `pnpm test:llm` run; fix code-mapping errors | SBAR template builder; `buildAssessment` + schema test | QuestionCard yes/no/voice; patient messages in kn/hi/en | **Scenarios 1–4 work end to end** |
| **4:30–5:30** Complete module | (P1) TTS for fixed phrases | Fallback path (keyword-only, MEDIUM) | Golden scenario tests 1–6 green | Download JSON; ConsoleRepository; error boundary | ✅ **Team 1 demoable standalone** |
| **5:30–6:30** Integration | Support | Support | Compare output vs fixtures field by field | Swap to `HttpAssessmentRepository`; run C.8 steps with Team 2 | Assessment appears in ASHA dashboard |
| **6:30–7:15** Testing/failures | Failure drills STT/mic | Failure drills LLM | Re-run unit + golden | Scenario 7 with Team 2; fix crashes | All 7 scenarios pass |
| **7:15–8:00** Demo stabilization | Freeze code; rehearse; mic placement | Pre-warm API; note fallback commands | Print scenario script | Rehearse full demo twice | 🎤 Demo ready |

**Rule:** no P1 work starts before the 3:30 checkpoint passes; no P2 work before the 4:30 checkpoint passes.

**If behind at 4:30, cut in this order:** live chips → TTS → Tamil → editable transcript → voice answers to questions (keep yes/no buttons) → LLM (run keyword-only + manual symptom chips). Never cut: emergency screen, deterministic rules, `Assessment` JSON.

## 16. Integration checklist

- [ ] `pnpm validate:fixtures` green on `main`
- [ ] `buildAssessment` output passes `AssessmentSchema.parse` for all golden scenarios
- [ ] `referral` and `sync` defaults exactly as contract C.2
- [ ] `patient_id` reused across two runs on same device; `assessment_id` new each time
- [ ] `requires_escalation === (level === "EMERGENCY")` and `escalation` non-null iff true
- [ ] Repository swapped to `HttpAssessmentRepository`; emergency screen still renders with server stopped
- [ ] Scenario 4 assessment visible via `curl localhost:8787/api/assessments`
- [ ] ASHA dashboard shows it after Sync, grouped under the right patient
- [ ] Downloaded JSON imports into ASHA app via **Import JSON**
- [ ] No API key in any file under `apps/` (`grep -r "sk-\|API_KEY" apps/` empty)

## 17. Definition of Done — Team 1

1. [ ] Patient can record speech (tap start, tap stop, clear listening/processing feedback).
2. [ ] Speech becomes a transcript shown on screen.
3. [ ] Code-mixed speech works for demo Scenarios 1–5 (Kanglish + Hinglish).
4. [ ] Symptoms become structured `Symptom[]` with canonical codes.
5. [ ] Follow-up questions are asked when critical info is missing (≤ 4), and skipped on emergency.
6. [ ] Deterministic red flags fire from structured rules **and** from keywords without the LLM.
7. [ ] Triage produces exactly LOW / MEDIUM / HIGH / EMERGENCY.
8. [ ] Emergency cannot be downgraded by the LLM (unit test passing).
9. [ ] Patient receives a simple coloured recommendation in their language; emergency screen with Call 108.
10. [ ] English SBAR clinical note generated with reported vs inferred separated and vitals "NOT RECORDED".
11. [ ] Valid `Assessment` JSON created (`AssessmentSchema.parse` passes).
12. [ ] Assessment persisted through the shared repository (`saveAssessment`).
13. [ ] STT failure, LLM failure, TTS failure, mic denial and server down do not crash the app.

## 18. Demo flow (Team 1 portion, ~3 minutes)

1. **Hook (15 s):** "A farmer in a village 40 km from a hospital. He doesn't type English. He just talks."
2. **Scenario 2 (Kanglish fever, 45 s):** tap mic, speak; transcript appears with English normalization; one follow-up question with ✓/✗ buttons; yellow result "Please consult a healthcare worker". Tap "Show to health worker" → SBAR note.
3. **Scenario 4 (Kanglish chest pain, 40 s):** speak — emergency screen appears **without any follow-up questions**, local-language instruction, Call 108. Point out: "That decision came from a deterministic rule, not the AI."
4. **Safety proof (30 s):** show the triage panel: `rule_level: EMERGENCY`, `model_level`, `decided_by`. Mention the unit test where the LLM says LOW and the final answer stays EMERGENCY.
5. **Failure proof (30 s):** set `FORCE_FAIL=llm`, repeat Scenario 4 → still EMERGENCY via `KEYWORD_RULE`, "degraded" badge.
6. **Hand-off (20 s):** "This assessment is now on its way to the ASHA worker" → Team 2 takes over.
