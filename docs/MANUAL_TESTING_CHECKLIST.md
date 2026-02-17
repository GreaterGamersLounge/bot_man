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
- [ ] Command responds with latency information
- [ ] Latency values are reasonable (< 1000ms typically)
- [ ] Response is ephemeral

#### `/info`
- [ ] Shows bot information embed
- [ ] Guild count is accurate
- [ ] Uptime is displayed
- [ ] Version number is correct

#### `/invite`
- [ ] Returns valid bot invite URL
- [ ] URL includes required permissions
- [ ] Response is ephemeral

#### `/me`
- [ ] Displays invoking user's username
- [ ] Works for users with special characters in name

#### `/random`
- [ ] Returns random number with no args (1-100 default)
- [ ] `/random max:50` returns number 1-50
- [ ] `/random min:10 max:20` returns number 10-20
- [ ] Handles edge case where min > max

---

### Admin Commands (Owner Only)

#### `/dm`
- [ ] Only bot owner can execute
- [ ] Non-owners receive "Only the bot owner can use this command."
- [ ] Successfully sends DM to target user
- [ ] Handles users with DMs disabled gracefully

#### `/private`
- [ ] Sends "Go away..." DM to invoking user
- [ ] Handles DMs disabled error

#### `/shutdown`
- [ ] Only bot owner can execute
- [ ] Non-owners receive rejection message
- [ ] Bot shuts down cleanly (manual restart required after test)

---

### Moderation Commands

#### `/clear`
- [ ] Requires `ManageMessages` permission
- [ ] Deletes specified number of messages (1-100)
- [ ] Does not delete messages older than 14 days
- [ ] Shows count of deleted messages
- [ ] Error handling for invalid counts

#### `/massmove`
- [ ] Requires `MoveMembers` permission
- [ ] Autocomplete suggests voice channels
- [ ] Fuzzy matching finds channels by partial name
- [ ] Moves all users from source to destination
- [ ] Shows count of moved users
- [ ] Handles empty source channel

#### `/set`
- [ ] `/set prefix` - Changes server command prefix
- [ ] `/set invitechannel` - Sets invite tracking channel
- [ ] Only admins can use
- [ ] Changes persist in database

---

### Quote Commands

#### `/quote get`
- [ ] Returns random quote with no args
- [ ] `/quote get number:5` returns quote #5
- [ ] `/quote get user:@someone` returns quote from that user
- [ ] Handles non-existent quotes gracefully
- [ ] Shows quoter, quotee, and timestamp

#### `/quote add`
- [ ] Adds quote to database
- [ ] Returns new quote ID
- [ ] Requires quotee and text

#### `/quote remove`
- [ ] Only quoter can remove their quote
- [ ] Admin can remove any quote
- [ ] Handles non-existent quote ID

---

### Reaction Role Commands

#### `/reactionrole add`
- [ ] Requires Administrator permission
- [ ] Adds reaction to target message
- [ ] Creates database entry
- [ ] Works with unicode emojis
- [ ] Works with server custom emojis
- [ ] Rejects emojis from other servers

#### `/reactionrole remove`
- [ ] Removes specific emoji-role mapping
- [ ] Removes reaction from message
- [ ] Handles non-existent mapping

#### `/reactionrole clear`
- [ ] Removes all reaction roles from message
- [ ] Removes all reactions
- [ ] Shows confirmation embed

---

### Voice Commands

#### `/jumpchannel create`
- [ ] Requires Administrator permission
- [ ] Creates voice channel with given name
- [ ] Records in database

#### `/jumpchannel delete`
- [ ] Deletes jump channel
- [ ] Updates database record
- [ ] Rejects non-jump channels

#### `/jumpchannel list`
- [ ] Shows all active jump channels
- [ ] Handles server with no jump channels

---

## Prefix Commands (!commands)

### Basic Commands
- [ ] `!ping` - Works like slash version
- [ ] `!info` - Shows bot info
- [ ] `!random` / `!random 50` / `!random 10 50`
- [ ] `!me` - Shows username
- [ ] `!pm` / `!private` - Sends DM

### Quote Commands
- [ ] `!quote` - Random quote
- [ ] `!quote 5` - Quote by ID
- [ ] `!quote @user` - Quote by user
- [ ] `!addquote @quotee "quote text"`
- [ ] `!removequote 5`

### Moderation Commands
- [ ] `!clear 10` - Delete messages
- [ ] `!massmove "Source" "Dest"`
- [ ] `!set prefix ?` - Change prefix
- [ ] `!set invitechannel #channel`

### Reaction Role Commands
- [ ] `!addreactionrole <message_id> :emoji: <role_id>`
- [ ] `!removereactionrole <message_id> :emoji:`
- [ ] `!removeallreactionroles <message_id>`

### Voice Commands
- [ ] `!createjumpchannel "Channel Name"`
- [ ] `!deletejumpchannel <channel_id>`
- [ ] `!listjumpchannels`

### Admin Commands (Owner Only)
- [ ] `!dm @user message` - Send DM
- [ ] `!shutdown` - Stop bot

---

## Event Handlers

### Guild Events
- [ ] **guildCreate**: Bot joins server → creates server record
- [ ] **guildMemberAdd**: New member joins → invite tracking works

### Voice Events
- [ ] **voiceStateUpdate**: Join jump channel → creates temp channel
- [ ] **voiceStateUpdate**: Leave empty temp channel → channel deleted

### Reaction Events
- [ ] **messageReactionAdd**: Add reaction → role assigned
- [ ] **messageReactionRemove**: Remove reaction → role removed
- [ ] **messageReactionAdd**: Quote reaction (📝) → quote added

### Invite Events
- [ ] **inviteCreate**: New invite → tracked in database
- [ ] **inviteDelete**: Invite deleted → tracked

---

## Error Handling

- [ ] Invalid slash command options show helpful error
- [ ] Permission denied shows clear message
- [ ] Database errors don't crash bot
- [ ] Rate limiting is handled gracefully
- [ ] Bot handles reconnection after disconnect

---

## Performance Checks

- [ ] Commands respond within 3 seconds
- [ ] Bot memory usage is reasonable (< 500MB)
- [ ] No memory leaks over extended running
- [ ] Handles multiple simultaneous command invocations

---

## Database Integrity

- [ ] Server records created correctly
- [ ] Discord user records synced
- [ ] Invite tracking accurate
- [ ] Quote data persisted
- [ ] Reaction role mappings stored
- [ ] Temp voice channel records managed

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
- [ ] All critical features tested
- [ ] No blocking issues found
- [ ] Ready for production deployment
