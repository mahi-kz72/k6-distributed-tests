# Performance Testing Dashboard - UX Design

## Overview
Redesign focused on making performance testing accessible to non-technical users through visual pattern recognition and guided configuration.

---

## User Journey Flow

### Step 1: Pattern-First Test Selection (Home Page)

**Goal:** Users select tests based on visual patterns, not terminology.

#### Visual Pattern Cards

Each test type is presented as a card with:

1. **Visual Load Pattern Graph**
   - X-axis: Time
   - Y-axis: Number of Virtual Users
   - Animated or static line chart showing the load pattern
   - Color-coded stages (ramp-up = green, steady = blue, spike = red, etc.)

2. **Human-Readable Title & Description**
   - Title: What it does (not technical name)
   - Description: Real-world scenario it simulates
   - Example: "Quick Health Check" instead of "Smoke Test"

3. **Visual Indicators**
   - Duration estimate (e.g., "~30 seconds")
   - Complexity badge (e.g., "Simple" or "Advanced")
   - Use case tags (e.g., "Daily Checks", "Pre-Launch")

#### Pattern Descriptions

**1. Quick Health Check (Smoke Test)**
- **Visual:** Flat line at low VU count (1-5 users)
- **Description:** "Verify your API responds correctly with minimal traffic. Like checking if a door opens before a party."
- **When to use:** Before other tests, after deployments, quick validation

**2. Normal Traffic Simulation (Load Test)**
- **Visual:** Gradual ramp-up → steady plateau → gradual ramp-down
- **Description:** "Simulate typical daily usage. Like testing a restaurant during normal lunch hours."
- **When to use:** Understanding normal performance, capacity planning

**3. Breaking Point Discovery (Stress Test)**
- **Visual:** Steady increase in steps → peak → ramp-down
- **Description:** "Gradually increase load to find when your system starts struggling. Like adding more and more weight to see when a table breaks."
- **When to use:** Finding limits, understanding failure points

**4. Sudden Traffic Surge (Spike Test)**
- **Visual:** Low baseline → sharp spike → hold → sharp drop → recovery
- **Description:** "Test what happens when traffic suddenly jumps. Like a flash sale or viral social media post."
- **When to use:** Preparing for traffic spikes, marketing campaigns

**5. Long-Term Stability (Soak Test)**
- **Visual:** Ramp-up → very long steady state → ramp-down
- **Description:** "Run normal load for hours to find slow problems. Like leaving a car running to find leaks."
- **When to use:** Finding memory leaks, gradual degradation

**6. Gradual Capacity Test (Breakpoint Test)**
- **Visual:** Multiple step increases → peak → ramp-down
- **Description:** "Systematically increase load in steps to find the exact breaking point. Like testing each floor of a building's weight limit."
- **When to use:** Precise capacity planning, finding exact limits

---

## Step 2: Guided Configuration (Easy Mode - Default)

### Phase 1: Load Pattern Configuration

**Visual Timeline Builder**

Users configure their test through an interactive timeline:

1. **Time-Based Stage Builder**
   - Visual timeline with draggable stage markers
   - Each stage shows:
     - Duration (editable)
     - Target VUs (editable)
     - Visual representation on the graph
   - Real-time preview of the load pattern as they configure

2. **Guided Questions**
   - "How long should the test run?" → Sets total duration context
   - "What's your expected normal traffic?" → Suggests VU counts
   - "Do you want to test sudden spikes?" → Guides toward spike pattern

3. **Smart Defaults**
   - Pre-filled with sensible defaults based on test type
   - One-click presets: "Quick (30s)", "Standard (5m)", "Extended (1h)"
   - Visual feedback showing what each preset does

### Phase 2: API Endpoint Configuration

**Simple Form with Guidance**

1. **Endpoint Input**
   - Large, clear input field
   - Placeholder: "https://api.example.com/users"
   - Real-time validation with helpful error messages
   - "Test Connection" button to verify before running

2. **Optional: Request Customization (Collapsible)**
   - Hidden by default
   - "Need to customize? (Advanced)"
   - When expanded: Method selector, headers, body

### Phase 3: Script Generation & Review (Easy Mode)

**Guided Script Creation**

1. **Auto-Generated Script Preview**
   - Shows the generated k6 script in a read-only preview
   - Syntax highlighted
   - Clear sections: Configuration, Test Logic, Assertions
   - "This is what will run" explanation

2. **Editable Sections (Safe Editing)**
   - Users can modify:
     - Request URL (already configured)
     - Sleep duration between requests
     - Basic assertions (status code checks)
   - Protected sections (load stages) are locked with explanation:
     "Load stages are managed by the timeline above. Changes here won't affect the load pattern."

3. **Validation & Safety**
   - Real-time syntax checking
   - Warning if script structure is broken
   - "Reset to Safe Defaults" button always available
   - Clear indication of what's safe to edit vs. what's managed by UI

4. **Help & Examples**
   - Contextual help tooltips
   - "What does this do?" explanations
   - Example scripts for common scenarios
   - Link to k6 documentation (opens in new tab)

---

## Step 3: Advanced Mode (Optional)

### Access Point
- Toggle switch: "Easy Mode" ↔ "Advanced Mode"
- Clear warning: "Advanced mode gives you full control but requires k6 knowledge"

### Advanced Mode Features

1. **Full Script Editor**
   - Full-featured code editor (Monaco/CodeMirror)
   - Syntax highlighting, autocomplete
   - Full k6 script editing capability

2. **Load Stage Integration**
   - Visual timeline still visible but shows "Applied from script"
   - If script stages don't match timeline, warning appears
   - Option to "Sync timeline from script" or "Apply timeline to script"

3. **Advanced Options**
   - Custom thresholds
   - Custom metrics
   - Multiple API endpoints
   - Complex test scenarios

4. **Safety Features**
   - "Validate Script" button before running
   - "Test Script Locally" option (runs a dry-run)
   - Clear warnings about destructive operations

---

## Visual Design Principles

### 1. Progressive Disclosure
- Show only what's needed at each step
- Advanced options hidden by default
- Clear "Learn more" or "Show advanced" links

### 2. Visual Feedback
- Real-time preview of load patterns
- Color-coded stages in timeline
- Animated transitions between steps
- Success/error states clearly indicated

### 3. Safety & Confidence
- "What will happen?" preview before running
- Estimated duration and resource usage
- Clear cancel/back options at every step
- Confirmation step before starting expensive tests

### 4. Learning & Guidance
- Tooltips explaining concepts
- "Why?" explanations for each field
- Example scenarios
- Links to documentation (non-intrusive)

---

## Key UX Patterns

### Pattern Selection Screen
```
┌─────────────────────────────────────────────────┐
│  Choose Your Test Pattern                       │
│  Select the pattern that matches what you want  │
│  to simulate                                    │
└─────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  📈          │  │  📊          │  │  ⚡          │
│  Quick       │  │  Normal      │  │  Stress      │
│  Health      │  │  Traffic     │  │  Test        │
│              │  │              │  │              │
│  [Graph]     │  │  [Graph]     │  │  [Graph]     │
│  1-5 users   │  │  Gradual     │  │  Increasing  │
│  ~30 seconds │  │  ramp-up     │  │  steps       │
│              │  │  ~5 minutes  │  │  ~10 minutes │
│  "Quick      │  │  "Simulate   │  │  "Find your  │
│  validation" │  │  daily use" │  │  limits"     │
└──────────────┘  ┌──────────────┘  └──────────────┘
```

### Guided Configuration Screen
```
┌─────────────────────────────────────────────────┐
│  Configure Your Test                             │
│  ← Back to Patterns                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Load Pattern Timeline                           │
│  ─────────────────────────────────────────────  │
│  [Stage 1: 2m → 50 users] [Stage 2: 5m → 50]   │
│  [Stage 3: 1m → 0]                              │
│                                                  │
│  [Visual Graph Preview]                         │
│                                                  │
│  Total Duration: 8 minutes                      │
│  Peak Users: 50                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  API Endpoint                                    │
│  ─────────────────────────────────────────────  │
│  [https://api.example.com/users        ] [Test] │
│                                                  │
│  ✓ Connection successful                        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Test Script (Auto-Generated)                   │
│  ─────────────────────────────────────────────  │
│  [Read-only preview with syntax highlighting]   │
│                                                  │
│  [Edit Safe Sections] [View Full Script]        │
│                                                  │
│  ℹ️ Load stages are managed above.              │
│     You can edit request logic here.            │
└─────────────────────────────────────────────────┘

                    [Run Test] [Save as Template]
```

---

## User Experience Goals

1. **Non-technical users can:**
   - Understand what each test does visually
   - Configure a test without knowing k6 syntax
   - Feel confident about what will happen
   - Get help when needed

2. **Technical users can:**
   - Switch to advanced mode easily
   - Have full control when needed
   - Still benefit from visual timeline
   - Use both modes interchangeably

3. **All users:**
   - See clear progress through the flow
   - Understand what's happening at each step
   - Feel safe to experiment
   - Get clear feedback on success/failure

---

## Implementation Considerations (For Reference)

- Visual graphs: Use a charting library (Chart.js, Recharts, D3.js)
- Timeline builder: Custom React component with drag-and-drop
- Script editor: Monaco Editor (VS Code editor) for advanced mode
- Progressive disclosure: Collapsible sections, modals for advanced options
- Real-time preview: Update graph as user types/changes values
- Validation: Client-side validation with helpful error messages

---

## Next Steps

1. Create visual mockups of pattern selection cards
2. Design the timeline builder interface
3. Prototype the guided flow
4. Test with non-technical users
5. Iterate based on feedback

