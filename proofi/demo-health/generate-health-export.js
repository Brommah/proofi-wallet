#!/usr/bin/env node
/**
 * Generate Synthetic Apple Health Export
 * 
 * Creates a realistic export.xml matching Apple Health's format.
 * 6 months of data with realistic patterns.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  startDate: new Date('2024-08-01'),
  endDate: new Date('2025-02-07'),
  user: {
    name: 'Demo User',
    birthDate: '1988-05-15',
    sex: 'Male',
    bloodType: 'O+',
    fitzpatrickSkinType: 'III'
  }
};

// Helpers
function formatDate(date) {
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' +0100';
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomInRange(min, max + 1));
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Generate step count data
function* generateSteps(startDate, endDate) {
  const current = new Date(startDate);
  let recordId = 1;
  
  while (current < endDate) {
    const isWeekendDay = isWeekend(current);
    const baseSteps = isWeekendDay ? randomInt(3000, 8000) : randomInt(6000, 14000);
    
    // Add some variation - some days are very active, some not
    const modifier = Math.random() > 0.85 ? randomInRange(1.3, 2.0) : 
                     Math.random() < 0.1 ? randomInRange(0.3, 0.6) : 1;
    
    const steps = Math.round(baseSteps * modifier);
    const distance = (steps * 0.762).toFixed(0); // ~0.762m per step
    
    // Split into hourly records (more realistic)
    const hours = randomInt(8, 16); // Active hours
    const stepsPerHour = Math.round(steps / hours);
    
    for (let h = 0; h < hours; h++) {
      const hourStart = new Date(current);
      hourStart.setHours(7 + h, randomInt(0, 59), 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setMinutes(hourEnd.getMinutes() + randomInt(30, 59));
      
      const hourSteps = Math.round(stepsPerHour * randomInRange(0.5, 1.5));
      
      yield {
        type: 'HKQuantityTypeIdentifierStepCount',
        sourceName: 'iPhone',
        sourceVersion: '17.3',
        unit: 'count',
        value: hourSteps,
        startDate: formatDate(hourStart),
        endDate: formatDate(hourEnd),
        id: `step_${recordId++}`
      };
    }
    
    // Daily distance
    yield {
      type: 'HKQuantityTypeIdentifierDistanceWalkingRunning',
      sourceName: 'iPhone',
      sourceVersion: '17.3',
      unit: 'm',
      value: distance,
      startDate: formatDate(current),
      endDate: formatDate(new Date(current.getTime() + 86400000)),
      id: `dist_${recordId++}`
    };
    
    current.setDate(current.getDate() + 1);
  }
}

// Generate heart rate data
function* generateHeartRate(startDate, endDate) {
  const current = new Date(startDate);
  let recordId = 1;
  const restingHR = randomInt(58, 68); // Base resting HR
  
  while (current < endDate) {
    // Multiple readings per day
    const readingsPerDay = randomInt(20, 50);
    
    for (let i = 0; i < readingsPerDay; i++) {
      const readTime = new Date(current);
      readTime.setHours(randomInt(6, 23), randomInt(0, 59), randomInt(0, 59));
      
      const hour = readTime.getHours();
      let context, hr;
      
      // Contextual heart rate
      if (hour >= 0 && hour < 6) {
        context = 'sleeping';
        hr = restingHR + randomInt(-8, 5);
      } else if (hour >= 6 && hour < 9) {
        context = Math.random() > 0.7 ? 'exercise' : 'resting';
        hr = context === 'exercise' ? randomInt(120, 165) : restingHR + randomInt(5, 20);
      } else if (hour >= 17 && hour < 19) {
        context = Math.random() > 0.6 ? 'exercise' : 'walking';
        hr = context === 'exercise' ? randomInt(130, 175) : randomInt(85, 110);
      } else {
        context = Math.random() > 0.8 ? 'walking' : 'resting';
        hr = context === 'walking' ? randomInt(80, 105) : restingHR + randomInt(0, 15);
      }
      
      yield {
        type: 'HKQuantityTypeIdentifierHeartRate',
        sourceName: 'Apple Watch',
        sourceVersion: '10.3',
        unit: 'count/min',
        value: hr,
        startDate: formatDate(readTime),
        endDate: formatDate(readTime),
        id: `hr_${recordId++}`,
        metadata: { HKMetadataKeyHeartRateMotionContext: context === 'exercise' ? '2' : context === 'walking' ? '1' : '0' }
      };
    }
    
    current.setDate(current.getDate() + 1);
  }
}

// Generate HRV data
function* generateHRV(startDate, endDate) {
  const current = new Date(startDate);
  let recordId = 1;
  const baseHRV = randomInt(35, 55);
  
  while (current < endDate) {
    // 2-4 HRV readings per day (usually during rest/sleep)
    const readings = randomInt(2, 4);
    
    for (let i = 0; i < readings; i++) {
      const readTime = new Date(current);
      readTime.setHours(randomInt(0, 7), randomInt(0, 59), 0);
      
      // HRV varies with stress, sleep quality, etc
      const dayVariation = randomInRange(-15, 15);
      const hrv = Math.max(15, Math.round(baseHRV + dayVariation + randomInt(-5, 5)));
      
      yield {
        type: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
        sourceName: 'Apple Watch',
        sourceVersion: '10.3',
        unit: 'ms',
        value: hrv,
        startDate: formatDate(readTime),
        endDate: formatDate(readTime),
        id: `hrv_${recordId++}`
      };
    }
    
    current.setDate(current.getDate() + 1);
  }
}

// Generate sleep data
function* generateSleep(startDate, endDate) {
  const current = new Date(startDate);
  let recordId = 1;
  
  while (current < endDate) {
    const isWeekendNight = isWeekend(current);
    
    // Bed time varies
    const bedHour = isWeekendNight ? randomInt(23, 25) % 24 : randomInt(22, 24) % 24;
    const bedTime = new Date(current);
    bedTime.setHours(bedHour, randomInt(0, 45), 0);
    
    // Wake time
    const sleepDuration = isWeekendNight ? randomInRange(7.5, 9.5) : randomInRange(5.5, 8);
    const wakeTime = new Date(bedTime.getTime() + sleepDuration * 3600000);
    
    // Sleep stages
    const totalMinutes = sleepDuration * 60;
    const deepPct = randomInRange(0.12, 0.22);
    const remPct = randomInRange(0.18, 0.28);
    const awakePct = randomInRange(0.02, 0.08);
    const corePct = 1 - deepPct - remPct - awakePct;
    
    // In Bed
    yield {
      type: 'HKCategoryTypeIdentifierSleepAnalysis',
      sourceName: 'Apple Watch',
      sourceVersion: '10.3',
      value: 'HKCategoryValueSleepAnalysisInBed',
      startDate: formatDate(bedTime),
      endDate: formatDate(wakeTime),
      id: `sleep_inbed_${recordId++}`
    };
    
    // Generate sleep stages
    let stageStart = new Date(bedTime);
    const stages = [
      { value: 'HKCategoryValueSleepAnalysisAsleepCore', duration: totalMinutes * corePct },
      { value: 'HKCategoryValueSleepAnalysisAsleepDeep', duration: totalMinutes * deepPct },
      { value: 'HKCategoryValueSleepAnalysisAsleepREM', duration: totalMinutes * remPct },
      { value: 'HKCategoryValueSleepAnalysisAwake', duration: totalMinutes * awakePct }
    ];
    
    // Distribute stages throughout the night (simplified)
    for (const stage of stages) {
      if (stage.duration < 5) continue;
      
      const segments = Math.ceil(stage.duration / 45); // ~45 min cycles
      const segmentDuration = stage.duration / segments;
      
      for (let s = 0; s < segments; s++) {
        const offset = Math.random() * totalMinutes;
        const segStart = new Date(bedTime.getTime() + offset * 60000);
        const segEnd = new Date(segStart.getTime() + segmentDuration * 60000);
        
        if (segEnd > wakeTime) continue;
        
        yield {
          type: 'HKCategoryTypeIdentifierSleepAnalysis',
          sourceName: 'Apple Watch',
          sourceVersion: '10.3',
          value: stage.value,
          startDate: formatDate(segStart),
          endDate: formatDate(segEnd),
          id: `sleep_${recordId++}`
        };
      }
    }
    
    current.setDate(current.getDate() + 1);
  }
}

// Generate blood oxygen data
function* generateBloodOxygen(startDate, endDate) {
  const current = new Date(startDate);
  let recordId = 1;
  
  while (current < endDate) {
    // 3-8 readings per day (mostly during sleep)
    const readings = randomInt(3, 8);
    
    for (let i = 0; i < readings; i++) {
      const readTime = new Date(current);
      readTime.setHours(randomInt(0, 6), randomInt(0, 59), 0);
      
      // SpO2 typically 95-100%, occasionally lower during sleep
      const spo2 = Math.random() > 0.95 ? randomInt(92, 95) : randomInt(95, 100);
      
      yield {
        type: 'HKQuantityTypeIdentifierOxygenSaturation',
        sourceName: 'Apple Watch',
        sourceVersion: '10.3',
        unit: '%',
        value: spo2,
        startDate: formatDate(readTime),
        endDate: formatDate(readTime),
        id: `spo2_${recordId++}`
      };
    }
    
    current.setDate(current.getDate() + 1);
  }
}

// Generate workout data
function* generateWorkouts(startDate, endDate) {
  const current = new Date(startDate);
  let recordId = 1;
  
  const workoutTypes = [
    { type: 'HKWorkoutActivityTypeRunning', name: 'Running', minDuration: 20, maxDuration: 60, calories: [8, 14] },
    { type: 'HKWorkoutActivityTypeWalking', name: 'Walking', minDuration: 15, maxDuration: 45, calories: [3, 6] },
    { type: 'HKWorkoutActivityTypeCycling', name: 'Cycling', minDuration: 20, maxDuration: 90, calories: [6, 12] },
    { type: 'HKWorkoutActivityTypeTraditionalStrengthTraining', name: 'Strength', minDuration: 30, maxDuration: 75, calories: [4, 8] },
    { type: 'HKWorkoutActivityTypeYoga', name: 'Yoga', minDuration: 20, maxDuration: 60, calories: [2, 4] },
    { type: 'HKWorkoutActivityTypeHighIntensityIntervalTraining', name: 'HIIT', minDuration: 15, maxDuration: 35, calories: [10, 18] }
  ];
  
  while (current < endDate) {
    // 3-5 workouts per week
    const dayOfWeek = current.getDay();
    const workoutChance = [0.6, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5][dayOfWeek]; // Higher on Tue, Fri, Sat
    
    if (Math.random() < workoutChance) {
      const workout = workoutTypes[randomInt(0, workoutTypes.length - 1)];
      const duration = randomInt(workout.minDuration, workout.maxDuration);
      const calories = Math.round(duration * randomInRange(workout.calories[0], workout.calories[1]));
      
      const startHour = dayOfWeek === 0 || dayOfWeek === 6 ? randomInt(8, 11) : 
                        Math.random() > 0.5 ? randomInt(6, 8) : randomInt(17, 19);
      
      const workoutStart = new Date(current);
      workoutStart.setHours(startHour, randomInt(0, 30), 0);
      const workoutEnd = new Date(workoutStart.getTime() + duration * 60000);
      
      yield {
        type: 'HKWorkout',
        workoutActivityType: workout.type,
        sourceName: 'Apple Watch',
        sourceVersion: '10.3',
        duration: duration * 60, // in seconds
        totalEnergyBurned: calories,
        totalEnergyBurnedUnit: 'kcal',
        startDate: formatDate(workoutStart),
        endDate: formatDate(workoutEnd),
        id: `workout_${recordId++}`
      };
    }
    
    current.setDate(current.getDate() + 1);
  }
}

// Generate respiratory rate
function* generateRespiratoryRate(startDate, endDate) {
  const current = new Date(startDate);
  let recordId = 1;
  const baseRate = randomInt(12, 16);
  
  while (current < endDate) {
    // Few readings per day, mostly during sleep
    const readings = randomInt(1, 3);
    
    for (let i = 0; i < readings; i++) {
      const readTime = new Date(current);
      readTime.setHours(randomInt(1, 5), randomInt(0, 59), 0);
      
      const rate = baseRate + randomInRange(-2, 2);
      
      yield {
        type: 'HKQuantityTypeIdentifierRespiratoryRate',
        sourceName: 'Apple Watch',
        sourceVersion: '10.3',
        unit: 'count/min',
        value: rate.toFixed(1),
        startDate: formatDate(readTime),
        endDate: formatDate(readTime),
        id: `resp_${recordId++}`
      };
    }
    
    current.setDate(current.getDate() + 1);
  }
}

// Build XML
function recordToXML(record) {
  if (record.type === 'HKWorkout') {
    return `  <Workout workoutActivityType="${record.workoutActivityType}" duration="${record.duration}" durationUnit="s" totalEnergyBurned="${record.totalEnergyBurned}" totalEnergyBurnedUnit="${record.totalEnergyBurnedUnit}" sourceName="${record.sourceName}" sourceVersion="${record.sourceVersion}" startDate="${record.startDate}" endDate="${record.endDate}"/>`;
  }
  
  if (record.type.includes('CategoryType')) {
    return `  <Record type="${record.type}" sourceName="${record.sourceName}" sourceVersion="${record.sourceVersion}" startDate="${record.startDate}" endDate="${record.endDate}" value="${record.value}"/>`;
  }
  
  let metadataXML = '';
  if (record.metadata) {
    metadataXML = '\n' + Object.entries(record.metadata)
      .map(([key, value]) => `    <MetadataEntry key="${key}" value="${value}"/>`)
      .join('\n') + '\n  ';
  }
  
  return `  <Record type="${record.type}" sourceName="${record.sourceName}" sourceVersion="${record.sourceVersion}" unit="${record.unit}" value="${record.value}" startDate="${record.startDate}" endDate="${record.endDate}">${metadataXML ? metadataXML + '/>' : '/>'}`;
}

function generateExport() {
  console.log('🏥 Generating Apple Health Export...');
  console.log(`   Period: ${CONFIG.startDate.toISOString().split('T')[0]} to ${CONFIG.endDate.toISOString().split('T')[0]}`);
  
  const records = [];
  
  console.log('   📊 Generating step counts...');
  for (const record of generateSteps(CONFIG.startDate, CONFIG.endDate)) {
    records.push(record);
  }
  console.log(`      → ${records.length} step records`);
  
  const preHR = records.length;
  console.log('   ❤️  Generating heart rate data...');
  for (const record of generateHeartRate(CONFIG.startDate, CONFIG.endDate)) {
    records.push(record);
  }
  console.log(`      → ${records.length - preHR} heart rate records`);
  
  const preHRV = records.length;
  console.log('   📈 Generating HRV data...');
  for (const record of generateHRV(CONFIG.startDate, CONFIG.endDate)) {
    records.push(record);
  }
  console.log(`      → ${records.length - preHRV} HRV records`);
  
  const preSleep = records.length;
  console.log('   😴 Generating sleep data...');
  for (const record of generateSleep(CONFIG.startDate, CONFIG.endDate)) {
    records.push(record);
  }
  console.log(`      → ${records.length - preSleep} sleep records`);
  
  const preO2 = records.length;
  console.log('   🫁 Generating blood oxygen data...');
  for (const record of generateBloodOxygen(CONFIG.startDate, CONFIG.endDate)) {
    records.push(record);
  }
  console.log(`      → ${records.length - preO2} SpO2 records`);
  
  const preWorkout = records.length;
  console.log('   🏋️  Generating workouts...');
  for (const record of generateWorkouts(CONFIG.startDate, CONFIG.endDate)) {
    records.push(record);
  }
  console.log(`      → ${records.length - preWorkout} workout records`);
  
  const preResp = records.length;
  console.log('   🌬️  Generating respiratory rate...');
  for (const record of generateRespiratoryRate(CONFIG.startDate, CONFIG.endDate)) {
    records.push(record);
  }
  console.log(`      → ${records.length - preResp} respiratory records`);
  
  console.log(`\n   📦 Total: ${records.length} records`);
  
  // Sort by date
  records.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  // Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE HealthData [
  <!ENTITY Proofi "Synthetic Health Export for Demo">
]>
<HealthData locale="en_US">
  <ExportDate value="${formatDate(new Date())}"/>
  <Me HKCharacteristicTypeIdentifierDateOfBirth="${CONFIG.user.birthDate}" HKCharacteristicTypeIdentifierBiologicalSex="HKBiologicalSex${CONFIG.user.sex}" HKCharacteristicTypeIdentifierBloodType="HKBloodType${CONFIG.user.bloodType.replace('+', 'Positive').replace('-', 'Negative')}" HKCharacteristicTypeIdentifierFitzpatrickSkinType="HKFitzpatrickSkinType${CONFIG.user.fitzpatrickSkinType}"/>
${records.map(recordToXML).join('\n')}
</HealthData>`;

  return xml;
}

// Main
const xml = generateExport();
const outputPath = path.join(__dirname, 'apple-health-export.xml');
fs.writeFileSync(outputPath, xml);

const stats = fs.statSync(outputPath);
console.log(`\n✅ Written to: ${outputPath}`);
console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log('\n🎯 Ready for demo upload!');
