Nudge --- Design System & UI Implementation Guide

Purpose: This document is the source of truth for coding agents
implementing or modifying Nudge's UI.

Product: Nudge is an AI-powered coding learning environment. Users
learn by building real projects and receive contextual hints when they
are stuck. The AI should guide thinking, not write solutions.

1. Product Design Principle

Core principle

Less, but better.

Nudge should feel like a focused developer tool rather than an AI
dashboard.

Every element must earn its place.

Before adding a UI element, ask:

Does the learner need this?

Does it help them understand, build, debug, or progress?

Can the same information be communicated more simply?

Is it competing with the code or task?

If the answer is no, remove it.

Product personality

Calm

Focused

Technical

Modern

Quietly confident

Human

Helpful without being intrusive

Avoid:

Gamification-heavy UI

Excessive gradients

Glassmorphism everywhere

Large decorative illustrations

Dense dashboards

Excessive badges

Unnecessary toolbars

AI-generated-looking UI

"Magic" language

Solution-first AI interactions

2. Brand

Name

nudge

Always use lowercase in the product wordmark unless a sentence requires
normal capitalization.

Brand idea

A nudge is a small push in the right direction.

The product should visually communicate:

Small hints. Big progress.

The brand should never feel like an AI that takes control.

3. Color System

The primary brand color is a soft mint/teal.

Brand

--brand-50:  #ECFDF8;
--brand-100: #D7F8EF;
--brand-200: #B7EBDD;
--brand-300: #8EDBC7;
--brand-400: #6BCDB4;
--brand-500: #82CDBD;
--brand-600: #55B5A2;
--brand-700: #3C9485;

Use brand-500 as the primary accent.

The color should feel like progress, clarity, and calm rather than
urgency.

Dark surfaces

--bg:       #080C0D;
--surface:  #0D1214;
--surface-2:#11181A;
--surface-3:#151D1F;

--border:   #202A2C;
--border-2: #2A3739;

Text

--text-primary:   #F4F7F6;
--text-secondary: #A9B5B2;
--text-muted:     #71807C;
--text-disabled:  #4B5754;

Semantic

--success: #67D6B2;
--warning: #E9C46A;
--error:   #F06A6A;
--info:    #76A8FF;

Color rules

Do not use brand color for everything.

Primary actions may use brand.

Active navigation can use a subtle brand indicator.

Code syntax highlighting should use a separate syntax palette.

Errors should be red, not brand-colored.

Warnings should be amber.

Avoid pure #FFFFFF for large amounts of text.

Avoid pure black backgrounds.

Never introduce arbitrary colors without a reason.

4. Typography

Use a modern geometric/system sans-serif.

Preferred:

font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;

For code:

font-family:
  "JetBrains Mono",
  "SFMono-Regular",
  Consolas,
  monospace;

Type scale

Display:   64–72px / 0.95–1.0
H1:        40–48px / 1.05
H2:        28–32px / 1.15
H3:        20–22px / 1.25
Body:      15–16px / 1.55
Small:     13–14px / 1.4
Caption:   12px / 1.4
Code:      13–15px / 1.6

Do not make every heading bold.

Use weight intentionally:

400 — body
500 — labels
600 — buttons / headings
700 — major marketing headlines

5. Spacing

Use a 4px base unit.

4
8
12
16
20
24
32
40
48
64
80
96

Prefer fewer, larger spacing decisions over many tiny margins.

6. Radius

Nudge uses restrained rounded corners.

--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 18px;

Avoid excessively rounded pill-shaped UI unless it communicates status.

Buttons should generally use 8–10px radius.

Cards should generally use 12–14px.

7. Borders & Shadows

Borders are more important than shadows.

Default:

border: 1px solid var(--border);

Use shadows sparingly.

Preferred shadow:

box-shadow: 0 12px 40px rgba(0, 0, 0, 0.24);

Avoid:

Huge glow effects

Strong neon shadows

Multiple stacked shadows

Heavy card elevation

8. Icons

Use a consistent outline icon library such as Lucide.

Rules:

16px for compact controls

18px for standard controls

20--22px for prominent actions

Stroke width around 1.75--2px

Never mix unrelated icon styles

File icons should communicate file type.

Examples:

.js       JavaScript icon
.jsx      React icon
.ts       TypeScript icon
.tsx      React/TypeScript icon
.json     JSON icon
.html     HTML icon
.css      CSS icon
.md       Markdown icon
folder    Folder icon

Do not use generic document icons when a recognizable file icon exists.

9. Navigation

The global navigation is intentionally small.

Desktop:

nudge                         Learn   Projects   Progress          Log in   Get started

Do not add:

Search

Notifications

Extra status indicators

Unnecessary settings

Decorative controls

The landing page header should remain lightweight.

10. Landing Page

Hero

Primary message:

Learn by building.
Get nudged when you're stuck.

Supporting message:

Write real code, solve real problems, and get contextual hints from an
AI mentor that helps you think --- not do it for you.

Primary CTA:

Start learning →

Optional secondary CTA:

See how it works

Do not add excessive feature badges or a long feature grid above the
fold.

Hero visual

The workspace mockup is the main visual.

It should communicate:

Real project

File explorer

Code editor

Terminal

Contextual AI hint

Highlighted relevant code

The AI hint should not contain the solution.

Example:

It looks like you're not handling empty input. Try checking if the
input is empty before adding a todo.

Then:

Think about it

What condition would prevent adding a todo when the input has no
content?

No generated code.

No "Apply this fix."

No one-click solution.

11. Workspace

The workspace is the core product experience.

Use a three-region structure:

┌──────────────┬──────────────────────────────┬─────────────────┐
│              │                              │                 │
│ File         │ Task + Code Editor          │ AI Mentor       │
│ Explorer     │                              │                 │
│              │                              │                 │
│              │ Terminal                    │                 │
└──────────────┴──────────────────────────────┴─────────────────┘

Left sidebar

Contains only project navigation.

Top:

← Back to projects

Then:

Project
Full-Stack Feedback Board

backend
  src
    server.js
    feedback.js
    routes.js
  package.json
  .env.example

frontend
  index.html
  package.json

README.md

Important

Do not show:

Search

Random project metadata

Excessive action icons

Decorative progress widgets

Unnecessary file locks/badges

12. Task Header

The task header should contain:

←   Task 1 of 5   [In progress]

Implement GET /api/feedback

Description below:

Connect the feedback list to the database by implementing the GET
/api/feedback route handler. The endpoint must retrieve all saved
feedback entries from the database and return them as a JSON array.

Right side:

Open Preview ↗
Evaluate

Files you'll work with

Show only task-relevant files.

Example:

Files you'll work with

JS  feedback.js
JS  routes.js

This section is important because it reduces cognitive load.

13. Code Editor

The editor should feel like a focused professional IDE.

Include:

File tabs

Syntax highlighting

Line numbers

Active line

Error line markers

Formatting control

Fullscreen control if needed

Avoid:

Excessive toolbar buttons

Duplicate preview controls

Multiple run controls for the same action

Decorative badges

Preview

Use exactly one clear action:

Open Preview ↗

The frontend preview should open in a separate tab/panel.

Do not create separate "Preview", "Live Preview", and "Output" controls.

14. Terminal

The terminal is the source of truth for console/server output.

Use:

Terminal

Do not rename it to "Console Output."

Terminal may contain:

$ npm run dev

Vite v5.0.0 ready in 300ms

→ Local: http://localhost:5173

The terminal should not duplicate evaluation results.

15. Evaluation

The primary evaluation action is:

Evaluate

Evaluation results should appear in the terminal/results region and in a
concise AI summary when appropriate.

Success state

Use:

Evaluation passed

4 / 4 tests passed

Your implementation satisfies all requirements.

Optional details:

✓ GET /api/feedback returns HTTP 200
✓ Response body is an array
✓ Feedback fields are valid
✓ Items are sorted correctly

The success state should feel calm.

Do not use confetti.

Do not use giant celebratory graphics.

Do not overwhelm the user with text.

16. Evaluation Failure

Failure should identify the problem without solving it.

Example:

Evaluation failed

0 / 4 tests passed

GET /api/feedback
The server failed to start because of an error in
backend/src/models/Feedback.js.

Check the highlighted line and investigate why `res`
is referenced outside the request handler.

The editor should highlight the relevant line.

The AI can explain the problem conceptually.

It should not automatically provide the corrected code.

17. Nudge Engine

Nudge is fundamentally a hinting engine, not a coding agent.

This is the most important product constraint.

Nudge may

Explain what is wrong

Point to relevant code

Highlight lines

Ask guiding questions

Explain concepts

Help interpret errors

Suggest what to inspect next

Gradually increase hint specificity

Nudge must not default to

Writing the solution

Providing complete code

"Apply this fix"

Auto-editing files

Replacing the learner's work

Completing the task

Correct interaction

[Highlighted line 16]

Nudge

This query is retrieving the feedback documents,
but something about the response handling may be
causing the request to fail.

Think about it →

What should happen after the database query succeeds?

The learner still has to reason and write the code.

18. Nudge Button

The main AI action should be:

Need a nudge?

Place it prominently but quietly in the AI sidebar.

It should not dominate the workspace.

Use a lightbulb or similarly simple icon.

Do not create five competing AI buttons.

Avoid:

Explain task
Review code
Give hint
Show output
Security best practices

as permanent buttons.

The interface should encourage one natural interaction:

Need a nudge?

19. Contextual Hint

When a hint is generated:

Identify the relevant file.

Identify the relevant line/range.

Highlight it in the editor.

Display the hint near the AI mentor.

Explain the reasoning problem.

Ask a question that moves the learner forward.

Example:

Line 16 highlighted

Nudge

You're querying the database correctly.
Now look at what happens immediately after
the query resolves.

Think about it →

Where should the successful result be sent
back to the client?

The hint should be short.

20. Hint Progression

Hints should become more explicit gradually.

Level 1 --- Direction

Look at what happens after the database query completes.

Level 2 --- Concept

The handler needs to send the retrieved documents back to the client.

Level 3 --- Specific question

Which Express response method sends JSON data back to the requester?

Level 4 --- Very specific guidance

Check the response object available inside the route callback.

Do not jump directly to Level 4.

Never automatically show the final code unless the product explicitly
introduces a separate solution/reveal feature.

21. Responsive Design

Desktop is the primary experience.

At smaller widths:

Keep the editor usable.

Collapse the AI sidebar into a drawer.

Keep the file explorer collapsible.

Preserve the terminal.

Never allow the code editor to become unusably narrow.

22. Motion

Motion should communicate state, not decorate the interface.

Use:

150--200ms transitions

Small opacity/translate transitions

Smooth sidebar opening

Subtle active-line transitions

Avoid:

Bouncy animations

Excessive spring effects

Continuous animated backgrounds

Floating particles

Animated gradients

23. Accessibility

Required:

Keyboard navigation

Visible focus states

WCAG-conscious contrast

Tooltips for icon-only controls

Proper button semantics

aria-label for ambiguous icon buttons

Do not communicate state using color alone

Keyboard shortcuts should be limited to genuinely useful actions.

24. Component Philosophy

Prefer composable primitives:

Button
IconButton
Badge
Tabs
FileTree
CodeEditor
Terminal
TaskHeader
HintCard
EvaluationCard
Sidebar
Modal
Tooltip

Avoid building giant monolithic components.

Keep visual primitives consistent across the application.

25. Button Hierarchy

Only one primary action should dominate a given area.

Primary

Mint filled button.

Example:

Start learning →
Evaluate

Secondary

Subtle outlined button.

Example:

Open Preview ↗

Tertiary

Text/icon button.

Example:

Format

Do not make every button filled.

26. What Agents Should Remove

If an existing implementation contains any of the following without a
clear product reason, remove it:

Search bar in workspace

Theme toggle in workspace

Duplicate preview buttons

Duplicate output tabs

"Console Output" when Terminal already exists

Permanent AI action button collections

Project progress widgets that do not affect the current task

Decorative badges

Excessive status pills

Unnecessary top-right controls

Duplicate file metadata

Excessive borders

Heavy shadows

Large empty cards

AI solution buttons

"Apply this fix"

Generated code inside hints

27. Design Decision Rule

When two designs are functionally equivalent:

Choose the one with fewer visible elements.

When information can be shown contextually:

Do not show it permanently.

When a control is rarely used:

Hide it behind an appropriate secondary action.

When an AI feature can solve a problem for the learner or teach the
learner:

Teach first.

28. Visual Reference

The intended visual direction is:

Apple-level restraint + professional developer tooling + educational
clarity.

Not:

AI dashboard + SaaS template + gaming UI.

The UI should look like a product that has been edited repeatedly until
only the necessary pieces remain.

29. Agent Checklist

Before submitting UI work, verify:

Layout

No unnecessary elements were added.

Primary content has clear visual priority.

No unexplained empty space.

Panels have intentional proportions.

Typography

Typography hierarchy is obvious.

Body text is readable.

No excessive font weights.

Code uses a monospace font.

Color

Mint is used as an accent, not everywhere.

Error/warning/success states are distinct.

Contrast is sufficient.

No arbitrary colors were introduced.

Workspace

Back to projects exists.

Relevant files are shown.

File icons match file types.

Open Preview is the single frontend preview action.

Terminal handles runtime output.

Evaluate is clearly available.

Nudge is the primary AI interaction.

AI

Hints reference relevant code.

Relevant lines are highlighted.

Hints teach rather than solve.

No "Apply this fix."

No solution code is displayed by default.

Overall

Remove anything that does not help the learner.

Check the page at the actual target viewport.

Prefer consistency over novelty.

Prefer clarity over decoration.

Final Rule

Nudge should never make the learner feel like they are operating an
AI.

They should feel like they are learning to code, with a quiet mentor
nearby when they get stuck.