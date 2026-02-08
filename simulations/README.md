# Proofi Simulations

This directory contains simulation tools for modeling Proofi's query patterns, system load, and token economics.

## Overview

| Simulation | Purpose | Output |
|------------|---------|--------|
| `query-simulator.js` | Model user earnings and platform revenue | Query volumes, revenue split, user earnings distribution |
| `load-test.js` | Stress test system capacity | Throughput limits, latency metrics, bottleneck identification |
| `tokenomics-sim.js` | Project token economics over time | 12-month forecasts, treasury depletion, break-even analysis |

## Quick Start

```bash
# Run all simulations
npm run simulate:queries
npm run simulate:load
npm run simulate:tokenomics

# Or run directly
node simulations/query-simulator.js
node simulations/load-test.js
node simulations/tokenomics-sim.js
```

## Simulations

### 1. Query Simulator (`query-simulator.js`)

Simulates agents querying user data over a 30-day period.

**Configuration:**
- 1,000 users with varying data availability
- 50 agents with different query volumes (high/medium/low)
- Random query patterns with configurable rates

**Outputs:**
- Total query volume and revenue
- Platform revenue (15% fee)
- User earnings (85% share)
- Earnings distribution (top 10%, median, average)
- Query type breakdown (basic, premium data)

**Use Cases:**
- Estimate platform revenue at different scales
- Understand earnings distribution among users
- Model different pricing strategies

---

### 2. Load Test (`load-test.js`)

Simulates high query volumes to identify system limits.

**Scenarios:**
| Scenario | Queries/Second | Duration |
|----------|----------------|----------|
| Baseline | 10 QPS | 60s |
| Moderate | 100 QPS | 60s |
| High | 500 QPS | 60s |
| Peak | 1,000 QPS | 30s |
| Stress | 5,000 QPS | 10s |

**Metrics Measured:**
- Success rate under load
- Latency (avg, p50, p95, p99)
- Throughput achieved vs target
- Bottleneck identification

**System Constraints Modeled:**
- Cere Network DDC capacity (10,000 TPS)
- ZK proof generation time (150ms)
- Network latency and bandwidth
- Agent processing pipeline

**Use Cases:**
- Plan infrastructure capacity
- Identify scaling priorities
- Set performance SLAs

---

### 3. Tokenomics Simulator (`tokenomics-sim.js`)

Models token economics over 12 months with three growth scenarios.

**Growth Scenarios:**

| Parameter | Conservative | Moderate | Aggressive |
|-----------|-------------|----------|------------|
| User Growth | 10%/month | 25%/month | 50%/month |
| Agent Growth | 8%/month | 20%/month | 40%/month |
| Queries/User | 20/month | 35/month | 50/month |
| Churn Rate | 5% | 3% | 2% |
| Token Price Growth | 2%/month | 5%/month | 10%/month |

**Token Flows Modeled:**
- **Outflows:** Signup bonuses (10 tk), data upload rewards (5 tk), referral bonuses (15 tk), daily active rewards (0.5 tk)
- **Inflows:** Platform fees (15% of queries), agent staking (1,000 tk/agent)
- **Burn:** 5% of platform fees burned

**Outputs:**
- Monthly user/agent projections
- Treasury balance over time
- Break-even month (when revenue > rewards)
- Token price trajectory
- Chart-ready data arrays

**Use Cases:**
- Plan treasury runway
- Adjust reward rates for sustainability
- Investor projections
- Break-even analysis

---

## Output Files

All simulations save JSON reports to `simulations/output/`:

```
output/
├── query-simulation-report.json    # Query sim results
├── load-test-report.json           # Load test results  
└── tokenomics-report.json          # 12-month projections
```

## Customization

Each simulation exports its configuration object. To customize:

```javascript
const { CONFIG } = require('./query-simulator');

// Modify config
CONFIG.users = 5000;
CONFIG.agents = 100;

// Re-run simulation
const { runSimulation } = require('./query-simulator');
runSimulation();
```

## Integration

These simulations are designed for:
- **Planning:** Inform infrastructure and business decisions
- **Investor materials:** Generate projections for pitches
- **Documentation:** Include charts in whitepapers
- **Monitoring:** Compare actual metrics against projections

## Future Enhancements

- [ ] Monte Carlo simulations for uncertainty ranges
- [ ] Integration with live metrics
- [ ] Web dashboard for interactive modeling
- [ ] Sensitivity analysis tools
- [ ] Competitor comparison models
