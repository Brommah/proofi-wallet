/**
 * Health Data Scopes Definition
 * Shared between web, mobile, and CLI components
 */

export const HEALTH_SCOPES = [
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'Sleep duration, quality, and stages',
    icon: '🌙',
    sensitivity: 'low',
    category: 'recovery',
    sampleData: {
      duration: '7h 23m',
      quality: 'Good',
      deepSleep: '1h 45m',
      remSleep: '2h 10m'
    }
  },
  {
    id: 'steps',
    name: 'Steps',
    description: 'Daily step count and distance walked',
    icon: '👟',
    sensitivity: 'low',
    category: 'activity',
    sampleData: {
      daily: 8432,
      distance: '6.2 km',
      floors: 12
    }
  },
  {
    id: 'heart_rate',
    name: 'Heart Rate',
    description: 'Resting and active heart rate measurements',
    icon: '❤️',
    sensitivity: 'medium',
    category: 'vitals',
    sampleData: {
      resting: '62 bpm',
      average: '74 bpm',
      max: '142 bpm'
    }
  },
  {
    id: 'hrv',
    name: 'Heart Rate Variability',
    description: 'HRV measurements indicating recovery and stress',
    icon: '📈',
    sensitivity: 'medium',
    category: 'vitals',
    sampleData: {
      average: '45 ms',
      trend: 'Improving',
      lastNight: '52 ms'
    }
  },
  {
    id: 'workouts',
    name: 'Workouts',
    description: 'Exercise sessions, duration, and intensity',
    icon: '🏃',
    sensitivity: 'low',
    category: 'activity',
    sampleData: {
      thisWeek: 4,
      totalMinutes: 185,
      calories: 1240
    }
  },
  {
    id: 'body_mass',
    name: 'Body Mass',
    description: 'Weight and body composition data',
    icon: '⚖️',
    sensitivity: 'high',
    category: 'body',
    sampleData: {
      weight: '75.2 kg',
      bmi: 23.4,
      trend: 'Stable'
    }
  },
  {
    id: 'blood_oxygen',
    name: 'Blood Oxygen',
    description: 'SpO2 levels and oxygen saturation',
    icon: '🫁',
    sensitivity: 'medium',
    category: 'vitals',
    sampleData: {
      average: '98%',
      min: '95%',
      nightAvg: '97%'
    }
  },
  {
    id: 'respiratory_rate',
    name: 'Respiratory Rate',
    description: 'Breathing rate during rest and activity',
    icon: '💨',
    sensitivity: 'medium',
    category: 'vitals',
    sampleData: {
      resting: '14 br/min',
      sleeping: '12 br/min'
    }
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    description: 'Calorie intake and macronutrient tracking',
    icon: '🍎',
    sensitivity: 'medium',
    category: 'lifestyle',
    sampleData: {
      calories: 2150,
      protein: '95g',
      carbs: '240g'
    }
  },
  {
    id: 'menstrual',
    name: 'Menstrual Cycle',
    description: 'Cycle tracking and predictions',
    icon: '🩸',
    sensitivity: 'high',
    category: 'reproductive',
    sampleData: {
      cycleDay: 14,
      phase: 'Ovulation',
      predicted: 'May 28'
    }
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    description: 'Meditation and mindfulness sessions',
    icon: '🧘',
    sensitivity: 'low',
    category: 'mental',
    sampleData: {
      thisWeek: '45 min',
      streak: '7 days',
      sessions: 12
    }
  },
  {
    id: 'stress',
    name: 'Stress Levels',
    description: 'Stress indicators and recovery metrics',
    icon: '😰',
    sensitivity: 'high',
    category: 'mental',
    sampleData: {
      current: 'Moderate',
      weeklyAvg: 42,
      recoveryTime: '2.5h'
    }
  }
];

export const SENSITIVITY_LEVELS = {
  low: {
    label: 'Low',
    color: '#22c55e',
    bgColor: '#dcfce7',
    description: 'General fitness data'
  },
  medium: {
    label: 'Medium', 
    color: '#f59e0b',
    bgColor: '#fef3c7',
    description: 'Health indicators'
  },
  high: {
    label: 'High',
    color: '#ef4444',
    bgColor: '#fee2e2',
    description: 'Sensitive health data'
  }
};

export const CATEGORIES = {
  activity: { name: 'Activity', icon: '🏃' },
  vitals: { name: 'Vitals', icon: '❤️' },
  body: { name: 'Body', icon: '🧍' },
  recovery: { name: 'Recovery', icon: '😴' },
  lifestyle: { name: 'Lifestyle', icon: '🍽️' },
  mental: { name: 'Mental', icon: '🧠' },
  reproductive: { name: 'Reproductive', icon: '🩺' }
};

// Storage key for preferences
export const STORAGE_KEY = 'proofi_health_scopes';

// Helper to load saved preferences
export function loadPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Helper to save preferences
export function savePreferences(selectedScopes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      scopes: selectedScopes,
      updatedAt: new Date().toISOString()
    }));
    return true;
  } catch {
    return false;
  }
}
