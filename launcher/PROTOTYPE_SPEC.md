# Clickable Prototype Specification
## For Stakeholder Validation

This document specifies a lightweight, clickable prototype that can be built quickly to validate the user flow with stakeholders. The prototype focuses on navigation flow and key interactions, not pixel-perfect design.

---

## Prototype Scope

### What to Include:
- ✅ Navigation between all screens
- ✅ Pattern selection interaction
- ✅ Form inputs and basic validation
- ✅ Visual timeline/graph updates
- ✅ Script preview (read-only)
- ✅ Mode switching (Easy/Advanced)

### What to Skip (for now):
- ❌ Real k6 script generation
- ❌ Actual API connection testing
- ❌ Real-time data updates
- ❌ Complex animations
- ❌ Full script editor functionality

---

## Prototype Structure

### Pages/Screens Needed:

1. **Home Page** - Pattern Selection
2. **Phase 1** - Load Pattern Configuration
3. **Phase 2** - API Endpoint Configuration
4. **Phase 3** - Script Review
5. **Results Page** - Test Started Confirmation

### Navigation Flow:

```
Home → Phase 1 → Phase 2 → Phase 3 → Results
  ↑       ↑         ↑         ↑
  └───────┴─────────┴─────────┘
    (Back buttons)
```

---

## Page 1: Pattern Selection

### Interactive Elements:

1. **6 Pattern Cards**
   - Clickable area: Entire card
   - Hover state: Card elevates, border highlights
   - Selected state: Checkmark appears, border changes color
   - Action: Navigate to Phase 1

2. **"What happens when I choose a pattern?" Link**
   - Clickable: Opens modal/overlay
   - Content: Explanation of the 3-step process
   - Action: Close modal, continue to pattern selection

3. **Mode Toggle** (Optional for prototype)
   - Toggle between Easy/Advanced
   - For prototype: Just show Easy Mode

### Mock Data:

```javascript
const patterns = [
  {
    id: 'quick-check',
    title: 'Quick Check',
    description: 'Is my API working? Quick test to verify everything responds.',
    duration: '30 seconds',
    users: '1-5 users',
    graph: 'flat-line', // Simple visual representation
  },
  {
    id: 'normal-day',
    title: 'Normal Day',
    description: 'What happens during a normal busy day? Simulate typical usage.',
    duration: '5 minutes',
    users: '50 users',
    graph: 'ramp-steady-ramp',
  },
  // ... other patterns
]
```

### Prototype Implementation Notes:

- Use static images or simple SVG for load pattern graphs
- Cards can be simple divs with hover effects
- Click handler: `navigate('/phase1?pattern=normal-day')`

---

## Page 2: Phase 1 - Load Pattern Configuration

### Interactive Elements:

1. **Visual Timeline Graph**
   - Static image/SVG that updates based on inputs
   - Can be simple: Update SVG path when inputs change
   - For prototype: Pre-rendered images for common configurations

2. **Stage Configuration Cards**
   - Input fields: Duration (text), Users (number)
   - Remove button: Hides stage, updates graph
   - Add Stage button: Adds new stage card

3. **Quick Presets**
   - Buttons: "Quick Test", "Standard Test", "Extended Test"
   - Action: Pre-fills all stage inputs, updates graph

4. **Summary Section**
   - Auto-calculates: Total duration, Peak users
   - Updates in real-time as user changes inputs

5. **Navigation**
   - Back button: Returns to Home
   - Next button: Validates inputs, navigates to Phase 2

### Mock Data Structure:

```javascript
const stages = [
  {
    id: 1,
    type: 'ramp-up',
    duration: '2m',
    target: 50,
    label: 'Build up traffic',
  },
  {
    id: 2,
    type: 'steady',
    duration: '5m',
    target: 50,
    label: 'Keep traffic steady',
  },
  {
    id: 3,
    type: 'ramp-down',
    duration: '1m',
    target: 0,
    label: 'Wind down traffic',
  },
]
```

### Prototype Implementation:

- Use a simple charting library (Chart.js, Recharts) for the graph
- Form inputs with onChange handlers
- Calculate summary values on input change
- Store configuration in state/URL params

### Validation:

- Duration format: Must be valid (e.g., "2m", "30s", "1h")
- Users: Must be positive number
- At least one stage required

---

## Page 3: Phase 2 - API Endpoint Configuration

### Interactive Elements:

1. **API URL Input**
   - Text input field
   - Placeholder: "https://api.example.com/users"
   - Validation: Basic URL format check

2. **Test Connection Button**
   - Action: Simulate connection test
   - For prototype: Random success/failure (or always success)
   - Shows status: "✓ Connection successful" or "✗ Connection failed"

3. **Advanced Options Toggle**
   - Collapsed by default
   - Click to expand/collapse
   - Shows: HTTP method, headers, body inputs

4. **Preview Section**
   - Shows what will happen based on inputs
   - Updates when URL changes

5. **Navigation**
   - Back button: Returns to Phase 1
   - Next button: Validates URL, navigates to Phase 3

### Prototype Implementation:

- Simple form with URL validation
- Mock connection test: `setTimeout(() => setStatus('success'), 1000)`
- Collapsible section: Use CSS/state to show/hide
- Preview: Template string with user's inputs

---

## Page 4: Phase 3 - Script Review

### Interactive Elements:

1. **Script Preview**
   - Read-only code block
   - Syntax highlighting (use a library like Prism.js or highlight.js)
   - Shows locked sections with 🔒 icon
   - Shows editable sections with ✏️ icon

2. **"Edit Safe Sections" Button**
   - Opens modal/overlay
   - Shows editable fields: sleep duration, check conditions
   - Save/Cancel buttons

3. **"View Full Script" Link**
   - Opens full script in modal
   - Read-only, for reference

4. **Test Summary**
   - Shows: Pattern, duration, peak load, endpoint
   - Static information from previous steps

5. **Help Links**
   - "What does this script do?" - Opens help modal
   - "Common examples" - Shows example scripts
   - "k6 Documentation" - External link

6. **Navigation**
   - Back button: Returns to Phase 2
   - "Run Test" button: Navigates to Results page

### Prototype Implementation:

- Generate script from stored configuration:
  ```javascript
  const generateScript = (pattern, stages, apiUrl) => {
    return `// Auto-generated script
export const options = {
  stages: ${JSON.stringify(stages, null, 2)},
  // ... rest of script
}`;
  }
  ```
- Use code syntax highlighter
- Modal for editing: Simple form overlay
- Help modals: Static content

---

## Page 5: Results Page

### Interactive Elements:

1. **Success Message**
   - "Test started successfully!"
   - Test ID display
   - Status badge: "🟢 Running"

2. **Grafana Link**
   - Button: "View Results in Grafana"
   - Opens in new tab (or shows mock Grafana page)

3. **Test Details**
   - Shows configuration summary
   - Estimated completion time

4. **Navigation**
   - "Start New Test" button: Returns to Home
   - "View All Tests" link: (Future feature)

### Prototype Implementation:

- Simple success page
- Mock Grafana link (can link to actual Grafana if available)
- Status polling: For prototype, can simulate status changes

---

## Technical Implementation Options

### Option 1: HTML/CSS/JavaScript (Simplest)
- Static HTML pages
- Basic JavaScript for navigation and form handling
- CSS for styling
- Can use libraries: Chart.js for graphs, Prism.js for code highlighting

### Option 2: React/Next.js (Matches Current Stack)
- Use existing Next.js setup
- Create prototype pages alongside current app
- Reuse components where possible
- Can deploy easily for stakeholder access

### Option 3: Figma/Adobe XD (Design Tool)
- Create interactive prototype in design tool
- Clickable hotspots for navigation
- Form inputs can be simulated
- Easy to share with stakeholders
- No code required

### Recommended: Option 2 (Next.js)
- Already have the stack
- Can reuse components
- Easy to iterate
- Can gradually replace prototype with real functionality

---

## Prototype Features Checklist

### Must Have:
- [x] Navigation between all screens
- [x] Pattern selection with visual feedback
- [x] Load pattern configuration form
- [x] Visual timeline/graph (updates with inputs)
- [x] API endpoint input with validation
- [x] Script preview (read-only)
- [x] Test summary on each page
- [x] Back/Next navigation
- [x] Success/Results page

### Nice to Have:
- [ ] Connection test simulation
- [ ] Advanced options toggle
- [ ] Script editing modal
- [ ] Help modals
- [ ] Status polling on results page

### Can Skip:
- [ ] Real k6 execution
- [ ] Actual API calls
- [ ] Real-time data
- [ ] Complex animations
- [ ] Full script editor

---

## User Testing Scenarios

### Scenario 1: First-Time User
1. Lands on pattern selection
2. Clicks "What happens when I choose a pattern?"
3. Selects "Normal Day" pattern
4. Goes through all 3 phases
5. Reviews script
6. Runs test

**Questions to ask:**
- Was the pattern selection clear?
- Did they understand what each step was asking?
- Were they confused by any terminology?
- Did they feel confident about what would happen?

### Scenario 2: Returning User
1. Goes directly to pattern selection
2. Selects pattern quickly
3. Uses quick presets in Phase 1
4. Enters API URL
5. Skips script review
6. Runs test immediately

**Questions to ask:**
- Was the flow fast enough?
- Were quick options easy to find?
- Could they skip unnecessary steps?

### Scenario 3: Advanced User
1. Selects pattern
2. Customizes all stages manually
3. Expands advanced options
4. Tries to edit script
5. Switches to Advanced Mode (if implemented)

**Questions to ask:**
- Was Advanced Mode easy to find?
- Were advanced options clear?
- Did they feel restricted in Easy Mode?

---

## Prototype Delivery

### For Stakeholder Review:

1. **Deploy to accessible URL**
   - Can use Vercel/Netlify for Next.js
   - Or share localhost with ngrok
   - Or use design tool sharing (Figma)

2. **Provide Context Document**
   - What this prototype demonstrates
   - What's real vs. mocked
   - What feedback you're looking for

3. **Testing Guide**
   - Suggested scenarios to try
   - Questions to consider
   - How to provide feedback

### Feedback Collection:

- **What worked well?**
- **What was confusing?**
- **What's missing?**
- **Any terminology issues?**
- **Flow concerns?**

---

## Next Steps After Validation

1. **Refine based on feedback**
   - Update language
   - Adjust flow
   - Add missing elements

2. **Build real functionality**
   - Replace mocks with real API calls
   - Implement actual k6 script generation
   - Add real-time updates

3. **Polish UI**
   - Refine visual design
   - Add animations
   - Improve responsiveness

4. **User testing**
   - Test with real users
   - Iterate based on findings
   - Launch!

---

## Quick Start Guide for Prototype

### If using Next.js:

1. Create prototype pages:
   - `/prototype` - Pattern selection
   - `/prototype/phase1` - Load pattern
   - `/prototype/phase2` - API config
   - `/prototype/phase3` - Script review
   - `/prototype/results` - Results

2. Use simple state management:
   - Context API or URL params to store configuration
   - Local state for form inputs

3. Add basic styling:
   - Use existing styles or simple CSS
   - Focus on functionality over polish

4. Deploy for review:
   - Push to GitHub
   - Deploy to Vercel
   - Share URL with stakeholders

### Estimated Time:
- **Simple HTML/JS**: 4-6 hours
- **Next.js prototype**: 6-8 hours
- **Design tool**: 2-4 hours

---

## Success Criteria

The prototype is successful if stakeholders can:
- ✅ Understand what each pattern does
- ✅ Complete the 3-phase flow without help
- ✅ Understand what will happen when they run a test
- ✅ Feel confident about the process
- ✅ Provide specific, actionable feedback

