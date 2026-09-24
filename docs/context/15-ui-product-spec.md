# UI and Product Specification

## Design read

Sanitas is a trust-first health-tech product interface for a non-technical reviewer.

Desired character:
- clinical
- calm
- precise
- evidence-oriented
- modern
- restrained

Avoid:
- AI-purple visual clichés
- glowing brain imagery
- fake hospital dashboards
- excessive glass
- generic three-card marketing layout
- chat-first interaction
- raw JSON report rendering

## Primary pages

### New Review
One clear workspace with:
- text tab
- image/PDF upload tab
- accepted type/size guidance
- synthetic-data notice
- submit action
- inline validation

### Processing
Show a truthful generic processing composition while the synchronous request is active.

Do not simulate exact backend stages unless the UI receives real stage data.

Copy can state:
"Reviewing the submitted document..."
with a skeleton matching the report layout.

### Report
Desktop:
- concise report summary at top
- section navigation
- structured sections
- evidence drawer/panel

Core sections:
- Patient information
- Symptoms
- Diagnoses / conditions
- Medications
- Vitals
- Allergies
- Clinical observations
- Clinical concerns
- Missing information
- Potential inconsistencies
- Requires review

Use cards only where hierarchy benefits. Dense facts can use grouped lists/tables with accessible semantics.

### Evidence interaction
Selecting an extracted entity shows:
- source page
- source quote
- certainty
- relevant warning if source quality is degraded

For text/digital PDF canonical text, highlight the evidence quote inside the referenced segment.

Image-region coordinates are not baseline scope.

### History
Each row:
- date/time
- source type
- filename or "Text note"
- status
- report summary excerpt

## Empty/loading/error states

Implement all three explicitly.

Errors must map from backend typed error codes and offer a relevant next action.

## Accessibility

- visible labels
- keyboard-accessible tabs/navigation
- focus states
- semantic headings
- no color-only certainty indicator
- WCAG AA contrast target
- reduced-motion support

## Responsive behavior

- desktop report may use side navigation/evidence panel
- below 768px collapse into one column
- evidence opens as sheet/drawer on mobile
- no horizontal clinical-data overflow

## Design skill use

The supplied anti-slop frontend skill is principally a landing-page/portfolio skill and explicitly says dense product UI is outside its core scope. Apply its anti-generic discipline, accessibility, typography, loading/error-state and performance guidance, but do not force marketing-page patterns into the Sanitas application.
