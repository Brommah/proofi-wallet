#!/usr/bin/env node
/**
 * Query Simulator for Proofi
 * Simulates agents querying user data with configurable parameters
 * Outputs earnings projections, query volume, and revenue split
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  users: 1000,
  agents: 50,
  simulationDays: 30,
  
  // Query patterns (queries per user per day)
  queryRates: {
    min: 0,
    max: 5,
    avgPerUser: 1.5
  },
  
  // Pricing in tokens
  pricing: {
    baseQueryPrice: 0.10,      // Base price per query
    premiumDataMultiplier: 2.0, // Premium data costs 2x
    platformFeePercent: 15,     // Platform takes 15%
    userSharePercent: 85        // User gets 85%
  },
  
  // Data types and their relative frequencies
  dataTypes: [
    { name: 'basic_identity', frequency: 0.40, premium: false },
    { name: 'age_verification', frequency: 0.25, premium: false },
    { name: 'credit_score', frequency: 0.15, premium: true },
    { name: 'income_verification', frequency: 0.10, premium: true },
    { name: 'full_kyc', frequency: 0.10, premium: true }
  ]
};

// Random utility functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function pickDataType() {
  const rand = Math.random();
  let cumulative = 0;
  for (const type of CONFIG.dataTypes) {
    cumulative += type.frequency;
    if (rand <= cumulative) return type;
  }
  return CONFIG.dataTypes[0];
}

function generateAgentProfile(id) {
  // Agents have different query volumes (some are high-volume, some low)
  const volumeCategory = Math.random();
  let dailyQueries;
  if (volumeCategory < 0.2) {
    dailyQueries = randomInt(100, 500);  // High volume (20% of agents)
  } else if (volumeCategory < 0.5) {
    dailyQueries = randomInt(20, 100);   // Medium volume (30%)
  } else {
    dailyQueries = randomInt(1, 20);     // Low volume (50%)
  }
  
  return {
    id: `agent_${id}`,
    name: `Agent ${id}`,
    dailyQueries,
    preferredDataTypes: CONFIG.dataTypes.slice(0, randomInt(1, 5)).map(t => t.name)
  };
}

function generateUserProfile(id) {
  return {
    id: `user_${id}`,
    dataAvailable: CONFIG.dataTypes.filter(() => Math.random() > 0.3).map(t => t.name),
    totalEarnings: 0,
    queryCount: 0
  };
}

function simulateDay(users, agents, dayNumber) {
  const dayStats = {
    day: dayNumber,
    totalQueries: 0,
    totalRevenue: 0,
    platformRevenue: 0,
    userEarnings: 0,
    queriesByType: {},
    queriesByAgent: {}
  };
  
  // Initialize counters
  CONFIG.dataTypes.forEach(t => {
    dayStats.queriesByType[t.name] = 0;
  });
  
  // Each agent makes queries
  for (const agent of agents) {
    const dailyQueries = Math.floor(agent.dailyQueries * randomFloat(0.7, 1.3));
    dayStats.queriesByAgent[agent.id] = 0;
    
    for (let q = 0; q < dailyQueries; q++) {
      // Pick a random user
      const user = users[randomInt(0, users.length - 1)];
      const dataType = pickDataType();
      
      // Check if user has this data
      if (!user.dataAvailable.includes(dataType.name)) continue;
      
      // Calculate query price
      let queryPrice = CONFIG.pricing.baseQueryPrice;
      if (dataType.premium) {
        queryPrice *= CONFIG.pricing.premiumDataMultiplier;
      }
      
      // Split revenue
      const platformShare = queryPrice * (CONFIG.pricing.platformFeePercent / 100);
      const userShare = queryPrice * (CONFIG.pricing.userSharePercent / 100);
      
      // Update stats
      dayStats.totalQueries++;
      dayStats.totalRevenue += queryPrice;
      dayStats.platformRevenue += platformShare;
      dayStats.userEarnings += userShare;
      dayStats.queriesByType[dataType.name]++;
      dayStats.queriesByAgent[agent.id]++;
      
      // Update user
      user.totalEarnings += userShare;
      user.queryCount++;
    }
  }
  
  return dayStats;
}

function runSimulation() {
  console.log('🚀 Starting Proofi Query Simulation\n');
  console.log(`Configuration:`);
  console.log(`  Users: ${CONFIG.users}`);
  console.log(`  Agents: ${CONFIG.agents}`);
  console.log(`  Simulation Period: ${CONFIG.simulationDays} days\n`);
  
  // Generate entities
  const users = Array.from({ length: CONFIG.users }, (_, i) => generateUserProfile(i));
  const agents = Array.from({ length: CONFIG.agents }, (_, i) => generateAgentProfile(i));
  
  console.log(`Generated ${users.length} users and ${agents.length} agents\n`);
  
  // Run simulation
  const dailyStats = [];
  for (let day = 1; day <= CONFIG.simulationDays; day++) {
    const stats = simulateDay(users, agents, day);
    dailyStats.push(stats);
    
    if (day % 7 === 0) {
      console.log(`Day ${day}: ${stats.totalQueries} queries, ${stats.totalRevenue.toFixed(2)} tokens revenue`);
    }
  }
  
  // Aggregate results
  const totals = dailyStats.reduce((acc, day) => ({
    totalQueries: acc.totalQueries + day.totalQueries,
    totalRevenue: acc.totalRevenue + day.totalRevenue,
    platformRevenue: acc.platformRevenue + day.platformRevenue,
    userEarnings: acc.userEarnings + day.userEarnings
  }), { totalQueries: 0, totalRevenue: 0, platformRevenue: 0, userEarnings: 0 });
  
  // User earnings distribution
  const userEarningsSorted = users.map(u => u.totalEarnings).sort((a, b) => b - a);
  const avgEarnings = totals.userEarnings / CONFIG.users;
  const medianEarnings = userEarningsSorted[Math.floor(CONFIG.users / 2)];
  const top10PercentThreshold = userEarningsSorted[Math.floor(CONFIG.users * 0.1)];
  
  // Agent query distribution
  const agentQueries = agents.map(a => 
    dailyStats.reduce((sum, day) => sum + (day.queriesByAgent[a.id] || 0), 0)
  ).sort((a, b) => b - a);
  
  // Query type breakdown
  const queryTypeBreakdown = {};
  CONFIG.dataTypes.forEach(t => {
    queryTypeBreakdown[t.name] = dailyStats.reduce((sum, day) => sum + day.queriesByType[t.name], 0);
  });
  
  // Build report
  const report = {
    config: CONFIG,
    summary: {
      simulationPeriod: `${CONFIG.simulationDays} days`,
      totalQueries: totals.totalQueries,
      totalRevenue: parseFloat(totals.totalRevenue.toFixed(2)),
      platformRevenue: parseFloat(totals.platformRevenue.toFixed(2)),
      userEarnings: parseFloat(totals.userEarnings.toFixed(2)),
      averageQueriesPerDay: parseFloat((totals.totalQueries / CONFIG.simulationDays).toFixed(2)),
      averageRevenuePerDay: parseFloat((totals.totalRevenue / CONFIG.simulationDays).toFixed(2))
    },
    userMetrics: {
      totalUsers: CONFIG.users,
      averageEarningsPerUser: parseFloat(avgEarnings.toFixed(4)),
      medianEarningsPerUser: parseFloat(medianEarnings.toFixed(4)),
      top10PercentThreshold: parseFloat(top10PercentThreshold.toFixed(4)),
      earningsDistribution: {
        top10Percent: parseFloat(userEarningsSorted.slice(0, 100).reduce((a, b) => a + b, 0).toFixed(2)),
        middle40Percent: parseFloat(userEarningsSorted.slice(100, 500).reduce((a, b) => a + b, 0).toFixed(2)),
        bottom50Percent: parseFloat(userEarningsSorted.slice(500).reduce((a, b) => a + b, 0).toFixed(2))
      }
    },
    agentMetrics: {
      totalAgents: CONFIG.agents,
      topAgentQueries: agentQueries[0],
      medianAgentQueries: agentQueries[Math.floor(CONFIG.agents / 2)],
      queryDistribution: {
        top5Agents: agentQueries.slice(0, 5).reduce((a, b) => a + b, 0),
        rest: agentQueries.slice(5).reduce((a, b) => a + b, 0)
      }
    },
    queryTypeBreakdown,
    projections: {
      monthlyRevenue: parseFloat((totals.totalRevenue).toFixed(2)),
      yearlyRevenue: parseFloat((totals.totalRevenue * 12).toFixed(2)),
      yearlyUserEarnings: parseFloat((totals.userEarnings * 12).toFixed(2)),
      yearlyPlatformRevenue: parseFloat((totals.platformRevenue * 12).toFixed(2))
    },
    dailyStats: dailyStats.map(d => ({
      day: d.day,
      queries: d.totalQueries,
      revenue: parseFloat(d.totalRevenue.toFixed(2)),
      platformRevenue: parseFloat(d.platformRevenue.toFixed(2)),
      userEarnings: parseFloat(d.userEarnings.toFixed(2))
    }))
  };
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SIMULATION RESULTS');
  console.log('='.repeat(60));
  console.log(`\n📊 Overall Metrics (${CONFIG.simulationDays} days):`);
  console.log(`  Total Queries: ${totals.totalQueries.toLocaleString()}`);
  console.log(`  Total Revenue: ${totals.totalRevenue.toFixed(2)} tokens`);
  console.log(`  Platform Revenue: ${totals.platformRevenue.toFixed(2)} tokens (${CONFIG.pricing.platformFeePercent}%)`);
  console.log(`  User Earnings: ${totals.userEarnings.toFixed(2)} tokens (${CONFIG.pricing.userSharePercent}%)`);
  
  console.log(`\n👤 User Metrics:`);
  console.log(`  Average Earnings/User: ${avgEarnings.toFixed(4)} tokens`);
  console.log(`  Median Earnings/User: ${medianEarnings.toFixed(4)} tokens`);
  console.log(`  Top 10% earn above: ${top10PercentThreshold.toFixed(4)} tokens`);
  
  console.log(`\n🤖 Agent Metrics:`);
  console.log(`  Top Agent Queries: ${agentQueries[0].toLocaleString()}`);
  console.log(`  Top 5 Agents: ${((agentQueries.slice(0, 5).reduce((a, b) => a + b, 0) / totals.totalQueries) * 100).toFixed(1)}% of all queries`);
  
  console.log(`\n📈 Yearly Projections:`);
  console.log(`  Revenue: ${(totals.totalRevenue * 12).toFixed(2)} tokens`);
  console.log(`  Platform Revenue: ${(totals.platformRevenue * 12).toFixed(2)} tokens`);
  console.log(`  User Earnings: ${(totals.userEarnings * 12).toFixed(2)} tokens`);
  
  // Save report
  const outputPath = path.join(__dirname, 'output', 'query-simulation-report.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: ${outputPath}`);
  
  return report;
}

// Run if called directly
if (require.main === module) {
  runSimulation();
}

module.exports = { runSimulation, CONFIG };
