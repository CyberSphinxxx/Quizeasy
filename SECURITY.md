# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately using GitHub's
[private vulnerability reporting](https://github.com/CyberSphinxxx/Quizeasy/security/advisories/new)
on this repository. If that is unavailable, open a minimal public issue that
asks for a private contact channel — do **not** include exploit details, study
material, or credentials in it.

Please include:

- what you found and why it matters,
- steps to reproduce, ideally against a locally served `npm run build` output,
- affected versions or commit range,
- any suggested fix.

Expect an acknowledgement within a few days. This is a volunteer-maintained
project, so please allow reasonable time before disclosing publicly.

**Never submit private study material in a public issue.** Question sets may
contain personal notes, exam content, or copyrighted material. Sanitize any
sample input before sharing it.

## Threat model

Quizeasy 1.x is a client-side, local-first app:

- There is **no backend**, no account system, and no server-side data store.
- All sets, questions, sessions, attempts, and preferences live in the browser's
  IndexedDB on the user's device.
- There is **no telemetry** and no analytics script.
- The app makes no network request with your study content.
- The production build is a static bundle (HTML, JS, CSS, icons, service
  worker) that can be served from any static host.

Because of this, the main risks we care about are:

1. **Local data loss or corruption** — for example, an invalid import or restore
   that destroys existing data. Quizeasy validates files before touching the
   database, remaps colliding IDs instead of overwriting, and merges restores.
   Reports of any path that wipes or overwrites data are treated as security
   bugs.
2. **Untrusted file handling** — imported `.json` files are untrusted input and
   are size-limited and schema-validated. Report any input that causes a crash,
   hang, or unbounded memory use.
3. **Untrusted pasted text** — the parser must not execute, evaluate, or fetch
   anything from pasted content. Pasted HTML must be treated as plain text.
4. **Dependency vulnerabilities** — report them if they are reachable from the
   running app.
5. **Service worker and caching** — the PWA precaches only the app's own build
   output. Caching unrelated or third-party origins would be a bug.

## Secrets

- Never commit API keys, tokens, or `.env` files.
- Quizeasy 1.x requires no credentials at all and ships none.
- Browser storage is **not** a secure secret store. A future release may add
  optional bring-your-own-key AI providers; that feature must state this
  limitation plainly and must store keys per device, never in the bundle, in
  logs, or in exported files.
- Exported set files and backup files contain your study data by design — treat
  them as sensitive, and never attach real ones to a public issue.

## Supported versions

Security fixes are applied to the latest released minor version on the default
branch. Pre-1.0 development snapshots are supported on a best-effort basis.
