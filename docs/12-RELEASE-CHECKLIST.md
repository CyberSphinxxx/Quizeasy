# Release Checklist

## Functional

- [ ] Create a set manually
- [ ] Paste/import canonical Q/A
- [ ] Parse extended Q/A/W/E/T
- [ ] Preview import
- [ ] Fix import errors
- [ ] Save set
- [ ] Edit questions
- [ ] Delete question
- [ ] Duplicate set
- [ ] Delete set
- [ ] Export set
- [ ] Import exported set
- [ ] Export full backup
- [ ] Restore full backup
- [ ] Flashcards work
- [ ] Multiple choice works
- [ ] Identification works
- [ ] Mixed mode works
- [ ] Results work
- [ ] Retry mistakes works
- [ ] AI guide works

## Data

- [ ] Refresh preserves local sets
- [ ] Schema validation protects imports
- [ ] Delete cascade behaves as documented
- [ ] ID collisions are handled safely
- [ ] Invalid backups do not corrupt existing data
- [ ] Export/import round trip is lossless for supported fields

## Quality

- [ ] ESLint passes
- [ ] TypeScript passes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Playwright critical paths pass
- [ ] Production build passes
- [ ] No known console errors in core flows

## UX

- [ ] Empty states
- [ ] Loading states
- [ ] Error states
- [ ] Confirmation/undo
- [ ] Mobile layout
- [ ] Desktop layout
- [ ] Long text wraps
- [ ] Keyboard navigation
- [ ] Dark mode if included
- [ ] Reduced-motion behavior if included

## PWA

- [ ] Manifest valid
- [ ] Icons exist
- [ ] Installable in supported browser
- [ ] App shell works offline after initial visit
- [ ] Update behavior does not interrupt an active session unexpectedly

## Documentation

- [ ] README
- [ ] Import format documented
- [ ] Setup instructions verified
- [ ] Test instructions
- [ ] CONTRIBUTING
- [ ] SECURITY
- [ ] License chosen by owner
- [ ] Roadmap distinguishes MVP vs future

## Final

- [ ] `docs/13-DEFINITION-OF-DONE.md` fully satisfied
- [ ] `TASKS.md` has no required MVP items unchecked
- [ ] `STATUS.md` contains no release-blocking known issue
