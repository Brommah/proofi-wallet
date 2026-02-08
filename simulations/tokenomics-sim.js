#!/usr/bin/env node
/**
 * Tokenomics Simulator for Proofi
 * Models token economics over time with multiple growth scenarios
 * Outputs 12-month projections with break-even analysis
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Initial conditions
  initial: {
    treasury: 10_000_000,        // Initial treasury in tokens
    tokenPrice: 0.10,            // Initial token price in USD
    platformUsers: 100,          // Starting users
    activeAgents: 5              // Starting agents
  },
  
  // Reward structure
  rewards: {
    signupBonus: 10,             // Tokens for new user signup
    dataUploadReward: 5,         // Tokens for uploading data
    referralBonus: 15,           // Tokens for referral
    dailyActiveBonus: 0.5,       // Daily bonus for active users
    agentStakeRequired: 1000     // Tokens required to become agent
  },
  
  // Revenue model
  revenue: {
    queryPriceTokens: 0.10,      // Price per query in tokens
    platformFeePercent: 15,      // Platform fee percentage
    tokenBurnPercent: 5          // Percentage of fees burned
  },
  
  // Growth scenarios
  scenarios: {
    conservative: {
      name: 'Conservative',
      monthlyUserGrowthRate: 0.10,    // 10% monthly growth
      monthlyAgentGrowthRate: 0.08,   // 8% monthly growth
      queriesPerUserPerMonth: 20,     // Average queries
      churnRate: 0.05,                // 5% monthly churn
      tokenPriceGrowth: 0.02          // 2% monthly price increase
    },
    moderate: {
      name: 'Moderate',
      monthlyUserGrowthRate: 0.25,    // 25% monthly growth
      monthlyAgentGrowthRate: 0.20,   // 20% monthly growth
      queriesPerUserPerMonth: 35,     // Average queries
      churnRate: 0.03,                // 3% monthly churn
      tokenPriceGrowth: 0.05          // 5% monthly price increase
    },
    aggressive: {
      name: 'Aggressive',
      monthlyUserGrowthRate: 0.50,    // 50% monthly growth
      monthlyAgentGrowthRate: 0.40,   // 40% monthly growth
      queriesPerUserPerMonth: 50,     // Average queries
      churnRate: 0.02,                // 2% monthly churn
      tokenPriceGrowth: 0.10          // 10% monthly price increase
    }
  },
  
  simulationMonths: 12
};

function simulateMonth(state, scenario, monthNumber) {
  const month = {
    month: monthNumber,
    startingState: { ...state }
  };
  
  // Calculate user growth
  const newUsers = Math.floor(state.users * scenario.monthlyUserGrowthRate);
  const churnedUsers = Math.floor(state.users * scenario.churnRate);
  state.users = state.users + newUsers - churnedUsers;
  
  // Calculate agent growth
  const newAgents = Math.floor(state.agents * scenario.monthlyAgentGrowthRate);
  state.agents = state.agents + newAgents;
  
  // Calculate rewards distributed
  const signupRewards = newUsers * CONFIG.rewards.signupBonus;
  const dataUploadRewards = newUsers * CONFIG.rewards.dataUploadReward * 0.7; // 70% upload data
  const referralRewards = newUsers * CONFIG.rewards.referralBonus * 0.3; // 30% from referrals
  const dailyActiveRewards = state.users * CONFIG.rewards.dailyActiveBonus * 30 * 0.4; // 40% daily active
  
  const totalRewardsDistributed = signupRewards + dataUploadRewards + referralRewards + dailyActiveRewards;
  state.treasury -= totalRewardsDistributed;
  
  // Calculate query volume and revenue
  const totalQueries = state.users * scenario.queriesPerUserPerMonth;
  const queryRevenue = totalQueries * CONFIG.revenue.queryPriceTokens;
  const platformFee = queryRevenue * (CONFIG.revenue.platformFeePercent / 100);
  const userEarnings = queryRevenue - platformFee;
  const tokensBurned = platformFee * (CONFIG.revenue.tokenBurnPercent / 100);
  
  state.treasury += platformFee - tokensBurned;
  state.totalBurned += tokensBurned;
  
  // Agent staking
  const newAgentStakes = newAgents * CONFIG.rewards.agentStakeRequired;
  state.stakedTokens += newAgentStakes;
  
  // Token price update
  state.tokenPrice *= (1 + scenario.tokenPriceGrowth);
  
  // Record month data
  month.endingState = { ...state };
  month.metrics = {
    newUsers,
    churnedUsers,
    netUserGrowth: newUsers - churnedUsers,
    newAgents,
    totalQueries,
    rewardsDistributed: parseFloat(totalRewardsDistributed.toFixed(2)),
    queryRevenue: parseFloat(queryRevenue.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    userEarnings: parseFloat(userEarnings.toFixed(2)),
    tokensBurned: parseFloat(tokensBurned.toFixed(2)),
    newAgentStakes: parseFloat(newAgentStakes.toFixed(2)),
    treasuryChange: parseFloat((platformFee - tokensBurned - totalRewardsDistributed).toFixed(2))
  };
  
  return month;
}

function runScenario(scenarioKey) {
  const scenario = CONFIG.scenarios[scenarioKey];
  
  // Initialize state
  const state = {
    users: CONFIG.initial.platformUsers,
    agents: CONFIG.initial.activeAgents,
    treasury: CONFIG.initial.treasury,
    tokenPrice: CONFIG.initial.tokenPrice,
    stakedTokens: CONFIG.initial.activeAgents * CONFIG.rewards.agentStakeRequired,
    totalBurned: 0
  };
  
  const months = [];
  let breakEvenMonth = null;
  
  for (let m = 1; m <= CONFIG.simulationMonths; m++) {
    const monthData = simulateMonth(state, scenario, m);
    months.push(monthData);
    
    // Check for break-even (revenue > rewards)
    if (!breakEvenMonth && monthData.metrics.platformFee > monthData.metrics.rewardsDistributed) {
      breakEvenMonth = m;
    }
  }
  
  // Calculate projections
  const finalState = months[months.length - 1].endingState;
  const totalRevenue = months.reduce((sum, m) => sum + m.metrics.platformFee, 0);
  const totalRewards = months.reduce((sum, m) => sum + m.metrics.rewardsDistributed, 0);
  const totalQueries = months.reduce((sum, m) => sum + m.metrics.totalQueries, 0);
  
  return {
    scenario: scenario.name,
    scenarioKey,
    config: scenario,
    initialState: {
      users: CONFIG.initial.platformUsers,
      agents: CONFIG.initial.activeAgents,
      treasury: CONFIG.initial.treasury,
      tokenPrice: CONFIG.initial.tokenPrice
    },
    finalState: {
      users: finalState.users,
      agents: finalState.agents,
      treasury: parseFloat(finalState.treasury.toFixed(2)),
      tokenPrice: parseFloat(finalState.tokenPrice.toFixed(4)),
      stakedTokens: parseFloat(finalState.stakedTokens.toFixed(2)),
      totalBurned: parseFloat(finalState.totalBurned.toFixed(2))
    },
    summary: {
      userGrowth: `${CONFIG.initial.platformUsers} → ${finalState.users} (${((finalState.users / CONFIG.initial.platformUsers - 1) * 100).toFixed(0)}%)`,
      agentGrowth: `${CONFIG.initial.activeAgents} → ${finalState.agents} (${((finalState.agents / CONFIG.initial.activeAgents - 1) * 100).toFixed(0)}%)`,
      treasuryChange: parseFloat((finalState.treasury - CONFIG.initial.treasury).toFixed(2)),
      treasuryRemaining: parseFloat(((finalState.treasury / CONFIG.initial.treasury) * 100).toFixed(1)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalRewards: parseFloat(totalRewards.toFixed(2)),
      totalQueries: totalQueries,
      totalBurned: parseFloat(finalState.totalBurned.toFixed(2)),
      breakEvenMonth: breakEvenMonth || 'Not reached',
      tokenPriceChange: `$${CONFIG.initial.tokenPrice} → $${finalState.tokenPrice.toFixed(4)} (${((finalState.tokenPrice / CONFIG.initial.tokenPrice - 1) * 100).toFixed(0)}%)`
    },
    monthlyData: months.map(m => ({
      month: m.month,
      users: m.endingState.users,
      agents: m.endingState.agents,
      treasury: parseFloat(m.endingState.treasury.toFixed(2)),
      tokenPrice: parseFloat(m.endingState.tokenPrice.toFixed(4)),
      queries: m.metrics.totalQueries,
      revenue: m.metrics.platformFee,
      rewards: m.metrics.rewardsDistributed,
      netFlow: m.metrics.treasuryChange
    })),
    chartData: {
      labels: months.map(m => `Month ${m.month}`),
      users: months.map(m => m.endingState.users),
      agents: months.map(m => m.endingState.agents),
      treasury: months.map(m => parseFloat(m.endingState.treasury.toFixed(2))),
      revenue: months.map(m => m.metrics.platformFee),
      rewards: months.map(m => m.metrics.rewardsDistributed)
    }
  };
}

function runTokenomicsSimulation() {
  console.log('🚀 Starting Proofi Tokenomics Simulation\n');
  console.log('='.repeat(70));
  console.log('INITIAL CONDITIONS');
  console.log('='.repeat(70));
  console.log(`Treasury: ${CONFIG.initial.treasury.toLocaleString()} tokens`);
  console.log(`Token Price: $${CONFIG.initial.tokenPrice}`);
  console.log(`Starting Users: ${CONFIG.initial.platformUsers}`);
  console.log(`Starting Agents: ${CONFIG.initial.activeAgents}`);
  console.log(`Simulation Period: ${CONFIG.simulationMonths} months`);
  
  // Run all scenarios
  const results = {};
  for (const key of Object.keys(CONFIG.scenarios)) {
    console.log(`\n📊 Running ${CONFIG.scenarios[key].name} scenario...`);
    results[key] = runScenario(key);
  }
  
  // Print comparison table
  console.log('\n' + '='.repeat(70));
  console.log('12-MONTH PROJECTIONS BY SCENARIO');
  console.log('='.repeat(70));
  
  console.log('\n┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐');
  console.log('│ Metric          │ Conservative    │ Moderate        │ Aggressive      │');
  console.log('├─────────────────┼─────────────────┼─────────────────┼─────────────────┤');
  
  const metrics = [
    ['Final Users', r => r.finalState.users.toLocaleString()],
    ['Final Agents', r => r.finalState.agents.toLocaleString()],
    ['Treasury Left', r => `${r.summary.treasuryRemaining}%`],
    ['Total Revenue', r => `${r.summary.totalRevenue.toLocaleString()} tk`],
    ['Total Rewards', r => `${r.summary.totalRewards.toLocaleString()} tk`],
    ['Total Queries', r => r.summary.totalQueries.toLocaleString()],
    ['Tokens Burned', r => `${r.summary.totalBurned.toLocaleString()} tk`],
    ['Break-even', r => r.summary.breakEvenMonth],
    ['Token Price', r => `$${r.finalState.tokenPrice.toFixed(3)}`]
  ];
  
  for (const [label, getter] of metrics) {
    const c = getter(results.conservative);
    const m = getter(results.moderate);
    const a = getter(results.aggressive);
    console.log(`│ ${label.padEnd(15)} │ ${c.padStart(15)} │ ${m.padStart(15)} │ ${a.padStart(15)} │`);
  }
  console.log('└─────────────────┴─────────────────┴─────────────────┴─────────────────┘');
  
  // Treasury depletion analysis
  console.log('\n📉 Treasury Depletion Analysis:');
  for (const key of Object.keys(results)) {
    const r = results[key];
    const monthlyBurn = (CONFIG.initial.treasury - r.finalState.treasury) / CONFIG.simulationMonths;
    const monthsToDepletion = r.finalState.treasury > 0 
      ? Math.floor(r.finalState.treasury / Math.max(monthlyBurn, 1))
      : 0;
    
    console.log(`   ${r.scenario}: ${r.summary.treasuryRemaining}% remaining, ~${monthsToDepletion + 12} months until depletion at current rate`);
  }
  
  // Key insights
  console.log('\n💡 Key Insights:');
  
  const modResult = results.moderate;
  if (modResult.summary.breakEvenMonth !== 'Not reached') {
    console.log(`   ✓ Break-even achievable in month ${modResult.summary.breakEvenMonth} with moderate growth`);
  } else {
    console.log(`   ⚠️  Break-even not reached in 12 months - consider adjusting reward rates`);
  }
  
  const conservativeRemaining = results.conservative.summary.treasuryRemaining;
  if (conservativeRemaining > 50) {
    console.log(`   ✓ Treasury sustainable: ${conservativeRemaining}% remaining even with conservative growth`);
  } else {
    console.log(`   ⚠️  Treasury at risk: only ${conservativeRemaining}% remaining with conservative growth`);
  }
  
  const aggressiveUsers = results.aggressive.finalState.users;
  console.log(`   📈 Aggressive growth could reach ${aggressiveUsers.toLocaleString()} users in 12 months`);
  
  // Build full report
  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    scenarios: results,
    analysis: {
      breakEvenAnalysis: {
        conservative: results.conservative.summary.breakEvenMonth,
        moderate: results.moderate.summary.breakEvenMonth,
        aggressive: results.aggressive.summary.breakEvenMonth
      },
      treasuryHealth: {
        conservative: `${results.conservative.summary.treasuryRemaining}% remaining`,
        moderate: `${results.moderate.summary.treasuryRemaining}% remaining`,
        aggressive: `${results.aggressive.summary.treasuryRemaining}% remaining`
      },
      recommendations: [
        results.moderate.summary.breakEvenMonth === 'Not reached' 
          ? 'Consider reducing signup bonus or increasing query fees to reach break-even faster'
          : 'Current reward structure is sustainable',
        results.conservative.summary.treasuryRemaining < 30
          ? 'Treasury depletion risk - consider fundraising or token sale'
          : 'Treasury runway is healthy for conservative growth',
        'Monitor actual vs projected user growth monthly and adjust accordingly'
      ]
    }
  };
  
  // Save report
  const outputPath = path.join(__dirname, 'output', 'tokenomics-report.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Full report saved to: ${outputPath}`);
  
  return report;
}

// Run if called directly
if (require.main === module) {
  runTokenomicsSimulation();
}

module.exports = { runTokenomicsSimulation, CONFIG };
