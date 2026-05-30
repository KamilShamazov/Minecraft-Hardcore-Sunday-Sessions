# Security Specification: Minecraft Mineday Scheduler

## 1. Data Invariants
- A **Lobby** must have a non-empty `id`, a `title` (at least 3 and at most 64 chars), a `targetDuration` between 1.0 and 12.0 hours, and a valid `players` map.
- Anyone can create or view a lobby if they have the specific room ID (uniquely generated 6-character clean codes like `#MND-12`). This prevents list enumeration and ensures friendly ad-hoc access.
- Any participant can write to their own player record inside the lobby's `players` map, but they cannot delete or alter other players' schedules or metadata.

## 2. The "Dirty Dozen" Adversarial Payloads
Below are 12 payloads mapped to test malicious operations:

1. **Self-Appointed Overlord (Identity Spoofing)**: Attempting to create a lobby claiming an future createdAt timestamp.
2. **Infinite Duration (State Boundary Break)**: Setting `targetDuration` to 999.0 hours to trigger exhaustion attacks.
3. **Empty Lobby Title (Value Poisoning)**: Creating a lobby with `title` as `""`.
4. **Giant Room Code (Resource Poisoning)**: Creating a lobby doc with an ID that is 200KB characters long.
5. **Ghost Field Injection (Shadow Update)**: Updating a lobby to insert `isVerified: true` at root level.
6. **Evicting Another Friend (Privilege Escalation)**: Modifying `/lobbies/room12` to completely delete a friend's player entry from `players` object without their authorization.
7. **Tampering with Friend's Color**: Changing another friend's UI avatar accent hex color to an invalid tag.
8. **Malicious Character String**: Injecting a 2MB base64 image as a player name.
9. **Negative targetDuration**: Creating a lobby with `targetDuration: -5.0`.
10. **Null fields in player intervals**: Adding a player with `intervals: [{start: null, end: 12}]` or negative values.
11. **Malicious unicode room ID**: Creating document IDs with symbols that can throw index engines.
12. **Bypassing validation via update**: Sending a lobby update that omits the `createdAt` timestamp.

## 3. Test Runner Specification (`firestore.rules.test.ts`)
```typescript
import { assertFails, assertSucceeds, initializeTestEnv } from "@firebase/rules-unit-testing";

describe("Lobbies Collection Security Rules", () => {
  it("should block empty lobby creations (Pillar 2: Validation Blueprints)", async () => {
    // Tests that incorrect sizes and blank keys fail validation
  });
});
```
