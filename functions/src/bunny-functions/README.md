# Bunny Functions

This directory contains all Firebase Cloud Functions related to bunny management and events.

## Structure

```
bunny-functions/
├── index.ts              # Main export file
├── types.ts              # Shared TypeScript types
├── utils.ts              # Shared utility functions
├── process-bunny-event.ts # Bunny event processing function
└── README.md             # This file
```

## Functions

### `processBunnyEvent`
- **Trigger**: Firestore document creation on `bunnieEvent/{eventId}`
- **Purpose**: Processes bunny events (feed, play) and updates happiness scores
- **Features**:
  - Handles feeding events (carrot, lettuce)
  - Handles play events with partner bunnies
  - Manages playmate relationships
  - Applies bonus points for existing playmates
  - Updates event status (pending → processing → finished/error)

## Types

### `EventStatus`
- `"pending"` - Event created, waiting to be processed
- `"processing"` - Event is currently being processed
- `"finished"` - Event processed successfully
- `"error"` - Event processing failed

### `BunnyEvent`
Interface for bunny event documents in Firestore.

### `Bunny`
Interface for bunny documents in Firestore.

### `Configuration`
Interface for configuration documents in Firestore.

## Utilities

### Database Operations
- `getBunny(bunnyId)` - Get bunny by ID
- `getConfiguration()` - Get base configuration
- `updateBunnyHappiness(bunnyId, newHappiness)` - Update bunny happiness
- `updateBunnyPlayMates(bunnyId, playMates)` - Update bunny playmates

### Helper Functions
- `calculateNewHappiness(current, increase)` - Calculate new happiness with bounds
- `arePlayMates(bunny, partnerId)` - Check if bunnies are playmates

## Future Enhancements

### Bunny Colors Configuration
**TODO**: Move bunny colors from frontend to backend configuration
- Add `bunnyColors` array to the configuration collection
- Structure: `{ name: string, hex: string, isActive: boolean }`
- Allow admin to add/remove colors via configuration page
- Support custom color hex codes with validation
- Add color constraints (max colors, reserved names)
- Update frontend to fetch colors from configuration instead of hardcoded array

### Example Configuration Structure:
```typescript
interface Configuration {
  meals: { carrot: number; lettuce: number };
  activities: { petting: number; grooming: number };
  playScore: number;
  bunnyColors: Array<{
    name: string;
    hex: string;
    isActive: boolean;
    createdAt: Timestamp;
  }>;
}
```

## Adding New Functions

1. Create a new file in this directory (e.g., `new-function.ts`)
2. Import required dependencies and utilities
3. Export your function
4. Add the export to `index.ts`
5. Import and export in the main `../index.ts`

### Example

```typescript
// new-function.ts
import { onCall } from "firebase-functions/v2/https";
import { getBunny } from "./utils";

export const myNewFunction = onCall(async (request) => {
  const bunnyId = request.data.bunnyId;
  const bunny = await getBunny(bunnyId);
  // ... function logic
});

// index.ts
export { myNewFunction } from './new-function';

// ../index.ts
import { myNewFunction } from './bunny-functions';
export { myNewFunction };
```

## Best Practices

1. **Use utility functions** for common database operations
2. **Use shared types** for consistency
3. **Handle errors properly** with try-catch blocks
4. **Update event status** for tracking
5. **Add JSDoc comments** for complex functions
6. **Test functions locally** before deployment

## Deployment

Functions are automatically deployed when you run:
```bash
firebase deploy --only functions
```

Or deploy specific functions:
```bash
firebase deploy --only functions:processBunnyEvent
``` 
