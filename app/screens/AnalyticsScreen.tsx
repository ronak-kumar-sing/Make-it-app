import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  // Add safe defaults to prevent undefined errors
  const context = useContext(AppContext);
  const stats = context?.stats || {
    totalStudyTime: 0,
    dailyAverage: 0,
    tasksCompleted: 0,
    tasksCreated: 0,
    pomodoroCompleted: 0,
    goalProgress: { weeklyStudyTime: 0, weeklyTasksCompleted: 0 },
    subjectDistribution: {},
    productivityByHour: {},
    sessionsCompleted: 0,
  };
  const subjects = context?.subjects || [];
  const { theme } = useTheme();

  // Prepare data for weekly study time chart
  const weeklyStudyTime = (stats as any).weeklyStudyTime || [0, 0, 0, 0, 0, 0, 0];
  const weeklyData = {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        data: weeklyStudyTime,
      },
    ],
  };

  // Prepare data for productivity by hour chart
  const hourlyLabels = [];
  const hourlyData = [];
  const productivityByHour = stats.productivityByHour || {};
  for (let i = 0; i < 24; i += 3) {
    hourlyLabels.push(`${i}:00`);
    const hourSum = (productivityByHour[i] || 0) +
      (productivityByHour[i + 1] || 0) +
      (productivityByHour[i + 2] || 0);
    hourlyData.push(hourSum);
  }

  const productivityData = {
    labels: hourlyLabels,
    datasets: [
      {
        data: hourlyData,
      },
    ],
  };

  // Prepare data for subject distribution pie chart
  const subjectData = [];
  const subjectColors = [];
  const subjectDistribution = stats.subjectDistribution || {};
  if (subjectDistribution) {
    Object.keys(subjectDistribution).forEach(subjectName => {
      const minutes = subjectDistribution[subjectName] || 0;
      if (minutes > 0) {
        subjectData.push({
          name: subjectName,
          minutes,
          color: subjects.find(s => s.name === subjectName)?.color || '#607D8B',
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        });
        subjectColors.push(subjects.find(s => s.name === subjectName)?.color || '#607D8B');
      }
    });
  }
  // If no subject data, add placeholder
  if (subjectData.length === 0) {
    subjectData.push({
      name: 'No Data',
      minutes: 1,
      color: '#CCCCCC',
      legendFontColor: theme.textSecondary,
      legendFontSize: 12,
    });
  }

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: () => theme.textSecondary,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
        </View>
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Ionicons name="time-outline" size={24} color={theme.primary} />
            <Text style={[styles.summaryValue, { color: theme.text }]}>{(stats.totalStudyTime / 60).toFixed(1)} hrs</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Study Time</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color={theme.primary} />
            <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.tasksCompleted}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Tasks Completed</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Ionicons name="timer-outline" size={24} color={theme.primary} />
            <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.sessionsCompleted}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Focus Sessions</Text>
          </View>
        </View>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly Study Time</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Hours studied each day of the week</Text>
          <BarChart
            data={weeklyData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            fromZero={true}
            yAxisLabel={''}
            yAxisSuffix={'h'}
          />
        </View>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Subject Distribution</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Time spent on each subject</Text>
          <PieChart
            data={subjectData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="minutes"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
            style={styles.chart}
          />
        </View>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Productivity by Time of Day</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>When you're most productive</Text>
          <BarChart
            data={productivityData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            fromZero={true}
            yAxisLabel={''}
            yAxisSuffix={'m'}
          />
        </View>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Insights</Text>
          <View style={[styles.insightCard, { backgroundColor: theme.background }]}>
            <Ionicons name="bulb-outline" size={24} color="#FFC107" />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.text }]}>Best Study Time</Text>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                {hourlyData.length > 0 ? `${hourlyData.indexOf(Math.max(...hourlyData)) * 3}:00 - ${hourlyData.indexOf(Math.max(...hourlyData)) * 3 + 3}:00 is your most productive time.` : 'No data.'}
              </Text>
            </View>
          </View>
          <View style={[styles.insightCard, { backgroundColor: theme.background }]}>
            <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.text }]}>Most Productive Day</Text>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                {weeklyData.labels && weeklyStudyTime && weeklyStudyTime.length > 0 ? `${weeklyData.labels[weeklyStudyTime.indexOf(Math.max(...weeklyStudyTime))]} is your most productive day of the week.` : 'No data.'}
              </Text>
            </View>
          </View>
          {subjectData.length > 1 && (
            <View style={[styles.insightCard, { backgroundColor: theme.background }]}>
              <Ionicons name="book-outline" size={24} color="#2196F3" />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: theme.text }]}>Focus Distribution</Text>
                <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                  You spend most of your time studying {subjectData.sort((a, b) => b.minutes - a.minutes)[0].name}.
                </Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
            All analytics are calculated locally on your device and are never shared.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '31%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  insightCard: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  insightContent: {
    marginLeft: 16,
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 12,
    marginLeft: 8,
  },
});

export default AnalyticsScreen;