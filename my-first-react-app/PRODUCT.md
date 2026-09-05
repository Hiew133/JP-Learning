# Product

## Register

product

## Users

Vietnamese speakers practising Japanese listening comprehension. They're
self-directed learners — practising on their own time, often on mobile, fitting
sessions into a busy day. Their goal is concrete: get better at understanding
spoken Japanese in real material. They arrive with some kanji and
grammar but need reps with real audio, and they read explanations in Vietnamese.

Two contexts of use:
- **Structured practice** — exam-style question sets (listen-and-choose,
  listen-and-fill, shadowing).
- **Bring-your-own content** — upload audio + transcript, or save YouTube videos,
  and let AI generate listening/fill quizzes and synced furigana transcripts from them.

## Product Purpose

A focused Japanese listening trainer. It exists because passive listening doesn't
build test-ready comprehension — active recall (choose, fill, shadow, review
mistakes) does. Success looks like: a learner returns regularly (streak),
practises across modes, sees their accuracy climb, and can turn any audio or
video they care about into graded listening practice. The app should feel like a
serious, quiet study tool — closer to a well-made textbook than a game.

## Brand Personality

Three words: **studious, calm, distinctly Japanese.** The voice is bilingual by
design — Japanese for the thing being learned (mode titles, section labels), Vietnamese
for guidance and explanation — and it treats the learner as a capable adult.
Emotional goal: focus and quiet confidence, not hype. The visual identity is
traditional Kyoto craft — washi paper, vermillion (朱色), matcha, indigo, gold,
mincho display type, hanko seals, seigaiha waves — and that identity is **locked
and to be deepened**, not replaced. Warmth comes from the palette and type, never
from cartoon friendliness.

## Anti-references

- **Not a childish / kawaii app.** No cartoon mascots, bubble UI, pastel overload,
  or confetti energy. Respectful and grown-up, even when celebrating a good score
  (the hanko result stamp is the right register; a bouncing mascot is not).
- **Not a generic SaaS dashboard.** Avoid the cream-tinted hero-metric template
  and identical icon-card grids that read as AI default. The Japanese identity is
  the differentiator — protect it.
- **Not loud gamification.** Streaks and accuracy are quiet motivators, not
  pressure mechanics.

## Design Principles

1. **The Japanese leads, the Vietnamese supports.** Japanese is the subject of
   study and gets the display type and prominence; Vietnamese scaffolds it
   underneath. Never flatten the two into one undifferentiated voice.
2. **Active recall over passive consumption.** Every screen should pull the
   learner toward doing — choosing, typing, repeating, reviewing mistakes — not
   just reading or listening.
3. **Quiet craft.** Restraint is the aesthetic. One committed identity, executed
   precisely; ornament (hanko, waves, mincho) is used deliberately, never
   sprinkled.
4. **Legible under real conditions.** Japanese text, furigana, and Vietnamese
   explanations must stay readable on a phone, at speed, mid-session. Readability
   of the learning content outranks decorative choices in every tie.
5. **Honest progress.** Stats reflect real practice and surface mistakes to
   revisit; motivation comes from visible improvement, not manufactured rewards.

## Accessibility & Inclusion

Target WCAG 2.1 AA. This is a primary focus alongside learning effectiveness.

- **Contrast:** body text ≥4.5:1, large/bold text ≥3:1. Watch the muted-on-washi
  combinations (`--text-muted` `#a09480` on `--bg` `#f4eddc` is a known risk) and
  the gold/indigo tinted callouts — verify rather than assume.
- **Reduced motion:** the global `prefers-reduced-motion` reset exists; keep every
  new animation behind a reduced-motion alternative.
- **Keyboard & focus:** all practice flows (options, fill inputs, navigation,
  recorder, TTS controls) must be fully keyboard-operable with visible focus.
- **Audio is core, so never audio-only:** transcripts, furigana, and Vietnamese
  translations must remain available for every listening exercise.
- **Furigana legibility:** reading aids must stay readable at small sizes and not
  rely on color alone to convey meaning.
```
