import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const { stats, subjects } = useContext(AppContext);
  const { theme } = useTheme();

  // Prepare data for weekly study time chart
  const weeklyData = {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        data: stats.weeklyStudyTime || [0, 0, 0, 0, 0, 0, 0],
      },
    ],
  };

  // Prepare data for productivity by hour chart
  const hourlyLabels = [];
  const hourlyData = [];

  for (let i = 0; i < 24; i += 3) {
    hourlyLabels.push(`${i}:00`);
    const hourSum = (stats.productivityByHour?.[i] || 0) +
                   (stats.productivityByHour?.[i+1] || 0) +
                   (stats.productivityByHour?.[i+2] || 0);
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

  if (stats.subjectDistribution) {
    Object.keys(stats.subjectDistribution).forEach(subjectName => {
      const minutes = stats.subjectDistribution[subjectName] || 0;
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
      color: theme.isDark ? '#555555' : '#CCCCCC',
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
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Insights</Text>

          <View style={[styles.insightCard, { backgroundColor: theme.background }]}>
            <Ionicons name="bulb-outline" size={24} color="#FFC107" />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.text }]}>Best Study Time</Text>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                {hourlyData.indexOf(Math.max(...hourlyData)) * 3}:00 - {hourlyData.indexOf(Math.max(...hourlyData)) * 3 + 3}:00 is your most productive time.
              </Text>
            </View>
          </View>

          <View style={[styles.insightCard, { backgroundColor: theme.background }]}>
            <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.text }]}>Most Productive Day</Text>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                {weeklyData.labels[stats.weeklyStudyTime.indexOf(Math.max(...stats.weeklyStudyTime))]} is your most productive day of the week.
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