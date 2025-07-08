# Summary Calculation Functions

This document describes the Firebase Cloud Functions that maintain real-time summary statistics for the bunny management system.

## Overview

The summary functions automatically calculate and maintain:
- Total number of bunnies in the system
- Total happiness sum (for efficient average calculations)
- Average happiness across all bunnies
- Last update timestamp
- Last event ID that triggered an update

## Functions

### 1. `calculateSummary`
**Trigger**: `onDocumentWritten` on `bunnies/{bunnyId}`
**Purpose**: Handles bunny creation and deletion events

**Behavior**:
- When a new bunny is created: adds the bunny's happiness to total and recalculates average
- When a bunny is deleted: subtracts the bunny's happiness from total and recalculates average
- **Auto-initialization**: If summary data doesn't exist, automatically creates it by scanning all bunnies
- Uses transactions to ensure data consistency

### 2. `updateSummaryOnEventCompletion`
**Trigger**: `onDocumentUpdated` on `bunnyEvents/{eventId}`
**Purpose**: Handles bunny event completion (happiness changes)

**Behavior**:
- Only processes when event status changes to "finished"
- Gets the bunny's previous happiness value
- Calculates the happiness difference
- Updates total happiness and recalculates average
- **Auto-initialization**: If summary data doesn't exist, automatically creates it by scanning all bunnies
- Uses transactions to ensure data consistency

### 3. `recalculateSummary`
**Trigger**: HTTP callable function
**Purpose**: Manual recalculation of summary data (admin use)

**Behavior**:
- Scans all bunnies in the system
- Recalculates total count, total happiness, and average
- Useful for fixing data inconsistencies or forcing a complete recalculation

## Data Structure

The summary data is stored in `summaryData/current` with the following structure:

```typescript
interface SummaryData {
  totalBunnies: number;        // Total number of bunnies
  totalHappiness: number;      // Sum of all happiness values
  averageHappiness: number;    // Calculated average (rounded to 1 decimal)
  lastUpdated: Timestamp;      // Last update timestamp
  lastEventId?: string;        // ID of last event that triggered update
}
```

## Deployment

1. Deploy the functions:
   ```bash
   firebase deploy --only functions
   ```

2. The functions will automatically start working when:
   - New bunnies are created
   - Bunnies are deleted
   - Bunny events are completed

## Automatic Initialization

**No manual setup required!** The functions automatically handle initialization:

- When the first bunny is created, summary data is automatically initialized
- When the first event completes, summary data is automatically initialized
- If summary data is missing for any reason, it's automatically recreated on the next trigger

This means you can deploy the functions and they'll work immediately, even with existing bunnies.

## Manual Recalculation (Optional)

If you need to force a complete recalculation (e.g., for data consistency checks):

```typescript
// From your Angular app (requires authentication)
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const recalculateSummary = httpsCallable(functions, 'recalculateSummary');

recalculateSummary().then((result) => {
  console.log('Summary recalculated:', result.data);
});
```

## Error Handling

- Functions use transactions to prevent data inconsistencies
- If a bunny is not found during event processing, the summary update is skipped
- All errors are logged to Firebase Functions logs
- Functions are idempotent - safe to retry if they fail
- Automatic initialization ensures summary data always exists

## Performance Considerations

- Functions use atomic transactions to ensure data consistency
- Summary updates are incremental (only calculate differences)
- Total happiness is stored to avoid recalculating from all bunnies
- Functions are triggered only on relevant events (not on every bunny update)
- Initialization only happens once when summary data is missing

## Monitoring

Monitor function execution in the Firebase Console:
1. Go to Functions > Logs
2. Filter by function name (e.g., "calculateSummary")
3. Check for errors or performance issues
4. Look for "initializing" messages to confirm auto-initialization

## Troubleshooting

**Issue**: Summary data is incorrect
**Solution**: Call `recalculateSummary` function to rebuild from scratch

**Issue**: Functions not triggering
**Solution**: Check Firebase Functions logs for errors and ensure proper deployment

**Issue**: Average happiness not updating
**Solution**: Verify that bunny events are completing with "finished" status and have `newHappiness` values

**Issue**: Summary data not being created
**Solution**: Check logs for "initializing" messages. If not present, manually trigger `recalculateSummary` 
