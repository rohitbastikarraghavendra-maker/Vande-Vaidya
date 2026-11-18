# Team 1 patient demo

Run `npm ci` and `npm run dev` from the project root using Node 24. Open [the patient app](http://localhost:5173). Vite proxies the Express API on port 8787. The defaults use mock speech, mock extraction and the device-local demo assessment repository. Use fictional patient data.

## Three-minute rehearsal

1. Choose ಕನ್ನಡ and continue. Tap the microphone, allow access, speak for at least one second, then stop. In demo mode the speech adapter supplies the scripted Kanglish chest-pain transcript regardless of the audio. The emergency screen immediately offers 108. For a rehearsal, leave the call button unpressed.
2. Open the health-worker disclosure to inspect the English SBAR, rule provenance and original transcript. Download JSON exports the same validated object supplied to `saveAssessment`.
3. Finish and continue with the same patient. Choose English and type “Fever for three days and feeling weak.” Answer the short questions. The result recommends clinical consultation. The device reuses the patient UUID and creates another assessment UUID. “New patient” starts a separate identity.
4. The sample microphone uses mild headache for English and isolated chest pain for Hindi. Spoken follow-ups in mock mode return a sample uncertain reply. Typed input goes through the same local rules and extraction boundary. The mock extractor understands the scripted cases and flags unfamiliar descriptions for review.

## Provider configuration

Copy `server/.env.example` to `server/.env` and restart the server after edits. Select `STT_PROVIDER=sarvam` and supply `STT_API_KEY` for live speech. Select `LLM_PROVIDER=openai`, set `LLM_API_KEY` and select a structured-output capable `LLM_MODEL` for live extraction. The server validates the output and retries once. The browser revalidates it. Only prewritten questions and guidance reach the patient. [Sarvam speech API](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe) · [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

Use `FORCE_FAIL=stt` or `FORCE_FAIL=llm` in the server environment for failure drills. The patient app can triage typed emergency input after losing its connection. Failed saves leave the assessment available for download until the page is closed or the session is finished.

Copy the root `.env.example` to `.env` for client switches. `VITE_TTS=browser` enables best-effort browser speech synthesis. Availability and pronunciation depend on installed voices. `VITE_REPO=http` posts the unchanged v1.0 object to Team 2’s same-origin `/api/assessments` route. Mount that route on the shared Express server when Team 2 is available. The standalone HTTP writer reports a failed save and exposes JSON download. The durable outbox belongs to Team 2’s repository implementation.

## P0 verification checklist

- [x] Five patient screen states, optional demographics, local-language questions and guidance.
- [x] Record, stop, time limit, processing, transcript and retry/type paths. The browser run used Edge’s simulated microphone.
- [x] Structured extraction, schema rejection and scripted Kannada/Hindi code-mixing. Original patient turns survive failures.
- [x] Bounded follow-ups and local button answers. All 16 frozen rule codes and the emergency downgrade invariant have unit coverage.
- [x] Emergency call action appears before extraction completes and survives storage failure.
- [x] Template English SBAR, unknown demographics, missing information and unrecorded vitals.
- [x] Strict v1.0 validation, stable patient identity, idempotent demo save and downloadable assessments.
- [ ] Physical microphone and live cloud accuracy/latency checks with native speakers on the demo device.
- [ ] Cross-team sign-off on fixtures and a live Team 2 import. These assessment fixtures were recreated from the two supplied Markdown documents. The original fixture bundle and ASHA app were absent.
- [ ] Clinical and native-speaker review before use with patients. The P0 emergency keyword layer deliberately errs toward escalation, including on negated phrases.

## Checks

| Command | Coverage |
| --- | --- |
| `npm test` | Deterministic rule floors, all levels, recorded extraction fixtures, uncertainty, schema and repository behavior |
| `npm run validate:fixtures` | Every shared assessment fixture |
| `npm run build` | Strict TypeScript and production browser bundle |
| `npm run test:browser` | Starts isolated loopback services and a headless Edge with simulated audio. Exercises recording, result, emergency, permission denial, retry, malformed JSON and storage failure |
| `npm run test:llm` | Replays the scripts against the running server, printing the extractor’s suggestion before local rule overrides |

The shared types and repository signatures follow architecture C.1, C.2 and C.4. Group visits by `patient_id`. Two fixtures for PAT-K2M7 share the same UUID. The UI locale uses the welcome selection, and Tamil result/question strings are included for the P1 voice target.

## Files created

```text
.env.example
.gitignore
README.md
apps/patient/index.html
apps/patient/package.json
apps/patient/src/PatientApp.tsx
apps/patient/src/components/ErrorBoundary.tsx
apps/patient/src/hooks/flow.ts
apps/patient/src/hooks/recorder.ts
apps/patient/src/hooks/useTriageSession.ts
apps/patient/src/i18n/messages.ts
apps/patient/src/main.tsx
apps/patient/src/screens/Result.tsx
apps/patient/src/screens/Welcome.tsx
apps/patient/src/services/patientIdentity.ts
apps/patient/src/services/providers.ts
apps/patient/src/services/repository.ts
apps/patient/src/style.css
apps/patient/test/extractions/emergency.json
apps/patient/test/extractions/high.json
apps/patient/test/extractions/hinglish.json
apps/patient/test/extractions/low.json
apps/patient/test/extractions/medium.json
package-lock.json
package.json
packages/shared/mock/emergency.json
packages/shared/mock/high-risk.json
packages/shared/mock/low-risk.json
packages/shared/mock/medium-risk.json
packages/shared/mock/patient-history-second-visit.json
packages/shared/package.json
packages/shared/src/constants.ts
packages/shared/src/index.ts
packages/shared/src/repositories.ts
packages/shared/src/repositories/console.ts
packages/shared/src/schemas.ts
packages/shared/src/types.ts
packages/triage-engine/package.json
packages/triage-engine/src/assessment.ts
packages/triage-engine/src/extraction.ts
packages/triage-engine/src/lexicon.ts
packages/triage-engine/src/mock.ts
packages/triage-engine/src/note.ts
packages/triage-engine/src/questions.ts
packages/triage-engine/src/rules.ts
packages/triage-engine/src/session.ts
packages/triage-engine/src/triage.ts
pnpm-workspace.yaml
server/.env.example
server/package.json
server/src/index.ts
server/src/routes/ai/index.ts
tests/browser.mjs
tests/engine.test.ts
tests/fixtures.ts
tests/golden.test.ts
tests/live-extract.ts
tests/scenarios.ts
tsconfig.json
vite.config.ts
vitest.config.ts
```
