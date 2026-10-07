# Product Requirements Document

## Product

**Name:** Quizeasy

**Type:** Open-source local-first quiz maker and study app.

## Problem

Students often already have study material or AI-generated Q&A, but turning it into usable study modes takes unnecessary work.

Existing tools commonly require:

- manually creating cards one by one
- account registration
- cloud storage
- paid AI features
- proprietary formats
- separate data for flashcards and quizzes

Quizeasy should make the path from text to studying extremely short.

## Product promise

> Paste questions. Review the import. Start studying.

## Primary users

### Student importing AI-generated Q&A

The user uploads a PDF to ChatGPT/Gemini/Claude, uses the Quizeasy prompt, copies the generated structured Q&A, and pastes it into Quizeasy.

### Student entering their own reviewer

The user manually pastes or types Q&A from notes.

### Open-source/privacy-oriented user

The user wants a study tool with no mandatory account and local data ownership.

## Core goals

- Import structured Q&A quickly.
- Save question sets locally.
- Study the same set in multiple modes.
- Make imports forgiving.
- Work without an account.
- Work without a backend.
- Work offline after initial load where practical.
- Make data portable.
- Remain useful without AI.
- Prepare for optional future BYOK AI integration.

## Non-goals for MVP

- Real-time collaboration
- Public quiz marketplace
- Social feeds
- Teacher classroom management
- Native PDF extraction
- OCR
- Hosted AI generation
- Payments
- Cloud account system

## Core entities

- Quiz Set
- Question
- Study Session
- Study Result
- User Preferences

## Primary features

### Library

Users can:

- view all sets
- search sets
- create a set
- import a set
- duplicate a set
- delete a set
- export a set
- see basic metadata such as question count and last studied date

### Set editor

Users can:

- edit title/description
- add questions
- edit questions
- delete questions
- add tags
- add wrong choices
- add explanations
- reorder questions where appropriate
- search/filter within a set

### Paste import

Users can:

- paste text
- see detected questions before saving
- see warnings and errors
- edit detected entries inline
- exclude invalid entries
- import valid items
- choose a set title

### Study modes

#### Flashcards

- show prompt
- reveal answer
- mark known / missed
- next / previous
- optional shuffle

#### Multiple choice

- use explicit distractors when present
- optionally derive distractors from compatible answers in the same set
- clearly indicate when insufficient distractors prevent a valid MCQ
- configurable question count
- shuffle choices
- immediate feedback in study mode
- delayed feedback in test mode

#### Identification

- text input
- normalize reasonable whitespace/case differences
- support accepted-answer variants
- show correct answer after submission

#### Mixed

Combine eligible questions across supported modes.

### Study configuration

Before a session, user can choose:

- mode
- number of questions
- shuffle questions
- shuffle answer choices
- study mode vs test mode
- include only selected tags where supported
- retry mistakes where applicable

### Results

Show:

- score
- correct
- incorrect
- skipped
- percentage
- missed questions
- option to retry missed
- option to review answers
- option to start again

### AI Guide

Provide:

- explanation that AI is optional
- copyable prompt for generic Q&A
- copyable prompt for MCQ-ready Q&A
- instructions for ChatGPT/Gemini/Claude/other AI
- reminder to review generated material for accuracy

No API key is required in MVP.

### Settings

- theme
- reduced motion preference where practical
- export all data
- import/restore all data
- clear all local data
- future AI provider area marked as not yet enabled

## Success criteria

A new user should be able to:

1. open Quizeasy
2. paste a valid 20-question Q&A set
3. preview it
4. save it
5. begin flashcards

without needing an account and without reading documentation.

## Key UX metric

Minimize steps from pasted text to active study session.

## Data ownership principle

User data should remain exportable in an open JSON format.

## Privacy principle

The MVP should not require study content to leave the user's device.

## Accessibility baseline

- keyboard navigable primary flows
- visible focus states
- proper labels
- sufficient contrast
- semantic controls
- screen-reader-friendly form errors
- avoid color as the only correctness signal
