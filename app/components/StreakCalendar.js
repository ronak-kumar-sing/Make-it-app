import { eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth } from 'date-fns';
import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const StreakCalendar = ({ studyDays = {} }) => {
  const { theme } = useTheme();

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfMonth = monthStart.getDay();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const hasActivity = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return studyDays[dateString] !== undefined && studyDays[dateString] > 0;
  };

  const getIntensityLevel = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const minutes = studyDays[dateString] || 0;
    const hours = minutes / 60;

    if (minutes === 0) return 0;
    if (hours < 0.5) return 1;
    if (hours < 1) return 2;
    if (hours < 2) return 3;
    return 4;
  };

  const getColorForIntensity = (level) => {
    switch (level) {
      case 1:
        return theme.isDark ? `${theme.primary}30` : '#E3F2FD';
      case 2:
        return theme.isDark ? `${theme.primary}50` : '#BBDEFB';
      case 3:
        return theme.isDark ? `${theme.primary}70` : '#90CAF9';
      case 4:
        return theme.primary;
      default:
        return 'transparent';
    }
  };

  const emptyCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    emptyCells.push(
      <View key={`empty-${i}`} style={[styles.dayCell, styles.emptyCell]} />
    );
  }

  const dayCells = daysInMonth.map(date => {
    const isToday = isSameDay(date, today);
    const hasStudyActivity = hasActivity(date);
    const intensityLevel = getIntensityLevel(date);

    return (
      <View
        key={date.toString()}
        style={[
          styles.dayCell,
          isToday && [styles.todayCell, { backgroundColor: theme.primaryLight }]
        ]}
      >
        <Text style={[
          styles.dayNumber,
          { color: theme.text },
          isToday && [styles.todayNumber, { color: theme.primary }]
        ]}>
          {format(date, 'd')}
        </Text>

        {hasStudyActivity && (
          <View
            style={[
              styles.activityDot,
              { backgroundColor: getColorForIntensity(intensityLevel) }
            ]}
          />
        )}
      </View>
    );
  });

  const allCells = [...emptyCells, ...dayCells];

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.monthName, { color: theme.text }]}>{format(today, 'MMMM yyyy')}</Text>

      <View style={styles.dayNamesContainer}>
        {dayNames.map(day => (
          <Text key={day} style={[styles.dayName, { color: theme.textSecondary }]}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {allCells}
      </View>

      <View style={styles.legendContainer}>
        <Text style={[styles.legendTitle, { color: theme.text }]}>Study Intensity:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getColorForIntensity(1) }
              ]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}> {'<0.5h'}</Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getColorForIntensity(2) }
              ]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}> {'0.5-1h'}</Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getColorForIntensity(3) }
              ]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}> {'1-2h'}</Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getColorForIntensity(4) }
              ]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}> {'>2h'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 12,
  },
  monthName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

export default StreakCalendar;