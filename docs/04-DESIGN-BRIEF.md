# Design Brief

## Design goal

Quizeasy should feel easier and calmer than a typical learning-management system.

The interface should communicate:

- simple
- focused
- friendly
- modern
- trustworthy
- fast

Avoid looking like an enterprise dashboard.

## Brand personality

Quizeasy is:

- helpful
- student-friendly
- clean
- slightly playful
- not childish
- not overly gamified

## Core visual concept

Use a strong content hierarchy with rounded cards, generous whitespace, and a limited accent palette.

The product should visually reinforce:

> Paste → Review → Study

## Layout

### Desktop

- sidebar or compact top navigation
- centered content container
- wide import editor/preview
- avoid excessive full-width text

### Mobile

- bottom navigation
- large touch targets
- sticky primary actions when useful
- avoid nested side panels
- forms should be one-column

## Suggested pages

### Library

Header:

- Quizeasy
- search
- import CTA

Content:

- recent sets
- all sets
- clear empty state

### Import

Two-stage layout:

1. Paste
2. Preview

Desktop can show source and preview side-by-side.
Mobile should stack them.

### Set detail

Show:

- title
- question count
- last studied
- primary Study button

Secondary:

- Edit
- Add questions
- Export
- More menu

### Study configuration

Keep choices limited.

Use cards for:

- Flashcards
- Multiple choice
- Identification
- Mixed

Then show only the settings relevant to the selected mode.

### Study session

Make the question the visual focus.

Avoid navigation clutter.

### Results

Emphasize:

- score
- missed questions
- retry mistakes

## Color

Do not hardcode a final brand palette in the spec. Choose a coherent accessible palette during implementation.

Prefer:

- neutral background
- one primary accent
- green for correct
- red for incorrect
- amber for warnings

Correct/incorrect states must include icon/text, not only color.

## Typography

Use a highly legible modern sans-serif.

Keep body text comfortable on mobile.

## Component language

Recommended:

- rounded cards
- subtle borders
- restrained shadows
- pill tags
- strong primary buttons
- secondary ghost/outline actions
- clear segmented controls

## Motion

Use subtle motion for:

- card flip
- progress
- feedback
- view transitions

Respect reduced-motion preferences.

Avoid decorative animation during tests.

## Icons

Use one consistent icon library.

Do not mix multiple icon styles.

## Dark mode

Support dark mode from MVP if reasonable.

Do not simply invert colors. Ensure:

- readable cards
- visible borders
- good input contrast
- correct/wrong states remain distinct

## Accessibility

- minimum usable touch targets
- keyboard focus visible
- labels attached to inputs
- dialog focus management
- no placeholder-only labels
- semantic heading order
- sufficient contrast

## Copy style

Use plain language.

Prefer:

> 3 questions need review.

over:

> Parsing operation completed with 3 validation anomalies.

Prefer:

> Paste your questions

over:

> Initialize content ingestion
