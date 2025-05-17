import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StreakCalendar = ({ studyDays }) => {
  // Get current date
  const today = new Date();
  
  // Get current month and year
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get number of days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Create array of day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create array of days
  const days = [];
  
  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  // Function to check if a day has study activity
  const hasStudyActivity = (day) => {
    if (!day) return false;
    
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return studyDays[dateString] > 0;
  };
  
  // Function to get intensity level based on study minutes
  const getIntensityLevel = (day) => {
    if (!day) return 0;
    
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const minutes = studyDays[dateString] || 0;
    
    if (minutes === 0) return 0;
    if (minutes < 30) return 1;
    if (minutes < 60) return 2;
    if (minutes < 120) return 3;
    return 4;
  };
  
  // Function to get color based on intensity level
  const getColorForIntensity = (level) => {
    switch (level) {
      case 1:
        return '#E3F2FD';
      case 2:
        return '#BBDEFB';
      case 3:
        return '#90CAF9';
      case 4:
        return '#6C63FF';
      default:
        return 'transparent';
    }
  };
  
  // Get current month name
  const monthName = today.toLocaleString('default', { month: 'long' });
  
  return (
    <View style={styles.container}>
      <Text style={styles.monthTitle}>{monthName} {currentYear}</Text>
      
      <View style={styles.dayNamesContainer}>
        {dayNames.map((name, index) => (
          <Text key={index} style={styles.dayName}>
            {name}
          </Text>
        ))}
      </View>
      
      <View style={styles.calendarGrid}>
        {days.map((day, index) => (
          <View
            key={index}
            style={[
              styles.dayCell,
              day === today.getDate() && styles.todayCell,
              !day && styles.emptyCell
            ]}
          >
            {day && (
              <>
                <Text
                  style={[
                    styles.dayNumber,
                    day === today.getDate() && styles.todayNumber
                  ]}
                >
                  {day}
                </Text>
                {hasStudyActivity(day) && (
                  <View
                    style={[
                      styles.activityDot,
                      {
                        backgroundColor: getColorForIntensity(
                          getIntensityLevel(day)
                        )
                      }
                    ]}
                  />
                )}
              </>
            )}
          </View>
        ))}
      </View>
      
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Study Intensity:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getColorForIntensity(1) }
              ]}
            />
            <Text style={styles.legendText}>{'<30 min'}</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getColorForIntensity(2) }
              ]}
            />
            <Text style={styles.legendText}>30-60 min</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getColorForIntensity(3) }
              ]}
            />
            <Text style={styles.legendText}>60-120 min</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getColorForIntensity(4) }
              ]}
            />
            <Text style={styles.legendText}>{'>120 min'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    margin: 1,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  todayCell: {
    backgroundColor: '#F0EEFF',
  },
  dayNumber: {
    fontSize: 14,
    color: '#333',
  },
  todayNumber: {
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  legendContainer: {
    marginTop: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default StreakCalendar;