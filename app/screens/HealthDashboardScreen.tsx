/**
 * HealthDashboardScreen.tsx
 *
 * Main screen for health tracking features, including:
 * - Activity & Exercise tracking
 * - Sleep monitoring
 * - Mental wellbeing tracking
 * - Hydration & Nutrition tracking
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

import * as CorrelationService from '../services/CorrelationService';
import * as HealthTrackingService from '../services/HealthTrackingService';
import { FoodCategory, FoodItem, indianFoods } from '../services/IndianFoodsDatabase';

// Get screen width
const screenWidth = Dimensions.get('window').width;

interface TrackerTabProps {
  title: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
  theme: any;
}

const TrackerTab = ({ title, icon, isActive, onPress, theme }: TrackerTabProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        {
          backgroundColor: isActive ? theme.primary : 'transparent',
          borderColor: theme.primary,
        },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isActive ? theme.cardLight : theme.primary}
      />
      <Text
        style={[
          styles.tabText,
          {
            color: isActive ? theme.cardLight : theme.primary,
            marginLeft: 6,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default function HealthDashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'activity' | 'sleep' | 'mood' | 'nutrition'>('activity');
  const [loading, setLoading] = useState(true);
  const [healthSummary, setHealthSummary] = useState<HealthTrackingService.HealthSummary | null>(null);
  const [insights, setInsights] = useState<HealthTrackingService.HealthInsight[]>([]);
  const [correlations, setCorrelations] = useState<any[]>([]);

  // Activity data
  const [stepData, setStepData] = useState<{ date: string, steps: number }[]>([]);

  // Sleep data
  const [sleepData, setSleepData] = useState<{ date: string, quality: number }[]>([]);

  // Mood data
  const [moodData, setMoodData] = useState<{ date: string, mood: string, stressLevel: number }[]>([]);

  // Nutrition data
  const [waterData, setWaterData] = useState<{ date: string, waterIntake: number }[]>([]);
  const [suggestedFoods, setSuggestedFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    loadHealthData();
    loadCorrelationInsights();
  }, []);

  const loadCorrelationInsights = async () => {
    try {
      // Get the last 30 days of data
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      // Create sample study metrics for development
      const studyMetrics = [];

      // Generate sample data for each day
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        studyMetrics.push({
          date: dateStr,
          studyMinutes: Math.floor(Math.random() * 180) + 30, // 30-210 min
          focusPercentage: Math.floor(Math.random() * 40) + 60, // 60-100%
          tasksCompleted: Math.floor(Math.random() * 5) + 1, // 1-5 tasks
          studyEfficiency: Math.floor(Math.random() * 50) + 50 // 50-100%
        });
      }

      // Get correlations between health and study performance
      const correlationResults = await CorrelationService.getAllCorrelations(
        studyMetrics,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      setCorrelations(correlationResults);

      // Generate recommendations
      const recommendations = CorrelationService.getHealthRecommendations(correlationResults);

      // Convert recommendations to insights format
      const correlationInsights = recommendations.map((rec, index) => ({
        id: `corr-${index}`,
        type: 'general' as any,
        title: 'Study-Health Correlation',
        description: rec,
        actionable: 'Review your health and study patterns in the Insights tab',
        priority: 'medium' as any
      }));

      // Add these insights to the regular ones
      setInsights(prevInsights => [...correlationInsights, ...prevInsights]);

    } catch (error) {
      console.error('Error loading correlation insights:', error);
    }
  };

  const loadHealthData = async () => {
    setLoading(true);
    try {
      // Load health summary
      const summary = await HealthTrackingService.getHealthSummary(7);
      setHealthSummary(summary);

      // Load insights
      const healthInsights = await HealthTrackingService.getHealthInsights();
      setInsights(healthInsights);

      // Load activity data
      const steps = await HealthTrackingService.getStepsTrend(7);
      setStepData(steps);

      // Load sleep data
      const sleep = await HealthTrackingService.getSleepQualityTrend(7);
      setSleepData(sleep);

      // Load mood data
      const mood = await HealthTrackingService.getMoodTrend(7);
      setMoodData(mood);

      // Load nutrition data
      const water = await HealthTrackingService.getWaterIntakeTrend(7);
      setWaterData(water);

      // Get food suggestions
      getSuggestedFoods();

    } catch (error) {
      console.error('Error loading health data:', error);
      Alert.alert('Error', 'Failed to load health data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedFoods = () => {
    // Get a mix of foods from different categories
    const grains = indianFoods.filter(food => food.category === FoodCategory.GRAINS_AND_BREADS).slice(0, 2);
    const proteins = indianFoods.filter(food => food.category === FoodCategory.PROTEIN_SOURCES).slice(0, 2);
    const vegetables = indianFoods.filter(food => food.category === FoodCategory.VEGETABLE_DISHES).slice(0, 2);

    setSuggestedFoods([...grains, ...proteins, ...vegetables]);
  };

  const renderInsightCard = (insight: HealthTrackingService.HealthInsight) => {
    const iconMap = {
      activity: 'walk-outline',
      sleep: 'moon-outline',
      mood: 'happy-outline',
      nutrition: 'water-outline'
    };

    const colorMap = {
      high: theme.danger,
      medium: theme.warning,
      low: theme.success
    };

    return (
      <View
        key={insight.title}
        style={[
          styles.insightCard,
          {
            backgroundColor: theme.card,
            borderLeftColor: colorMap[insight.priority],
            borderLeftWidth: 4
          }
        ]}
      >
        <View style={styles.insightHeader}>
          <Ionicons name={iconMap[insight.type]} size={24} color={theme.primary} />
          <Text style={[styles.insightTitle, { color: theme.text }]}>
            {insight.title}
          </Text>
        </View>
        <Text style={[styles.insightDescription, { color: theme.textSecondary }]}>
          {insight.description}
        </Text>
        <Text style={[styles.insightAction, { color: theme.primary }]}>
          TIP: {insight.actionable}
        </Text>
      </View>
    );
  };

  const renderActivityTab = () => {
    if (stepData.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="walk" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            No activity data recorded yet.
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('ActivityTracker')}
          >
            <Text style={styles.addButtonText}>Record Activity</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const chartData = {
      labels: stepData.map(d => d.date.split('-')[2]), // Just get the day
      datasets: [
        {
          data: stepData.map(d => d.steps),
          color: () => theme.primary,
          strokeWidth: 2
        }
      ],
      legend: ['Daily Steps']
    };

    return (
      <View style={styles.tabContent}>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Activity Summary
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {healthSummary?.activityAverageSteps.toFixed(0) || '0'}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Daily Steps
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <View style={styles.badgeContainer}>
                {healthSummary && healthSummary.activityAverageSteps > 7500 ? (
                  <View style={[styles.badge, { backgroundColor: theme.success }]}>
                    <Text style={styles.badgeText}>Good</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: theme.warning }]}>
                    <Text style={styles.badgeText}>Needs Improvement</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Status</Text>
            </View>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>7-Day Step History</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              decimalPlaces: 0,
              color: () => theme.primary,
              labelColor: () => theme.textSecondary,
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: theme.primary
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={[styles.actionCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.actionCardTitle, { color: theme.text }]}>Activity Tips</Text>
          <View style={styles.actionItem}>
            <Ionicons name="time-outline" size={24} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>
              Take a 5-minute movement break for every 25 minutes of study
            </Text>
          </View>
          <View style={styles.actionItem}>
            <Ionicons name="footsteps-outline" size={24} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>
              Aim for 7,500-10,000 steps daily for optimal cognitive benefits
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('ActivityTracker')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.recordButtonText}>Record Activity</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSleepTab = () => {
    if (sleepData.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="moon" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            No sleep data recorded yet.
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('SleepTracker')}
          >
            <Text style={styles.addButtonText}>Record Sleep</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const chartData = {
      labels: sleepData.map(d => d.date.split('-')[2]), // Just get the day
      datasets: [
        {
          data: sleepData.map(d => d.quality),
          color: () => theme.primary,
          strokeWidth: 2
        }
      ],
      legend: ['Sleep Quality (1-5)']
    };

    return (
      <View style={styles.tabContent}>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Sleep Summary
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {(healthSummary?.sleepAverageDuration / 60).toFixed(1) || '0'} hrs
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Daily Average
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {healthSummary?.sleepAverageQuality.toFixed(1) || '0'}/5
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Average Quality
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>7-Day Sleep Quality</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              decimalPlaces: 1,
              color: () => theme.primary,
              labelColor: () => theme.textSecondary,
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: theme.primary
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={[styles.actionCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.actionCardTitle, { color: theme.text }]}>Sleep Tips</Text>
          <View style={styles.actionItem}>
            <Ionicons name="phone-off-outline" size={24} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>
              Avoid screens for at least 30 minutes before bedtime
            </Text>
          </View>
          <View style={styles.actionItem}>
            <Ionicons name="time-outline" size={24} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>
              Maintain a consistent sleep schedule, even on weekends
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('SleepTracker')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.recordButtonText}>Record Sleep</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMoodTab = () => {
    if (moodData.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="happy" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            No mood data recorded yet.
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('MoodTracker')}
          >
            <Text style={styles.addButtonText}>Record Mood</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Convert mood to numerical value for charting
    const moodToNumber = (mood: string): number => {
      const moodMap = {
        'terrible': 1,
        'bad': 2,
        'neutral': 3,
        'good': 4,
        'excellent': 5
      };
      return moodMap[mood] || 3;
    };

    const chartData = {
      labels: moodData.map(d => d.date.split('-')[2]), // Just get the day
      datasets: [
        {
          data: moodData.map(d => moodToNumber(d.mood)),
          color: () => theme.primary,
          strokeWidth: 2
        },
        {
          data: moodData.map(d => d.stressLevel),
          color: () => theme.danger,
          strokeWidth: 2
        }
      ],
      legend: ['Mood (1-5)', 'Stress Level (1-5)']
    };

    return (
      <View style={styles.tabContent}>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Mental Wellbeing Summary
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {healthSummary?.moodAverage || 'neutral'}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Overall Mood
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {healthSummary?.stressAverage.toFixed(1) || '0'}/5
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Stress Level
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>7-Day Mood & Stress</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.primary,
              labelColor: () => theme.textSecondary,
              propsForDots: {
                r: '5',
                strokeWidth: '1',
                stroke: theme.card
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={[styles.actionCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.actionCardTitle, { color: theme.text }]}>Mindfulness Tips</Text>
          <View style={styles.actionItem}>
            <Ionicons name="medkit-outline" size={24} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>
              Try 2-minute deep breathing exercises between intense study sessions
            </Text>
          </View>
          <View style={styles.actionItem}>
            <Ionicons name="walk-outline" size={24} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>
              A short walk outside can significantly reduce stress levels
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('MoodTracker')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.recordButtonText}>Record Mood</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNutritionTab = () => {
    if (waterData.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="nutrition" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            No nutrition data recorded yet.
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('NutritionTracker')}
          >
            <Text style={styles.addButtonText}>Record Nutrition</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const chartData = {
      labels: waterData.map(d => d.date.split('-')[2]), // Just get the day
      datasets: [
        {
          data: waterData.map(d => d.waterIntake / 1000), // convert to liters
          color: () => theme.primary,
        }
      ],
      legend: ['Water Intake (L)']
    };

    return (
      <View style={styles.tabContent}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('HydrationTracker')}
          >
            <Ionicons name="water-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Track Hydration</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('NutritionTracker')}
          >
            <Ionicons name="restaurant-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Track Meals</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Hydration & Nutrition Summary
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {(healthSummary?.hydrationAverage / 1000).toFixed(1) || '0'}L
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Daily Water
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <View style={styles.badgeContainer}>
                {healthSummary && healthSummary.hydrationAverage > 2000 ? (
                  <View style={[styles.badge, { backgroundColor: theme.success }]}>
                    <Text style={styles.badgeText}>Good</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: theme.warning }]}>
                    <Text style={styles.badgeText}>Needs Improvement</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Status</Text>
            </View>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>7-Day Hydration</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix="L"
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              decimalPlaces: 1,
              color: () => theme.primary,
              labelColor: () => theme.textSecondary,
            }}
            style={styles.chart}
          />
        </View>

        <View style={[styles.foodSection, { backgroundColor: theme.card }]}>
          <Text style={[styles.foodSectionTitle, { color: theme.text }]}>
            Recommended Indian Foods for Brain Health
          </Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.foodList}
            data={suggestedFoods}
            keyExtractor={(item) => item.id}
            renderItem={({ item: food }) => (
              <TouchableOpacity
                style={[styles.foodCard, { backgroundColor: theme.cardLight }]}
                onPress={() => Alert.alert(food.name, `${food.description}\n\nHealth Benefits: ${food.healthBenefits.join(", ")}\n\nServing Size: ${food.servingSize}`)}
              >
                <Text style={[styles.foodName, { color: theme.text }]}>{food.name}</Text>
                <Text
                  style={[styles.foodDesc, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {food.description}
                </Text>
                <View style={styles.foodBenefits}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text style={[styles.foodBenefitText, { color: theme.textSecondary }]}>
                    {food.healthBenefits[0]}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('NutritionTracker')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.recordButtonText}>Record Nutrition</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'activity':
        return renderActivityTab();
      case 'sleep':
        return renderSleepTab();
      case 'mood':
        return renderMoodTab();
      case 'nutrition':
        return renderNutritionTab();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading health data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Health & Wellness</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Track and optimize your wellbeing for better learning
        </Text>
      </View>

      {insights.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Personalized Insights
          </Text>
          {insights.slice(0, 2).map(insight => renderInsightCard(insight))}

          {insights.length > 2 && (
            <TouchableOpacity
              style={[styles.viewMoreButton, { borderColor: theme.primary }]}
              onPress={() => navigation.navigate('ActivityHistory', { tab: 'Insights' })}
            >
              <Text style={[styles.viewMoreText, { color: theme.primary }]}>
                View {insights.length - 2} More Insights
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.tabs}>
        <TrackerTab
          title="Activity"
          icon="walk-outline"
          isActive={activeTab === 'activity'}
          onPress={() => setActiveTab('activity')}
          theme={theme}
        />
        <TrackerTab
          title="Sleep"
          icon="moon-outline"
          isActive={activeTab === 'sleep'}
          onPress={() => setActiveTab('sleep')}
          theme={theme}
        />
        <TrackerTab
          title="Mood"
          icon="happy-outline"
          isActive={activeTab === 'mood'}
          onPress={() => setActiveTab('mood')}
          theme={theme}
        />
        <TrackerTab
          title="Nutrition"
          icon="nutrition-outline"
          isActive={activeTab === 'nutrition'}
          onPress={() => setActiveTab('nutrition')}
          theme={theme}
        />
      </View>

      {renderActiveTabContent()}

      {/* View All Health Data button */}
      <TouchableOpacity
        style={[styles.viewAllDataButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('ActivityHistory', { tab: activeTab })}
      >
        <Ionicons name="analytics-outline" size={20} color="#fff" />
        <Text style={styles.viewAllDataButtonText}>View All Health Data</Text>
      </TouchableOpacity>

      {/* Bottom space buffer */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  insightsContainer: {
    marginBottom: 16,
  },
  insightCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  insightDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  insightAction: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#ddd',
  },
  badgeContainer: {
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  actionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  viewAllDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 8,
  },
  viewAllDataButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  foodSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  foodList: {
    marginBottom: 8,
  },
  foodCard: {
    width: 180,
    padding: 12,
    marginRight: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  foodDesc: {
    fontSize: 12,
    marginBottom: 8,
  },
  foodBenefits: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodBenefitText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
});