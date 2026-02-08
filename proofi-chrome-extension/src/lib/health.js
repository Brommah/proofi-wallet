/**
 * Proofi Health Data Processing
 * Parses Apple Health export XML and filters by selected scopes.
 * Mirrors CLI's parseAppleHealthXML for browser file upload.
 */

import { HEALTH_SCOPES, getHKTypesForScopes } from './scopes.js';

/**
 * Parse Apple Health export XML.
 * Uses regex for memory efficiency (no full DOM parse).
 * 
 * @param {string} xmlContent - Raw XML content
 * @returns {Object} { records: Array, exportDate: string|null }
 */
export function parseAppleHealthXML(xmlContent) {
  const records = [];
  
  // Extract Record elements
  const recordRegex = /<Record\s+([^>]+)\/>/g;
  let match;
  
  while ((match = recordRegex.exec(xmlContent)) !== null) {
    const attrs = match[1];
    const record = {};
    
    // Parse attributes
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      record[attrMatch[1]] = attrMatch[2];
    }
    
    if (record.type) {
      records.push({
        type: record.type,
        value: parseFloat(record.value) || record.value,
        unit: record.unit,
        startDate: record.startDate,
        endDate: record.endDate,
        sourceName: record.sourceName,
      });
    }
  }
  
  // Extract Workout elements
  const workoutRegex = /<Workout\s+([^>]+)\/>/g;
  while ((match = workoutRegex.exec(xmlContent)) !== null) {
    const attrs = match[1];
    const workout = {};
    
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      workout[attrMatch[1]] = attrMatch[2];
    }
    
    if (workout.workoutActivityType) {
      records.push({
        type: 'HKWorkout',
        workoutType: workout.workoutActivityType,
        duration: parseFloat(workout.duration),
        calories: parseFloat(workout.totalEnergyBurned),
        startDate: workout.startDate,
        endDate: workout.endDate,
      });
    }
  }
  
  // Extract export date
  const exportMatch = xmlContent.match(/ExportDate\s+value="([^"]+)"/);
  
  return {
    exportDate: exportMatch ? exportMatch[1] : null,
    records,
    totalRecords: records.length,
  };
}

/**
 * Filter health records by selected scope keys.
 * 
 * @param {Array} records - Parsed health records
 * @param {Array<string>} scopeKeys - Selected scope keys (e.g., ['health/steps', 'health/heart-rate'])
 * @returns {Array} Filtered records
 */
export function filterByScopes(records, scopeKeys) {
  const allowedTypes = new Set(getHKTypesForScopes(scopeKeys));
  return records.filter(r => allowedTypes.has(r.type));
}

/**
 * Group records by type for analysis.
 */
export function groupByType(records) {
  const groups = {};
  for (const r of records) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  }
  return groups;
}

/**
 * Generate summary statistics from health records.
 * 
 * @param {Array} records - Health records
 * @returns {Object} { text: string, stats: Object, totalRecords: number }
 */
export function summarizeHealthData(records) {
  const byType = groupByType(records);
  const summary = [];
  const stats = {};
  
  // Steps
  const steps = byType['HKQuantityTypeIdentifierStepCount'] || [];
  if (steps.length > 0) {
    const dailySteps = {};
    for (const s of steps) {
      const date = s.startDate?.split(' ')[0] || 'unknown';
      dailySteps[date] = (dailySteps[date] || 0) + (typeof s.value === 'number' ? s.value : 0);
    }
    const days = Object.values(dailySteps);
    const avgSteps = days.length > 0 ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
    summary.push(`📊 Steps: ${steps.length} records, avg ${avgSteps.toLocaleString()}/day`);
    stats.steps = { count: steps.length, avgDaily: avgSteps };
  }
  
  // Heart Rate
  const hr = byType['HKQuantityTypeIdentifierHeartRate'] || [];
  if (hr.length > 0) {
    const values = hr.filter(h => typeof h.value === 'number').map(h => h.value);
    if (values.length > 0) {
      const avgHR = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      const minHR = Math.min(...values);
      const maxHR = Math.max(...values);
      summary.push(`❤️ Heart Rate: ${hr.length} readings, avg ${avgHR} BPM (${minHR}-${maxHR})`);
      stats.heartRate = { count: hr.length, avg: avgHR, min: minHR, max: maxHR };
    }
  }
  
  // HRV
  const hrv = byType['HKQuantityTypeIdentifierHeartRateVariabilitySDNN'] || [];
  if (hrv.length > 0) {
    const values = hrv.filter(h => typeof h.value === 'number').map(h => h.value);
    if (values.length > 0) {
      const avgHRV = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      summary.push(`📈 HRV: ${hrv.length} readings, avg ${avgHRV}ms`);
      stats.hrv = { count: hrv.length, avg: avgHRV };
    }
  }
  
  // Sleep
  const sleep = byType['HKCategoryTypeIdentifierSleepAnalysis'] || [];
  if (sleep.length > 0) {
    const inBed = sleep.filter(s => s.value === 'HKCategoryValueSleepAnalysisInBed');
    summary.push(`😴 Sleep: ${inBed.length} nights tracked`);
    stats.sleep = { count: sleep.length, nightsTracked: inBed.length };
  }
  
  // SpO2
  const spo2 = byType['HKQuantityTypeIdentifierOxygenSaturation'] || [];
  if (spo2.length > 0) {
    const values = spo2.filter(s => typeof s.value === 'number').map(s => s.value * 100);
    if (values.length > 0) {
      const avgO2 = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      summary.push(`🫁 Blood Oxygen: ${spo2.length} readings, avg ${avgO2}%`);
      stats.spo2 = { count: spo2.length, avg: avgO2 };
    }
  }
  
  // Workouts
  const workouts = byType['HKWorkout'] || [];
  if (workouts.length > 0) {
    const totalCal = Math.round(workouts.reduce((a, b) => a + (b.calories || 0), 0));
    const totalMin = Math.round(workouts.reduce((a, b) => a + (b.duration || 0) / 60, 0));
    summary.push(`🏋️ Workouts: ${workouts.length} sessions, ${totalCal.toLocaleString()} kcal, ${totalMin} min`);
    stats.workouts = { count: workouts.length, totalCalories: totalCal, totalMinutes: totalMin };
  }
  
  return {
    text: summary.join('\n'),
    stats,
    totalRecords: records.length,
  };
}

/**
 * Encrypt health data for storage on DDC.
 * Uses AES-GCM with a random key.
 * 
 * @param {Object} data - Data to encrypt
 * @returns {Object} { ciphertext: string, iv: string, key: string }
 */
export async function encryptHealthData(data) {
  // Generate random 256-bit key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );
  
  // Export key
  const keyBytes = await crypto.subtle.exportKey('raw', key);
  
  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
    key: bufferToBase64(keyBytes),
  };
}

/**
 * Decrypt health data.
 */
export async function decryptHealthData(encrypted, keyBase64) {
  const key = await crypto.subtle.importKey(
    'raw',
    base64ToBuffer(keyBase64),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(encrypted.iv) },
    key,
    base64ToBuffer(encrypted.ciphertext)
  );
  
  return JSON.parse(new TextDecoder().decode(plaintext));
}

// Helpers
function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
