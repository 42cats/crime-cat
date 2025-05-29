# Music Player State Machine Scenarios

## Play Mode Constants
- `REPEATONE` = 0 (🔂 한곡반복)
- `NORMAL` = 1 (🔁 순차재생)  
- `ONCE` = 2 (1️⃣ 한번재생)
- `SHUFFLE` = 3 (🔀 셔플재생)

## Player States
- `PLAYING` - Currently playing audio
- `PAUSED` - Playback paused
- `STOPPED` - No active playback
- `TRANSITIONING` - Changing tracks (locked state)

## Complete Scenario Matrix

### NORMAL Mode (순차재생) Scenarios

| Current State | Button | Expected Behavior | New Index | New State |
|---------------|--------|-------------------|-----------|-----------|
| PLAYING | next | Stop current → Play next track | (current + 1) % length | TRANSITIONING → PLAYING |
| PLAYING | prev | Stop current → Play previous track | (current - 1 + length) % length | TRANSITIONING → PLAYING |
| PLAYING | playpause | Pause current track | unchanged | PAUSED |
| PLAYING | stop | Stop playback | unchanged | STOPPED |
| PAUSED | next | Play next track | (current + 1) % length | TRANSITIONING → PLAYING |
| PAUSED | prev | Play previous track | (current - 1 + length) % length | TRANSITIONING → PLAYING |
| PAUSED | playpause | Resume current track | unchanged | PLAYING |
| PAUSED | stop | Stop playback | unchanged | STOPPED |
| STOPPED | next | Play next track | (current + 1) % length | TRANSITIONING → PLAYING |
| STOPPED | prev | Play previous track | (current - 1 + length) % length | TRANSITIONING → PLAYING |
| STOPPED | playpause | Play current track | unchanged | TRANSITIONING → PLAYING |
| STOPPED | stop | No action | unchanged | STOPPED |
| PLAYING | track_ends | Auto-advance to next | (current + 1) % length | TRANSITIONING → PLAYING |

### REPEATONE Mode (한곡반복) Scenarios

| Current State | Button | Expected Behavior | New Index | New State |
|---------------|--------|-------------------|-----------|-----------|
| PLAYING | next | Stop current → Play next track | (current + 1) % length | TRANSITIONING → PLAYING |
| PLAYING | prev | Stop current → Play previous track | (current - 1 + length) % length | TRANSITIONING → PLAYING |
| PLAYING | playpause | Pause current track | unchanged | PAUSED |
| PLAYING | stop | Stop playback | unchanged | STOPPED |
| PAUSED | next | Play next track | (current + 1) % length | TRANSITIONING → PLAYING |
| PAUSED | prev | Play previous track | (current - 1 + length) % length | TRANSITIONING → PLAYING |
| PAUSED | playpause | Resume current track | unchanged | PLAYING |
| PAUSED | stop | Stop playback | unchanged | STOPPED |
| STOPPED | next | Play next track | (current + 1) % length | TRANSITIONING → PLAYING |
| STOPPED | prev | Play previous track | (current - 1 + length) % length | TRANSITIONING → PLAYING |
| STOPPED | playpause | Play current track | unchanged | TRANSITIONING → PLAYING |
| STOPPED | stop | No action | unchanged | STOPPED |
| PLAYING | track_ends | **Repeat same track** | **unchanged** | TRANSITIONING → PLAYING |

### ONCE Mode (한번재생) Scenarios

| Current State | Button | Expected Behavior | New Index | New State |
|---------------|--------|-------------------|-----------|-----------|
| PLAYING | next | Stop current → Play next track | (current + 1) % length | TRANSITIONING → PLAYING |
| PLAYING | prev | Stop current → Play previous track | (current - 1 + length) % length | TRANSITIONING → PLAYING |
| PLAYING | playpause | Pause current track | unchanged | PAUSED |
| PLAYING | stop | Stop playback | unchanged | STOPPED |
| PAUSED | next | Play next track | (current + 1) % length | TRANSITIONING → PLAYING |
| PAUSED | prev | Play previous track | (current - 1 + length) % length | TRANSITIONING → PLAYING |
| PAUSED | playpause | Resume current track | unchanged | PLAYING |
| PAUSED | stop | Stop playback | unchanged | STOPPED |
| STOPPED | next | Play next track | (current + 1) % length | TRANSITIONING → PLAYING |
| STOPPED | prev | Play previous track | (current - 1 + length) % length | TRANSITIONING → PLAYING |
| STOPPED | playpause | Play current track | unchanged | TRANSITIONING → PLAYING |
| STOPPED | stop | No action | unchanged | STOPPED |
| PLAYING | track_ends | **Stop (no auto-advance)** | **unchanged** | **STOPPED** |

### SHUFFLE Mode (셔플재생) Scenarios

| Current State | Button | Expected Behavior | New Index | New State |
|---------------|--------|-------------------|-----------|-----------|
| PLAYING | next | Stop current → Play next shuffled track | shuffled[(current + 1) % length] | TRANSITIONING → PLAYING |
| PLAYING | prev | Stop current → Play previous shuffled track | shuffled[(current - 1 + length) % length] | TRANSITIONING → PLAYING |
| PLAYING | playpause | Pause current track | unchanged | PAUSED |
| PLAYING | stop | Stop playback | unchanged | STOPPED |
| PAUSED | next | Play next shuffled track | shuffled[(current + 1) % length] | TRANSITIONING → PLAYING |
| PAUSED | prev | Play previous shuffled track | shuffled[(current - 1 + length) % length] | TRANSITIONING → PLAYING |
| PAUSED | playpause | Resume current track | unchanged | PLAYING |
| PAUSED | stop | Stop playback | unchanged | STOPPED |
| STOPPED | next | Play next shuffled track | shuffled[(current + 1) % length] | TRANSITIONING → PLAYING |
| STOPPED | prev | Play previous shuffled track | shuffled[(current - 1 + length) % length] | TRANSITIONING → PLAYING |
| STOPPED | playpause | Play current track | unchanged | TRANSITIONING → PLAYING |
| STOPPED | stop | No action | unchanged | STOPPED |
| PLAYING | track_ends | Auto-advance to next shuffled | shuffled[(current + 1) % length] | TRANSITIONING → PLAYING |

## Key Behavioral Rules

### Manual Actions (Button Clicks)
1. **Always interrupt current playback** for next/prev buttons
2. **Manual actions override auto-advance logic**
3. **Index changes are immediate** when user clicks next/prev
4. **State transitions are atomic** (no race conditions)

### Auto-Advance (Track Ends Naturally)
1. **Only triggers if not a manual action**
2. **Respects play mode settings**:
   - NORMAL/SHUFFLE: advance to next
   - REPEATONE: repeat current
   - ONCE: stop playback
3. **No auto-advance during TRANSITIONING state**

### State Locks
1. **TRANSITIONING state prevents concurrent operations**
2. **Operations queue if lock is held**
3. **Atomic operations ensure consistency**

### Edge Cases Handled
1. **Empty playlist**: All operations return safely
2. **Single track**: Prev/next wrap around correctly
3. **Mode changes**: Shuffle regenerates indices
4. **Rapid button clicks**: Queued and processed sequentially
5. **Player destruction**: All pending operations cancelled

## Implementation Benefits

1. **No Race Conditions**: Atomic operations with locking
2. **Predictable Behavior**: Clear state transitions
3. **Consistent Index Management**: Centralized in state machine
4. **Clean Event Handling**: Separation of manual vs auto actions
5. **Robust Error Handling**: Graceful degradation on failures