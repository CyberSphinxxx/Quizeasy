# Open-Source Repository Guide

## Repository goals

A contributor should be able to:

```bash
git clone <repo>
npm install
npm run dev
```

without needing:

- a backend
- an API key
- a cloud account

## Required root files

Recommended:

```text
README.md
LICENSE
CONTRIBUTING.md
SECURITY.md
CODE_OF_CONDUCT.md
AGENTS.md
TASKS.md
STATUS.md
package.json
```

## License

Choose an open-source license intentionally.

A permissive license such as MIT is simple for broad adoption, but the maintainer should select the license they actually want.

Do not invent a license choice on behalf of the owner if not specified.

## README sections

- What is Quizeasy?
- Demo/screenshots
- Features
- Why local-first?
- Installation
- Development
- Build
- Testing
- Import format
- AI guide workflow
- Data privacy
- Roadmap
- Contributing
- License

## Contribution quality

Require:

- lint
- typecheck
- tests
- no breaking schema changes without migration plan

## Issue templates

Useful:

- bug report
- feature request
- parser/import issue

Parser bug report should request sanitized sample input.

## Security policy

Explain:

- Quizeasy MVP is client-side/local-first
- never submit private study material in public issues
- never commit API keys
- future AI integrations will have separate credential guidance

## Releases

Use semantic versioning where practical.

Before release:

- verify build
- verify migrations
- verify export compatibility
- write release notes
- note schema changes explicitly

## Demo data

Include a small, original example set that avoids copyrighted proprietary exam questions.

## Branding

Keep repository assets organized:

```text
public/
  icons/
  brand/
```

Avoid using copyrighted characters as mascots or branding.
