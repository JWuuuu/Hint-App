# Tarot Room Product Spec

## Direction

Tarot Room should feel like a professional tarot reader session, not an AI form. The flow should be calm, direct, and ritual-like, while staying usable and honest.

## Experience Principles

- Start with the question, not with "Tell the story."
- Keep context optional. The user can add it before the draw or continue the story after the cards reveal.
- Guide the user like a real reader: question, focus, optional context, shuffle or wash, cut, spread, pick, reveal, continue conversation.
- Use professional, human language. Avoid AI-style copy, fake mystical language, and vague filler.
- Lean into the card signal clearly: positive, warning, mixed, or reflective. Do not make irresponsible guarantees.

## Start Screen

- Main prompt: `What do you want the cards to look into?`
- Main input placeholder: `Ask about a person, a decision, a feeling, or something you can't stop thinking about.`
- Focus label: `Where should we focus?`
- Focus options:
  - Someone or a relationship
  - A decision I need to make
  - Something changed or ended
  - A pattern that keeps repeating
  - I'm not sure yet
- Tarot question area label: `The question we'll read`
- Helper: `I'll keep the reading centered on this. You can edit it before we draw.`
- Default question: `What do I need to see clearly right now?`
- Optional context label: `Add context if it matters`
- Optional context placeholder: `One or two details are enough. You can also leave this blank and tell me after the cards reveal.`
- Continue button: `Begin the reading`

Context is optional. The only blocking requirement is a non-empty question.

Avoid visible copy like:

- Tell the story
- Generate question
- Submit
- Next
- If you feel comfortable sharing, I'm here to support you

## Shuffle, Cut, Spread

- Keep the current shuffle/wash UI direction unless explicitly redesigned.
- User presses, holds, drags, or swipes to wash the deck.
- On release, the cards automatically gather back into one clean deck stack.
- After gathering, automatically cut the deck two or three times.
- The cut animation should split the deck, move one stack, then merge back into one deck.
- After the cut finishes, automatically advance to the card selection stage.
- Do not show extra buttons after shuffling. No separate `Let them rest`, `Auto wash`, cut, spread, or choose cards buttons.

Suggested stages:

- idle
- washing
- merging
- cutting
- spreading
- selecting
- selected
- readyToReveal

The cut must affect the internal hidden deck order. The visible spread positions should remain stable.

## Spread Labels

- Use dynamic spread position labels, not `Hint 1`, `Hint 2`, `Hint 3`.
- One-card spread should use a simple reader-style label such as `The Message`.
- Three-card and larger spreads should use labels from the selected spread config.
- Selected area title should be `Selected Card` or `Selected Cards`.

## Future Reading Result Direction

Do not implement this section unless explicitly requested.

The reading result should eventually follow this order:

1. Card Breakdown
2. What this means for your question
3. Follow-up chat options

Card breakdown should use spread position labels plus card names. The final answer should be clear and human, without making absolute guarantees.
