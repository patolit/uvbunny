# Idle Bunny System

## Overview

The idle bunny system automatically decreases happiness for bunnies that haven't been fed or played with in the last 3 hours. This creates a more realistic simulation where bunnies require regular care to maintain their happiness.

## How It Works

### Cron Function: `checkIdleBunnies`

- **Schedule**: Runs every hour on the hour (cron: `0 * * * *`)
- **Timezone**: UTC
- **Purpose**: Checks all bunnies for idle status and creates idle events

### Idle Detection Logic

A bunny is considered idle if:
- No feed activity in the last 3 hours AND
- No play activity in the last 3 hours

### Idle Events

When a bunny is detected as idle:
1. An `idle` event is created in the `bunnieEvent` collection
2. The event has status `pending` and will be processed by the existing event processing system
3. Event data includes:
   - `reason`: "No activity in last 3 hours"
   - `lastFeed`: Timestamp of last feed (if any)
   - `lastPlay`: Timestamp of last play (if any)
   - `thresholdTime`: The 3-hour threshold timestamp

### Event Processing

The `processBunnyEvent` function has been updated to handle `idle` events:
- Decreases happiness by 1 point
- Uses atomic transactions for consistency
- Updates the event with delta happiness information
- No timestamp updates (unlike feed/play events)

## Configuration

### Idle Threshold
- **Hours**: 3 hours (configurable in `idle-checker.ts`)
- **Happiness Decrease**: 1 point (configurable in `process-bunny-event.ts`)

### Cron Schedule
- **Pattern**: `0 * * * *` (every hour on the hour)
- **Timezone**: UTC
- **Retry Count**: 3
- **Max Instances**: 1 (ensures only one instance runs at a time)

## Event Flow

1. **Hourly Check**: Cron function runs every hour
2. **Idle Detection**: Checks each bunny's last feed/play timestamps
3. **Event Creation**: Creates idle events for idle bunnies
4. **Event Processing**: Existing event processor handles idle events
5. **Happiness Update**: Bunnies lose 1 happiness point
6. **Summary Update**: Summary data is updated via existing delta system

## Benefits

- **Realistic Simulation**: Bunnies require regular care
- **Consistent Architecture**: Uses existing event system
- **Atomic Updates**: All changes are transactional
- **Delta-based Updates**: Efficient summary recalculation
- **Audit Trail**: All idle events are logged and tracked

## Monitoring

The system logs:
- Start of idle checks
- Number of idle bunnies found
- Number of idle events created
- Completion status
- Any errors with retry capability

## Future Enhancements

Potential improvements:
- Configurable idle thresholds per bunny
- Different happiness penalties for different idle durations
- Notifications when bunnies become idle
- Idle streak tracking
- Recovery bonuses for active care after idle periods 
