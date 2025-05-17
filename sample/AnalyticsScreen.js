import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const { stats, subjects } = useContext(AppContext);
  
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
          legendFontColor: '#7F7F7F',
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
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    });
  }
  
  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
        </View>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Ionicons name="time-outline" size={24} color="#6C63FF" />
            <Text style={styles.summaryValue}>{stats.totalStudyTime} min</Text>
            <Text style={styles.summaryLabel}>Total Study Time</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#6C63FF" />
            <Text style={styles.summaryValue}>{stats.tasksCompleted}</Text>
            <Text style={styles.summaryLabel}>Tasks Completed</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Ionicons name="timer-outline" size={24} color="#6C63FF" />
            <Text style={styles.summaryValue}>{stats.sessionsCompleted}</Text>
            <Text style={styles.summaryLabel}>Focus Sessions</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Study Time</Text>
          <Text style={styles.sectionSubtitle}>Minutes studied each day of the week</Text>
          
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
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Distribution</Text>
          <Text style={styles.sectionSubtitle}>Time spent on each subject</Text>
          
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
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productivity by Time of Day</Text>
          <Text style={styles.sectionSubtitle}>When you're most productive</Text>
          
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
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          
          <View style={styles.insightCard}>
            <Ionicons name="bulb-outline" size={24} color="#FFC107" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Best Study Time</Text>
              <Text style={styles.insightText}>
                {hourlyData.indexOf(Math.max(...hourlyData)) * 3}:00 - {hourlyData.indexOf(Math.max(...hourlyData)) * 3 + 3}:00 is your most productive time.
              </Text>
            </View>
          </View>
          
          <View style={styles.insightCard}>
            <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Most Productive Day</Text>
              <Text style={styles.insightText}>
                {weeklyData.labels[stats.weeklyStudyTime.indexOf(Math.max(...stats.weeklyStudyTime))]} is your most productive day of the week.
              </Text>
            </View>
          </View>
          
          {subjectData.length > 1 && (
            <View style={styles.insightCard}>
              <Ionicons name="book-outline" size={24} color="#2196F3" />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Focus Distribution</Text>
                <Text style={styles.insightText}>
                  You spend most of your time studying {subjectData.sort((a, b) => b.minutes - a.minutes)[0].name}.
                </Text>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={16} color="#666" />
          <Text style={styles.privacyText}>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
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
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
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
    color: '#333',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
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
    color: '#666',
    marginLeft: 8,
  },
});

export default AnalyticsScreen;