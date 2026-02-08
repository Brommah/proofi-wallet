/**
 * Basic usage example for @proofi/agent-sdk
 *
 * This example demonstrates:
 * 1. Initializing the SDK with a capability token
 * 2. Validating the token
 * 3. Reading encrypted user data
 * 4. Writing data back (if permitted)
 * 5. Listing accessible scopes
 */

import { ProofiAgent, TokenExpiredError, ScopeError, generateKeyPair, encodeBase64 } from '../src';

// Types for our health data
interface HealthMetrics {
  heartRate: number;
  steps: number;
  sleepHours: number;
  timestamp: number;
}

interface HealthInsights {
  analysis: string;
  recommendations: string[];
  score: number;
  generatedAt: number;
}

async function main() {
  // In production, you'd receive the capability token from the user's extension
  // For this example, we'll use a placeholder
  const capabilityToken = process.env.PROOFI_CAPABILITY_TOKEN;

  if (!capabilityToken) {
    console.log('No capability token provided.');
    console.log('');
    console.log('To run this example:');
    console.log('1. Generate an agent keypair (see below)');
    console.log('2. Register your agent with Proofi');
    console.log('3. Have a user grant you access via their Proofi extension');
    console.log('4. Set PROOFI_CAPABILITY_TOKEN environment variable');
    console.log('');
    generateExampleKeypair();
    return;
  }

  // Your agent's private key (stored securely!)
  const agentPrivateKey = process.env.PROOFI_AGENT_PRIVATE_KEY;

  if (!agentPrivateKey) {
    console.error('PROOFI_AGENT_PRIVATE_KEY not set');
    return;
  }

  // Initialize the SDK
  const agent = new ProofiAgent({
    token: capabilityToken,
    privateKey: agentPrivateKey,
    ddcEndpoint: 'https://ddc.cere.network',
  });

  try {
    // 1. Validate the token
    console.log('Validating capability token...');
    const validation = await agent.validateToken();

    if (!validation.valid) {
      console.error('Token is invalid:', validation.reason);
      return;
    }

    console.log(`✓ Token valid, expires in ${Math.round(validation.expiresIn! / 1000 / 60)} minutes`);
    console.log(`  Issuer: ${agent.getIssuer()}`);
    console.log('');

    // 2. List accessible scopes
    console.log('Granted scopes:');
    const scopes = agent.listScope();
    for (const scope of scopes) {
      console.log(`  ${scope.path}: ${scope.permissions.join(', ')}`);
    }
    console.log('');

    // 3. Read user's health metrics (if we have access)
    if (agent.hasPermission('health/metrics', 'read')) {
      console.log('Reading health metrics...');
      const metrics = await agent.read<HealthMetrics>('health/metrics');
      console.log('User health data:', JSON.stringify(metrics, null, 2));
      console.log('');

      // 4. Generate insights and write back (if permitted)
      if (agent.hasPermission('health/insights', 'write')) {
        console.log('Generating and writing health insights...');

        const insights: HealthInsights = {
          analysis: analyzeHealthMetrics(metrics),
          recommendations: generateRecommendations(metrics),
          score: calculateHealthScore(metrics),
          generatedAt: Date.now(),
        };

        await agent.write('health/insights', insights);
        console.log('✓ Insights written successfully');
      } else {
        console.log('(No write permission for insights path)');
      }
    } else {
      console.log('No read permission for health/metrics');
    }

    // 5. Check other accessible data
    const readablePaths = agent.getAccessiblePaths('read');
    console.log('');
    console.log('All readable paths:', readablePaths);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.error('Token has expired:', error.message);
      console.log('Please request a new token from the user.');
    } else if (error instanceof ScopeError) {
      console.error('Access denied:', error.message);
      console.log('Available scopes:', error.availableScopes);
    } else {
      throw error;
    }
  }
}

// Helper functions for health analysis
function analyzeHealthMetrics(metrics: HealthMetrics): string {
  const analyses: string[] = [];

  if (metrics.heartRate < 60) {
    analyses.push('Resting heart rate indicates excellent cardiovascular fitness');
  } else if (metrics.heartRate > 100) {
    analyses.push('Elevated resting heart rate - consider stress management');
  }

  if (metrics.steps >= 10000) {
    analyses.push('Meeting daily step goals - great activity level');
  } else if (metrics.steps < 5000) {
    analyses.push('Step count below recommended levels');
  }

  if (metrics.sleepHours >= 7 && metrics.sleepHours <= 9) {
    analyses.push('Sleep duration within healthy range');
  } else if (metrics.sleepHours < 6) {
    analyses.push('Insufficient sleep detected');
  }

  return analyses.join('. ') || 'Metrics within normal ranges';
}

function generateRecommendations(metrics: HealthMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.steps < 10000) {
    recommendations.push('Try to increase daily walking by 1000 steps');
  }

  if (metrics.sleepHours < 7) {
    recommendations.push('Aim for 7-8 hours of sleep per night');
  }

  if (metrics.heartRate > 80) {
    recommendations.push('Consider adding cardio exercise 3x per week');
  }

  return recommendations.length > 0 ? recommendations : ['Maintain current healthy habits'];
}

function calculateHealthScore(metrics: HealthMetrics): number {
  let score = 70; // Base score

  // Heart rate contribution (0-15 points)
  if (metrics.heartRate >= 60 && metrics.heartRate <= 80) score += 15;
  else if (metrics.heartRate >= 50 && metrics.heartRate <= 90) score += 10;

  // Steps contribution (0-10 points)
  score += Math.min(10, Math.floor(metrics.steps / 1000));

  // Sleep contribution (0-5 points)
  if (metrics.sleepHours >= 7 && metrics.sleepHours <= 9) score += 5;
  else if (metrics.sleepHours >= 6) score += 3;

  return Math.min(100, score);
}

function generateExampleKeypair() {
  console.log('Generating example agent keypair:');
  console.log('');

  const { publicKey, privateKey } = generateKeyPair();

  console.log('Public Key (share with Proofi registry):');
  console.log(`  ${encodeBase64(publicKey)}`);
  console.log('');
  console.log('Private Key (keep secret!):');
  console.log(`  ${encodeBase64(privateKey)}`);
  console.log('');
  console.log('Store the private key securely and set it as PROOFI_AGENT_PRIVATE_KEY');
}

// Run if executed directly
main().catch(console.error);
