/**
 * Health Data Module for Proofi Wallet
 * Handles Apple Health XML import, parsing, storage, and DDC sync.
 */

// Health data types we support
export const HEALTH_DATA_TYPES = {
  sleep: {
    name: 'Sleep Analysis',
    icon: '🌙',
    sensitivity: 'medium',
    appleTypes: ['HKCategoryTypeIdentifierSleepAnalysis']
  },
  heart: {
    name: 'Heart Rate',
    icon: '❤️',
    sensitivity: 'medium',
    appleTypes: ['HKQuantityTypeIdentifierHeartRate']
  },
  steps: {
    name: 'Steps',
    icon: '👟',
    sensitivity: 'low',
    appleTypes: ['HKQuantityTypeIdentifierStepCount']
  },
  hrv: {
    name: 'Heart Rate Variability',
    icon: '📈',
    sensitivity: 'high',
    appleTypes: ['HKQuantityTypeIdentifierHeartRateVariabilitySDNN']
  },
  bloodOxygen: {
    name: 'Blood Oxygen',
    icon: '🫁',
    sensitivity: 'high',
    appleTypes: ['HKQuantityTypeIdentifierOxygenSaturation']
  },
  weight: {
    name: 'Weight',
    icon: '⚖️',
    sensitivity: 'medium',
    appleTypes: ['HKQuantityTypeIdentifierBodyMass']
  },
  activeEnergy: {
    name: 'Active Energy',
    icon: '🔥',
    sensitivity: 'low',
    appleTypes: ['HKQuantityTypeIdentifierActiveEnergyBurned']
  }
};

// Parse Apple Health XML export
export function parseAppleHealthXML(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  const records = doc.querySelectorAll('Record');
  const healthData = {
    sleep: [],
    heart: [],
    steps: [],
    hrv: [],
    bloodOxygen: [],
    weight: [],
    activeEnergy: [],
    metadata: {
      exportDate: new Date().toISOString(),
      recordCount: records.length,
      source: 'apple-health'
    }
  };
  
  records.forEach(record => {
    const type = record.getAttribute('type');
    const value = parseFloat(record.getAttribute('value')) || 0;
    const unit = record.getAttribute('unit') || '';
    const startDate = record.getAttribute('startDate');
    const endDate = record.getAttribute('endDate');
    const sourceName = record.getAttribute('sourceName') || 'Unknown';
    
    const entry = {
      value,
      unit,
      startDate,
      endDate,
      source: sourceName
    };
    
    // Map to our data types
    if (type === 'HKCategoryTypeIdentifierSleepAnalysis') {
      const sleepValue = record.getAttribute('value');
      healthData.sleep.push({
        ...entry,
        stage: sleepValue,
        duration: calculateDuration(startDate, endDate)
      });
    } else if (type === 'HKQuantityTypeIdentifierHeartRate') {
      healthData.heart.push({
        bpm: value,
        timestamp: startDate,
        source: sourceName
      });
    } else if (type === 'HKQuantityTypeIdentifierStepCount') {
      healthData.steps.push({
        count: value,
        date: startDate.split('T')[0],
        source: sourceName
      });
    } else if (type === 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN') {
      healthData.hrv.push({
        value,
        unit,
        timestamp: startDate
      });
    } else if (type === 'HKQuantityTypeIdentifierOxygenSaturation') {
      healthData.bloodOxygen.push({
        percentage: value * 100,
        timestamp: startDate
      });
    } else if (type === 'HKQuantityTypeIdentifierBodyMass') {
      healthData.weight.push({
        kg: unit === 'kg' ? value : value * 0.453592,
        timestamp: startDate
      });
    } else if (type === 'HKQuantityTypeIdentifierActiveEnergyBurned') {
      healthData.activeEnergy.push({
        calories: value,
        date: startDate.split('T')[0]
      });
    }
  });
  
  return healthData;
}

function calculateDuration(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate - startDate) / (1000 * 60 * 60); // hours
}

// Aggregate sleep data into daily summaries
export function aggregateSleepData(sleepRecords) {
  const dailySleep = {};
  
  sleepRecords.forEach(record => {
    const date = record.startDate.split('T')[0];
    if (!dailySleep[date]) {
      dailySleep[date] = {
        date,
        totalDuration: 0,
        deepSleep: 0,
        remSleep: 0,
        lightSleep: 0,
        awakenings: 0
      };
    }
    
    dailySleep[date].totalDuration += record.duration || 0;
    
    // Apple Health sleep stages
    if (record.stage === 'HKCategoryValueSleepAnalysisAsleepDeep') {
      dailySleep[date].deepSleep += record.duration || 0;
    } else if (record.stage === 'HKCategoryValueSleepAnalysisAsleepREM') {
      dailySleep[date].remSleep += record.duration || 0;
    } else if (record.stage === 'HKCategoryValueSleepAnalysisAsleepCore') {
      dailySleep[date].lightSleep += record.duration || 0;
    } else if (record.stage === 'HKCategoryValueSleepAnalysisAwake') {
      dailySleep[date].awakenings += 1;
    }
  });
  
  return Object.values(dailySleep).sort((a, b) => b.date.localeCompare(a.date));
}

// Aggregate step data into daily totals
export function aggregateStepData(stepRecords) {
  const dailySteps = {};
  
  stepRecords.forEach(record => {
    const date = record.date;
    if (!dailySteps[date]) {
      dailySteps[date] = { date, total: 0 };
    }
    dailySteps[date].total += record.count;
  });
  
  return Object.values(dailySteps).sort((a, b) => b.date.localeCompare(a.date));
}

// Get summary stats for display
export function getHealthDataSummary(healthData) {
  const summary = {
    sleep: {
      count: healthData.sleep?.length || 0,
      label: 'sleep records'
    },
    heart: {
      count: healthData.heart?.length || 0,
      label: 'heart rate readings'
    },
    steps: {
      count: healthData.steps?.length || 0,
      label: 'step entries'
    },
    hrv: {
      count: healthData.hrv?.length || 0,
      label: 'HRV readings'
    },
    bloodOxygen: {
      count: healthData.bloodOxygen?.length || 0,
      label: 'SpO2 readings'
    },
    weight: {
      count: healthData.weight?.length || 0,
      label: 'weight entries'
    },
    activeEnergy: {
      count: healthData.activeEnergy?.length || 0,
      label: 'activity records'
    },
    total: 0
  };
  
  summary.total = Object.values(summary)
    .filter(v => typeof v === 'object')
    .reduce((acc, v) => acc + v.count, 0);
  
  return summary;
}

// Generate sample health data for testing
export function generateSampleHealthData() {
  const sleep = [];
  const heart = [];
  const steps = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  // 30 days of sleep
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    sleep.push({
      date: date.toISOString().split('T')[0],
      duration: 6 + Math.random() * 3,
      quality: 60 + Math.floor(Math.random() * 35),
      deep: 0.5 + Math.random() * 2,
      rem: 1 + Math.random() * 1.5,
      light: 3 + Math.random() * 2,
      awakenings: Math.floor(Math.random() * 5)
    });
  }
  
  // 100 heart rate readings
  for (let i = 0; i < 100; i++) {
    const date = new Date(startDate);
    date.setHours(date.getHours() + i * 7);
    const contexts = ['resting', 'walking', 'exercise', 'sleeping'];
    const context = contexts[Math.floor(Math.random() * contexts.length)];
    let bpm;
    switch(context) {
      case 'resting': bpm = 60 + Math.floor(Math.random() * 20); break;
      case 'walking': bpm = 80 + Math.floor(Math.random() * 30); break;
      case 'exercise': bpm = 120 + Math.floor(Math.random() * 60); break;
      case 'sleeping': bpm = 50 + Math.floor(Math.random() * 15); break;
    }
    heart.push({
      timestamp: date.toISOString(),
      bpm,
      context,
      variability: 20 + Math.floor(Math.random() * 40)
    });
  }
  
  // 30 days of steps
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    steps.push({
      date: date.toISOString().split('T')[0],
      total: 3000 + Math.floor(Math.random() * 12000)
    });
  }
  
  return {
    sleep,
    heart,
    steps,
    metadata: {
      exportDate: new Date().toISOString(),
      recordCount: sleep.length + heart.length + steps.length,
      source: 'sample'
    }
  };
}
