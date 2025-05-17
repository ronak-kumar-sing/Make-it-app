import { eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';

const StreakCalendar = ({ studyDays = {} }) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calendar starts on Sunday (0), so we need to determine the first day offset
  const firstDayOfMonth = monthStart.getDay();

  // Day names for header
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Function to check if a day has study activity
  const hasActivity = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return studyDays[dateString] !== undefined && studyDays[dateString] > 0;
  };

  // Generate empty cells at the beginning of the month for calendar alignment
  const emptyCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    emptyCells.push(
      <View key={`empty-${i}`} style={[styles.dayCell, styles.emptyCell]} />
    );
  }

  // Generate day cells for the month
  const dayCells = daysInMonth.map(date => {
    const isToday = isSameDay(date, today);
    const hasStudyActivity = hasActivity(date);

    return (
      <View
        key={date.toString()}
        style={[
          styles.dayCell,
          isToday && styles.todayCell
        ]}
      >
        <Text style={[
          styles.dayNumber,
          isToday && styles.todayNumber
        ]}>
          {format(date, 'd')}
        </Text>

        {hasStudyActivity && (
          <View
            style={[
              styles.activityDot,
              { backgroundColor: '#6C63FF' }
            ]}
          />
        )}
      </View>
    );
  });

  // All cells, including empty ones at the beginning and day cells
  const allCells = [...emptyCells, ...dayCells];

  return (
    <View style={styles.container}>
      <Text style={styles.monthName}>{format(today, 'MMMM yyyy')}</Text>

      <View style={styles.dayNamesContainer}>
        {dayNames.map(day => (
          <Text key={day} style={styles.dayName}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {allCells}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  monthName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
});

export default StreakCalendar;
