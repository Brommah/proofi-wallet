/**
 * Proofi Data Scope Definitions
 * Defines available data categories for user selection.
 */

export const HEALTH_SCOPES = {
  'health/steps': {
    label: 'Steps',
    icon: '👣',
    description: 'Daily step count',
    hkTypes: ['HKQuantityTypeIdentifierStepCount'],
    defaultEnabled: true,
  },
  'health/heart-rate': {
    label: 'Heart Rate',
    icon: '❤️',
    description: 'Heart rate measurements',
    hkTypes: ['HKQuantityTypeIdentifierHeartRate'],
    defaultEnabled: true,
  },
  'health/hrv': {
    label: 'HRV',
    icon: '📈',
    description: 'Heart rate variability',
    hkTypes: ['HKQuantityTypeIdentifierHeartRateVariabilitySDNN'],
    defaultEnabled: false,
  },
  'health/sleep': {
    label: 'Sleep',
    icon: '😴',
    description: 'Sleep analysis',
    hkTypes: ['HKCategoryTypeIdentifierSleepAnalysis'],
    defaultEnabled: true,
  },
  'health/spo2': {
    label: 'Blood Oxygen',
    icon: '🫁',
    description: 'Oxygen saturation',
    hkTypes: ['HKQuantityTypeIdentifierOxygenSaturation'],
    defaultEnabled: false,
  },
  'health/workouts': {
    label: 'Workouts',
    icon: '🏋️',
    description: 'Exercise sessions',
    hkTypes: ['HKWorkout'],
    defaultEnabled: true,
  },
  'health/nutrition': {
    label: 'Nutrition',
    icon: '🍎',
    description: 'Dietary intake',
    hkTypes: [
      'HKQuantityTypeIdentifierDietaryEnergyConsumed',
      'HKQuantityTypeIdentifierDietaryProtein',
      'HKQuantityTypeIdentifierDietaryCarbohydrates',
      'HKQuantityTypeIdentifierDietaryFatTotal',
    ],
    defaultEnabled: false,
  },
  'health/respiratory': {
    label: 'Respiratory',
    icon: '🌬️',
    description: 'Respiratory rate',
    hkTypes: ['HKQuantityTypeIdentifierRespiratoryRate'],
    defaultEnabled: false,
  },
  'health/body': {
    label: 'Body Metrics',
    icon: '⚖️',
    description: 'Weight, height, BMI',
    hkTypes: [
      'HKQuantityTypeIdentifierBodyMass',
      'HKQuantityTypeIdentifierHeight',
      'HKQuantityTypeIdentifierBodyMassIndex',
    ],
    defaultEnabled: false,
  },
};

/**
 * Get all HK types for a set of scope keys.
 */
export function getHKTypesForScopes(scopeKeys) {
  const types = new Set();
  for (const key of scopeKeys) {
    const scope = HEALTH_SCOPES[key];
    if (scope) {
      scope.hkTypes.forEach(t => types.add(t));
    }
  }
  return Array.from(types);
}

/**
 * Get default enabled scopes.
 */
export function getDefaultScopes() {
  return Object.entries(HEALTH_SCOPES)
    .filter(([_, s]) => s.defaultEnabled)
    .map(([key, _]) => key);
}

/**
 * Storage helpers for user scope preferences.
 */
export async function loadUserScopes() {
  return new Promise((resolve) => {
    chrome.storage.local.get('proofi_user_scopes', (result) => {
      resolve(result.proofi_user_scopes || getDefaultScopes());
    });
  });
}

export async function saveUserScopes(scopeKeys) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ proofi_user_scopes: scopeKeys }, resolve);
  });
}
