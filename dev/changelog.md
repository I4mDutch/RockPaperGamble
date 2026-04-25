# Changelog

## [2.2.0-2.2.0.9 (SH3FQR)] - 2026-04-25

### Added
- **Best-of-5 Series:** Matches now follow a Best-of-5 format (first to 3 wins) with persistent series score tracking.
- **Live Event Feed:** A real-time sidebar feed in the game screen that logs challenges, wagers, spectator bets, and coin gifts.
- **Improved Ready System:** Players can now click their own player card in the lobby to toggle their ready status.
- **Guest Logout:** Added a "Switch to Discord" option in the lobby and profile menu for guest users to clear their session and sign in with a permanent account.

### Fixed
- **WebSocket Stability:** Implemented an "Immediate Handshake" on the server to prevent WebSocket closures during connection.
- **Handshake Resilience:** Bulletproofed display name and initials processing to handle emojis and special characters without crashing.
- **Stalled Betting Timer:** Fixed a bug where the countdown would stop during the betting phase; it now advances automatically.
- **Weapons Desync:** Resolved an issue where player choices weren't being recorded by the server, resulting in forced ties.
- **Settings Synchronization:** Added an `isEditing` lock to the settings modal to prevent server updates from overwriting user input while typing.
- **Turn Order Reordering:** Fixed server-side validation that prevented hosts from successfully reordering players in the lobby.
- **Starting Money Bug:** Fixed an issue where custom starting money settings only applied to new players instead of everyone in the room.
- **Turn Order Advancement:** Corrected logic to ensure the "Challenger" role passes to the next eligible player after a series match ends.

### Changed
- **UI Cleanup:** Removed redundant "Potential Payout" and "Awaiting results" text from the betting phase for a cleaner look.
- **Reorder Controls:** Moved reorder arrows to the right of player cards and increased their size for better visibility and usability.
- **Prize Pool Logic:** Refined betting outcomes so winners take the full pool and correct spectator bets double their money.
