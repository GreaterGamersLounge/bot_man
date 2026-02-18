# Bot_Man Manual Testing Checklist

This document provides a comprehensive manual testing checklist for verifying the Bot_Man Discord bot functionality after migration to TypeScript.

## Pre-Testing Setup

- [ ] Bot is running (`docker compose up bot`)
- [ ] Bot is online in Discord (shows green status)
- [ ] Database is accessible and populated with test data
- [ ] Test server has required permissions for bot

---

## Slash Commands

### Utility Commands

#### `/ping`
- [x] Command responds with latency information
- [x] Latency values are reasonable (< 1000ms typically)
- [x] Response is ephemeral

#### `/info`
- [x] Shows bot information embed
- [x] Guild count is accurate
- [x] Uptime is displayed
- [x] Version number is correct

#### `/invite`
- [x] Returns valid bot invite URL
- [x] URL includes required permissions
- [x] Response is ephemeral

#### `/me`
- [x] Displays invoking user's username
- [x] Works for users with special characters in name

#### `/random`
- [x] Returns random number with no args (1-100 default)
- [x] `/random max:50` returns number 1-50
- [x] `/random min:10 max:20` returns number 10-20
- [x] Handles edge case where min > max

---

### Admin Commands (Owner Only)

#### `/dm`
- [x] Only bot owner can execute
- [x] Non-owners receive "Only the bot owner can use this command."
- [x] Successfully sends DM to target user
- [x] Handles users with DMs disabled gracefully

#### `/private`
- [x] Sends "Go away..." DM to invoking user
- [x] Handles DMs disabled error

#### `/shutdown`
- [x] Only bot owner can execute
- [x] Non-owners receive rejection message
- [x] Bot shuts down cleanly (manual restart required after test)

---

### Moderation Commands

#### `/clear`
- [x] Requires `ManageMessages` permission
- [x] Deletes specified number of messages (1-100)
- [x] Does not delete messages older than 14 days
- [x] Shows count of deleted messages
- [x] Error handling for invalid counts

#### `/massmove`
- [x] Requires `MoveMembers` permission
- [x] Autocomplete suggests voice channels
- [x] Fuzzy matching finds channels by partial name
- [x] Moves all users from source to destination
- [x] Shows count of moved users
- [x] Handles empty source channel

---

### Quote Commands

#### `/quote get`
- [x] Returns random quote with no args
- [x] `/quote get number:5` returns quote #5
- [x] `/quote get user:@someone` returns quote from that user
- [x] Handles non-existent quotes gracefully
- [x] Shows quoter, quotee, and timestamp

#### `/quote add`
- [x] Adds quote to database
- [x] Returns new quote ID
- [x] Requires quotee and text

#### `/quote remove`
- [x] Only quoter can remove their quote
- [x] Admin can remove any quote
- [x] Handles non-existent quote ID

---

### Reaction Role Commands

#### `/reactionrole add`
- [x] Requires Administrator permission
- [x] Adds reaction to target message
- [x] Creates database entry
- [x] Works with unicode emojis
- [x] Works with server custom emojis
- [x] Rejects emojis from other servers

#### `/reactionrole remove`
- [x] Removes specific emoji-role mapping
- [x] Removes reaction from message
- [x] Handles non-existent mapping

#### `/reactionrole clear`
- [x] Removes all reaction roles from message
- [x] Removes all reactions
- [x] Shows confirmation embed

---

### Voice Commands

#### `/jumpchannel create`
- [x] Requires Administrator permission
- [x] Creates NEW voice channel when `name` provided
- [x] Designates EXISTING channel when `channel` provided
- [x] Rejects if both `name` and `channel` provided
- [x] Rejects if neither `name` nor `channel` provided
- [x] Rejects if channel is already a jump channel
- [x] Records in database

#### `/jumpchannel delete`
- [x] Deletes jump channel
- [x] Updates database record
- [x] Rejects non-jump channels

#### `/jumpchannel list`
- [x] Shows all active jump channels
- [x] Handles server with no jump channels

---

## Event Handlers

### Guild Events
- [x] **guildCreate**: Bot joins server → creates server record
- [x] **guildMemberAdd**: New member joins → invite tracking works

### Voice Events
- [x] **voiceStateUpdate**: Join jump channel → creates temp channel
- [x] **voiceStateUpdate**: Leave empty temp channel → channel deleted

### Reaction Events
- [x] **messageReactionAdd**: Add reaction → role assigned
- [x] **messageReactionRemove**: Remove reaction → role removed
- [x] **messageReactionAdd**: Quote reaction (📖) → quote added

### Invite Events
- [x] **inviteCreate**: New invite → tracked in database
- [x] **inviteDelete**: Invite deleted → tracked

---

## Error Handling

- [x] Invalid slash command options show helpful error
- [x] Permission denied shows clear message
- [x] Database errors don't crash bot
- [x] Rate limiting is handled gracefully
- [x] Bot handles reconnection after disconnect

---

## Performance Checks

- [x] Commands respond within 3 seconds
- [x] Bot memory usage is reasonable (< 500MB)
- [x] No memory leaks over extended running
- [x] Handles multiple simultaneous command invocations

---

## Database Integrity

- [x] Server records created correctly
- [x] Discord user records synced
- [x] Invite tracking accurate
- [x] Quote data persisted
- [x] Reaction role mappings stored
- [x] Temp voice channel records managed

---

## Notes

**Test Environment:**
- Discord Server ID: _______________
- Bot User ID: _______________
- Test Date: _______________
- Tester: _______________

**Issues Found:**
1.
2.
3.

**Sign-off:**
- [x] All critical features tested
- [x] No blocking issues found
- [x] Ready for production deployment
