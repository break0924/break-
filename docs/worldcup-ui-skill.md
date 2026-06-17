# World Cup UI Skill

## When To Use

Use this skill for all tasks related to:

- Homepage redesign
- Banner design
- Match prediction cards
- Membership conversion modules
- Invite and sharing modules
- Posters and share images
- World Cup visual style consistency

## Goal

Make the product feel like a polished World Cup AI prediction platform, not an admin dashboard or a page made from stacked API fields.

## Style Baseline

- Deep blue and black-blue backgrounds
- Gold buttons and key information
- Red-blue gradients for matchday energy
- Semi-transparent cards, glowing borders, radius 16px+
- Score numbers must be visually prominent
- Flags, VS, and kickoff times must be aligned and easy to scan

## Required Workflow

1. Start with an aesthetic review.
2. Decide whether the current page deserves refactoring instead of patching.
3. Output a high-fidelity structure plan first.
4. Then write code.
5. Do not directly stack API fields into the UI.
6. Use mock data for high-fidelity UI first, then connect real APIs.

## UI Review Gate

After completing a homepage or core page, run this review before final delivery:

1. Compare the current page against user-provided screenshots and the target effect.
2. Output the current page problem list.
3. Output visual hierarchy issues.
4. Output layout issues.
5. Output conversion issues.
6. Decide whether the next step should be local optimization or a full rewrite.

If the page clearly fails the target visual quality, prefer a structural refactor over small patches.

## Hard Rules

- Do not stack fields vertically as raw text.
- Do not use only a background image without strong content containers.
- Do not leave excessive desktop whitespace.
- Non-member overlays must feel premium, not simply gray and disabled.
- Today's AI predictions are the primary homepage module.

## Standard Homepage Structure

1. Top navigation
2. World Cup banner
3. Today's AI predictions
4. Today's schedule
5. Historical hit rate
6. Challenge entry
7. Membership benefits
8. Invite friends
9. Risk note
10. Bottom navigation

## Output Checklist

Every relevant task should include:

- Page structure
- Component split
- Style strategy
- Code file paths
- Self-check result

## Self-Check

Before final output, verify:

- Does it have World Cup atmosphere?
- Does it look like a sports product homepage?
- Does it create membership conversion intent?
- Is it suitable for mobile?
