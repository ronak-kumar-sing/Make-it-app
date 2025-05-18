/**
 * CorrelationService.ts
 *
 * Service for analyzing correlations between health metrics and study performance
 */

import * as HealthTrackingService from './HealthTrackingService';

export interface StudyMetric {
  date: string;
  studyMinutes: number;
  focusPercentage?: number;
  tasksCompleted?: number;
  studyEfficiency?: number; // A calculated value combining focus and productivity
}

export interface CorrelationResult {
  metric: string;
  correlation: number; // -1 to 1 where 1 is perfect positive correlation
  significance: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * Calculate the Pearson correlation coefficient between two arrays
 * @param x First array of numeric values
 * @param y Second array of numeric values (same length as x)
 * @returns Correlation coefficient between -1 and 1
 */
const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  // Calculate sum of each array
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);

  // Calculate sum of squares
  const sumXSq = x.reduce((a, b) => a + b * b, 0);
  const sumYSq = y.reduce((a, b) => a + b * b, 0);

  // Calculate sum of products
  let sumXY = 0;
  for (let i = 0; i < n; i++) {
    sumXY += x[i] * y[i];
  }

  // Calculate Pearson's correlation
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXSq - sumX * sumX) * (n * sumYSq - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
};

/**
 * Get the significance level of a correlation
 * @param correlation Correlation coefficient between -1 and 1
 * @returns Significance level as 'low', 'medium', or 'high'
 */
const getSignificance = (correlation: number): 'low' | 'medium' | 'high' => {
  const absCorr = Math.abs(correlation);
  if (absCorr < 0.3) return 'low';
  if (absCorr < 0.7) return 'medium';
  return 'high';
};

/**
 * Get a description of the correlation between two metrics
 * @param metric The health metric being correlated with study performance
 * @param correlation The correlation coefficient
 * @returns A user-friendly description of the correlation
 */
const getCorrelationDescription = (metric: string, correlation: number): string => {
  if (Math.abs(correlation) < 0.2) {
    return `No significant relationship found between your ${metric} and study performance.`;
  }

  const direction = correlation > 0 ? 'positive' : 'negative';
  const strength = Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.3 ? 'moderate' : 'mild';

  switch (metric) {
    case 'sleep duration':
      return correlation > 0
        ? `There appears to be a ${strength} connection between more sleep and better study performance.`
        : `Interestingly, you seem to study more effectively with less sleep.`;

    case 'sleep quality':
      return correlation > 0
        ? `Better sleep quality shows a ${strength} correlation with improved study performance.`
        : `Unexpectedly, your study performance doesn't seem to benefit from better sleep quality.`;

    case 'hydration':
      return correlation > 0
        ? `Staying well-hydrated shows a ${strength} correlation with better study sessions.`
        : `Your hydration patterns don't show a clear benefit to your study performance.`;

    case 'physical activity':
      return correlation > 0
        ? `Your activity levels have a ${strength} ${direction} relationship with study effectiveness.`
        : `More physical activity seems to be associated with decreased study performance.`;

    case 'mood':
      return correlation > 0
        ? `Better mood states have a ${strength} relationship with improved study outcomes.`
        : `Your mood doesn't appear to significantly influence your study performance.`;

    default:
      return `There is a ${strength} ${direction} correlation between ${metric} and your study performance.`;
  }
};

/**
 * Analyze correlation between sleep metrics and study performance
 * @param studyData Array of study performance metrics
 * @param startDate Start date for the analysis period (ISO string)
 * @param endDate End date for the analysis period (ISO string)
 * @returns Correlation result for sleep metrics
 */
export const analyzeSleepCorrelation = async (
  studyData: StudyMetric[],
  startDate: string,
  endDate: string
): Promise<CorrelationResult[]> => {
  const sleepEntries = await HealthTrackingService.getSleepEntries(startDate, endDate);
  if (sleepEntries.length === 0 || studyData.length === 0) {
    return [];
  }

  // Create a map of dates to study data
  const studyMap = new Map<string, StudyMetric>();
  studyData.forEach(day => {
    studyMap.set(day.date.split('T')[0], day);
  });

  // Create arrays for correlation calculation
  const durationData: { sleep: number; study: number }[] = [];
  const qualityData: { quality: number; study: number }[] = [];

  sleepEntries.forEach(sleep => {
    const sleepDate = sleep.date.split('T')[0];
    const studyEntry = studyMap.get(sleepDate);

    if (studyEntry) {
      durationData.push({
        sleep: sleep.duration,
        study: studyEntry.studyEfficiency || studyEntry.studyMinutes
      });

      qualityData.push({
        quality: sleep.quality,
        study: studyEntry.studyEfficiency || studyEntry.studyMinutes
      });
    }
  });

  const results: CorrelationResult[] = [];

  if (durationData.length > 3) {
    const sleepDurationValues = durationData.map(d => d.sleep);
    const studyDurationValues = durationData.map(d => d.study);

    const durationCorrelation = calculateCorrelation(sleepDurationValues, studyDurationValues);

    results.push({
      metric: 'sleep duration',
      correlation: durationCorrelation,
      significance: getSignificance(durationCorrelation),
      description: getCorrelationDescription('sleep duration', durationCorrelation)
    });
  }

  if (qualityData.length > 3) {
    const sleepQualityValues = qualityData.map(d => d.quality);
    const studyQualityValues = qualityData.map(d => d.study);

    const qualityCorrelation = calculateCorrelation(sleepQualityValues, studyQualityValues);

    results.push({
      metric: 'sleep quality',
      correlation: qualityCorrelation,
      significance: getSignificance(qualityCorrelation),
      description: getCorrelationDescription('sleep quality', qualityCorrelation)
    });
  }

  return results;
};

/**
 * Analyze correlation between activity metrics and study performance
 * @param studyData Array of study performance metrics
 * @param startDate Start date for the analysis period (ISO string)
 * @param endDate End date for the analysis period (ISO string)
 * @returns Correlation result for activity metrics
 */
export const analyzeActivityCorrelation = async (
  studyData: StudyMetric[],
  startDate: string,
  endDate: string
): Promise<CorrelationResult[]> => {
  const activityEntries = await HealthTrackingService.getActivityEntries(startDate, endDate);
  if (activityEntries.length === 0 || studyData.length === 0) {
    return [];
  }

  // Create a map of dates to study data
  const studyMap = new Map<string, StudyMetric>();
  studyData.forEach(day => {
    studyMap.set(day.date.split('T')[0], day);
  });

  // Create arrays for correlation calculation
  const stepsData: { steps: number; study: number }[] = [];
  const activeMinutesData: { active: number; study: number }[] = [];

  activityEntries.forEach(activity => {
    const activityDate = activity.date.split('T')[0];
    const studyEntry = studyMap.get(activityDate);

    if (studyEntry) {
      stepsData.push({
        steps: activity.steps,
        study: studyEntry.studyEfficiency || studyEntry.studyMinutes
      });

      activeMinutesData.push({
        active: activity.activeMinutes,
        study: studyEntry.studyEfficiency || studyEntry.studyMinutes
      });
    }
  });

  const results: CorrelationResult[] = [];

  if (stepsData.length > 3) {
    const stepsValues = stepsData.map(d => d.steps);
    const studyStepsValues = stepsData.map(d => d.study);

    const stepsCorrelation = calculateCorrelation(stepsValues, studyStepsValues);

    results.push({
      metric: 'daily steps',
      correlation: stepsCorrelation,
      significance: getSignificance(stepsCorrelation),
      description: getCorrelationDescription('physical activity', stepsCorrelation)
    });
  }

  if (activeMinutesData.length > 3) {
    const activeMinutesValues = activeMinutesData.map(d => d.active);
    const studyActiveValues = activeMinutesData.map(d => d.study);

    const activeCorrelation = calculateCorrelation(activeMinutesValues, studyActiveValues);

    results.push({
      metric: 'active minutes',
      correlation: activeCorrelation,
      significance: getSignificance(activeCorrelation),
      description: getCorrelationDescription('active minutes', activeCorrelation)
    });
  }

  return results;
};

/**
 * Analyze correlation between mood/stress metrics and study performance
 * @param studyData Array of study performance metrics
 * @param startDate Start date for the analysis period (ISO string)
 * @param endDate End date for the analysis period (ISO string)
 * @returns Correlation result for mood metrics
 */
export const analyzeMoodCorrelation = async (
  studyData: StudyMetric[],
  startDate: string,
  endDate: string
): Promise<CorrelationResult[]> => {
  const moodEntries = await HealthTrackingService.getMoodEntries(startDate, endDate);
  if (moodEntries.length === 0 || studyData.length === 0) {
    return [];
  }

  // Create a map of dates to study data
  const studyMap = new Map<string, StudyMetric>();
  studyData.forEach(day => {
    studyMap.set(day.date.split('T')[0], day);
  });

  // Convert mood to numeric values
  const moodToNumber = (mood: string): number => {
    switch (mood) {
      case 'terrible': return 1;
      case 'bad': return 2;
      case 'neutral': return 3;
      case 'good': return 4;
      case 'excellent': return 5;
      default: return 3;
    }
  };

  // Create arrays for correlation calculation
  const moodData: { mood: number; study: number }[] = [];
  const stressData: { stress: number; study: number }[] = [];

  // Aggregate mood entries by date (take average if multiple entries per day)
  const moodByDate = new Map<string, { moodSum: number; stressSum: number; count: number }>();

  moodEntries.forEach(entry => {
    const dateKey = entry.date.split('T')[0];
    const current = moodByDate.get(dateKey) || { moodSum: 0, stressSum: 0, count: 0 };

    moodByDate.set(dateKey, {
      moodSum: current.moodSum + moodToNumber(entry.mood),
      stressSum: current.stressSum + entry.stressLevel,
      count: current.count + 1
    });
  });

  // Calculate averages and prepare data for correlation
  moodByDate.forEach((value, dateKey) => {
    const studyEntry = studyMap.get(dateKey);

    if (studyEntry) {
      const avgMood = value.moodSum / value.count;
      const avgStress = value.stressSum / value.count;

      moodData.push({
        mood: avgMood,
        study: studyEntry.studyEfficiency || studyEntry.studyMinutes
      });

      stressData.push({
        stress: 6 - avgStress, // Invert scale so higher is better (less stress)
        study: studyEntry.studyEfficiency || studyEntry.studyMinutes
      });
    }
  });

  const results: CorrelationResult[] = [];

  if (moodData.length > 3) {
    const moodValues = moodData.map(d => d.mood);
    const studyMoodValues = moodData.map(d => d.study);

    const moodCorrelation = calculateCorrelation(moodValues, studyMoodValues);

    results.push({
      metric: 'mood',
      correlation: moodCorrelation,
      significance: getSignificance(moodCorrelation),
      description: getCorrelationDescription('mood', moodCorrelation)
    });
  }

  if (stressData.length > 3) {
    const stressValues = stressData.map(d => d.stress);
    const studyStressValues = stressData.map(d => d.study);

    const stressCorrelation = calculateCorrelation(stressValues, studyStressValues);

    results.push({
      metric: 'stress levels',
      correlation: stressCorrelation,
      significance: getSignificance(stressCorrelation),
      description: getCorrelationDescription('stress levels', stressCorrelation)
    });
  }

  return results;
};

/**
 * Analyze correlation between hydration and study performance
 * @param studyData Array of study performance metrics
 * @param startDate Start date for the analysis period (ISO string)
 * @param endDate End date for the analysis period (ISO string)
 * @returns Correlation result for hydration metrics
 */
export const analyzeHydrationCorrelation = async (
  studyData: StudyMetric[],
  startDate: string,
  endDate: string
): Promise<CorrelationResult[]> => {
  const nutritionEntries = await HealthTrackingService.getNutritionEntries(startDate, endDate);
  if (nutritionEntries.length === 0 || studyData.length === 0) {
    return [];
  }

  // Create a map of dates to study data
  const studyMap = new Map<string, StudyMetric>();
  studyData.forEach(day => {
    studyMap.set(day.date.split('T')[0], day);
  });

  // Aggregate water intake by date
  const waterByDate = new Map<string, number>();

  nutritionEntries.forEach(entry => {
    const dateKey = entry.date.split('T')[0];
    const currentWater = waterByDate.get(dateKey) || 0;
    waterByDate.set(dateKey, currentWater + entry.waterIntake);
  });

  // Prepare data for correlation
  const waterData: { water: number; study: number }[] = [];

  waterByDate.forEach((waterIntake, dateKey) => {
    const studyEntry = studyMap.get(dateKey);

    if (studyEntry) {
      waterData.push({
        water: waterIntake,
        study: studyEntry.studyEfficiency || studyEntry.studyMinutes
      });
    }
  });

  const results: CorrelationResult[] = [];

  if (waterData.length > 3) {
    const waterValues = waterData.map(d => d.water);
    const studyWaterValues = waterData.map(d => d.study);

    const waterCorrelation = calculateCorrelation(waterValues, studyWaterValues);

    results.push({
      metric: 'hydration',
      correlation: waterCorrelation,
      significance: getSignificance(waterCorrelation),
      description: getCorrelationDescription('hydration', waterCorrelation)
    });
  }

  return results;
};

/**
 * Get all health metrics correlations with study performance
 * @param studyData Array of study performance metrics
 * @param startDate Start date for the analysis period (ISO string)
 * @param endDate End date for the analysis period (ISO string)
 * @returns Array of all correlation results
 */
export const getAllCorrelations = async (
  studyData: StudyMetric[],
  startDate: string,
  endDate: string
): Promise<CorrelationResult[]> => {
  const sleepResults = await analyzeSleepCorrelation(studyData, startDate, endDate);
  const activityResults = await analyzeActivityCorrelation(studyData, startDate, endDate);
  const moodResults = await analyzeMoodCorrelation(studyData, startDate, endDate);
  const hydrationResults = await analyzeHydrationCorrelation(studyData, startDate, endDate);

  return [
    ...sleepResults,
    ...activityResults,
    ...moodResults,
    ...hydrationResults,
  ];
};

/**
 * Get personalized health recommendations based on correlations
 * @param correlations Array of correlation results
 * @returns Array of personalized recommendations
 */
export const getHealthRecommendations = (correlations: CorrelationResult[]): string[] => {
  const recommendations: string[] = [];

  // Find the strongest positive correlations
  const significantCorrelations = correlations
    .filter(c => c.significance !== 'low' && c.correlation > 0.3)
    .sort((a, b) => b.correlation - a.correlation);

  // Generate recommendations based on significant correlations
  significantCorrelations.forEach(correlation => {
    switch (correlation.metric) {
      case 'sleep duration':
        recommendations.push(
          'Try to maintain a consistent sleep schedule. Your data shows that adequate sleep is linked to better study performance.'
        );
        break;
      case 'sleep quality':
        recommendations.push(
          'Focus on improving your sleep quality by reducing screen time before bed and creating a comfortable sleep environment.'
        );
        break;
      case 'daily steps':
      case 'active minutes':
        recommendations.push(
          'Regular physical activity appears to benefit your study effectiveness. Consider incorporating movement breaks between study sessions.'
        );
        break;
      case 'mood':
        recommendations.push(
          'Your mood significantly impacts your study performance. Consider starting study sessions with a brief mindfulness exercise.'
        );
        break;
      case 'stress levels':
        recommendations.push(
          'Managing stress levels shows a strong correlation with your study effectiveness. Try stress-reduction techniques before difficult study sessions.'
        );
        break;
      case 'hydration':
        recommendations.push(
          'Staying well-hydrated appears to benefit your cognitive performance. Keep a water bottle handy during study sessions.'
        );
        break;
    }
  });

  // If no significant correlations, provide general advice
  if (recommendations.length === 0) {
    recommendations.push(
      'We don\'t have enough data yet to provide personalized recommendations. Continue tracking your health metrics alongside your study sessions.',
      'General research shows that adequate sleep, regular activity, stress management, and proper hydration all contribute to effective studying.'
    );
  }

  return recommendations;
};
