# Proofi Wallet Integration

Connect Clawdbot to a user's Proofi wallet for credential access.

## Quick Reference

```bash
# Connect to wallet (opens browser for approval)
proofi connect --name "Clawdbot" --scopes "age,calendar"

# Check connection status
proofi status

# Request age proof (ZKP - doesn't reveal actual age)
proofi proof age --predicate ">=18"

# Request identity proof
proofi proof identity

# Disconnect
proofi disconnect
```

## Flow

1. **Connect**: `proofi connect` opens browser, user approves in Proofi extension
2. **Session**: Stored in `~/.proofi/session.json`, valid 24h
3. **Proof**: Request selective disclosure proofs within authorized scopes
4. **Revoke**: User can revoke anytime in extension, or run `proofi disconnect`

## Use Cases

| Task | Command |
|------|---------|
| Verify user is 18+ | `proofi proof age --predicate ">=18"` |
| Get calendar access | `proofi proof calendar` |
| Check identity | `proofi proof identity` |

## Key Points

- **User controls access**: Every connection requires explicit approval
- **Selective disclosure**: Prove facts ("18+") without revealing data (birthdate)
- **Scoped**: Agent only sees what user permits
- **Revocable**: User can revoke anytime

## Session File

```json
// ~/.proofi/session.json
{
  "agentId": "clawdbot-xxx",
  "name": "Clawdbot",
  "scopes": ["age", "calendar"],
  "address": "5xxx...",
  "expiresAt": 1234567890000
}
```

## Error Handling

- **Not connected**: Run `proofi connect` first
- **Scope denied**: User didn't authorize that scope
- **Session expired**: Reconnect with `proofi connect`
