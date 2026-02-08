# Next Task: Build Proofi SDK + Query API

## Context
We're building the "data economy" where users earn CERE tokens when AI agents query their data. The frontend apps (earn.html, agent-demo.html) are ready. Now we need the backend infrastructure.

## Task 1: Proofi JavaScript SDK

Create `/packages/sdk/` with a publishable npm package:

```javascript
// Usage example
import { Proofi } from '@proofi/sdk';

const proofi = new Proofi({
  agentId: 'my-health-agent',
  apiKey: 'pk_...',
  network: 'mainnet' // or 'testnet'
});

// Query user data (pays CERE automatically)
const result = await proofi.query({
  userId: '0x1234...',
  scope: 'health.allergies',
  maxPrice: 0.10 // max CERE willing to pay
});

// Subscribe to user (monthly payment)
await proofi.subscribe({
  userId: '0x1234...',
  tier: 'basic', // 10 CERE/month
  scopes: ['health.*', 'preferences.*']
});

// Verify a credential
const valid = await proofi.verify(credentialCid);

// Sign a message (for agent identity)
const signature = await proofi.sign(message);
```

### SDK Requirements:
- TypeScript with full types
- Works in Node.js and browser
- Handles CERE payments automatically
- Caches user permissions
- Retry logic for failed queries
- Event emitters for real-time updates

## Task 2: Query API Backend

Create `/packages/api/` or extend existing backend:

### Endpoints:

```
POST /api/v1/query
Authorization: Bearer <agent_api_key>
{
  "userId": "0x...",
  "scope": "health.allergies",
  "maxPrice": 0.10
}
→ Returns: { data: {...}, cost: 0.08, transactionId: "..." }

GET /api/v1/user/:userId/permissions
→ Returns: { scopes: [...], prices: {...} }

POST /api/v1/subscribe
{ "userId": "...", "tier": "basic" }
→ Creates monthly subscription

GET /api/v1/agent/balance
→ Returns agent's CERE balance

GET /api/v1/agent/usage
→ Returns query history and costs
```

### Query Flow:
1. Agent calls /query with scope and maxPrice
2. API checks: Does user allow this scope? Is maxPrice >= user's price?
3. API checks: Does agent have sufficient CERE balance?
4. If yes: Decrypt data, return to agent, log payment
5. If no: Return error with reason

### Payment Logic:
- Agents pre-fund a balance (deposit CERE)
- Each query deducts from balance
- 90% goes to user, 10% platform fee
- Users can withdraw anytime

## Task 3: Chrome Extension Update

Update `/extension/` to support:
- Permission management UI (which agents can access what)
- Price settings per data category
- Real-time approval popups when agent queries
- Earnings dashboard in extension popup

## File Structure:
```
/packages/
  /sdk/
    package.json
    src/
      index.ts
      client.ts
      types.ts
      payments.ts
    README.md
  /api/
    package.json
    src/
      server.ts
      routes/
        query.ts
        subscribe.ts
        agent.ts
      middleware/
        auth.ts
        rateLimit.ts
      services/
        payment.ts
        encryption.ts
```

## Priority:
1. SDK with mock backend (so agent devs can start integrating)
2. Real API backend
3. Chrome extension permissions

Start with the SDK - that's what agent developers need to start building.
