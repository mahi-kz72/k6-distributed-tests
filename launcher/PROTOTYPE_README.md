# Prototype - Flow Validation

This is a **disposable prototype** for stakeholder validation. It focuses on navigation flow and visual understanding, not production code.

## Access the Prototype

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   ```
   http://localhost:3001/prototype
   ```

## What's Included

- ✅ Pattern selection screen
- ✅ Phase 1: Load pattern configuration
- ✅ Phase 2: API endpoint configuration  
- ✅ Phase 3: Script review
- ✅ Results page

## Features

- **Simple navigation** between all screens
- **Basic form interactions** with localStorage persistence
- **Mock data** - no real API calls
- **Visual placeholders** for graphs and complex UI
- **Easy Mode default** - Advanced options are collapsed

## What's NOT Included

- ❌ Real k6 script generation
- ❌ Actual API connection testing
- ❌ Real-time graph updates
- ❌ Complex state management
- ❌ Production-ready code

## Testing the Flow

1. **Select a pattern** from the home page
2. **Configure load pattern** - add/remove stages, use presets
3. **Enter API URL** - test connection (mocked)
4. **Review script** - see auto-generated script
5. **Run test** - see results page

## Notes

- Data persists in localStorage between pages
- All interactions are mocked/simulated
- This is for **validation only**, not production use
- Code is intentionally simple and disposable

