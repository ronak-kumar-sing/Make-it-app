import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

const OnboardingScreen = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const navigation = useNavigation();

  const onboardingData = [
    {
      title: 'Welcome to StudyStreak',
      description: 'Your personal study assistant to help you stay focused, organized and motivated.',
      image: require('../../assets/images/react-logo.png'),
      icon: 'school-outline',
    },
    {
      title: 'Track Your Progress',
      description: 'Set goals, track your study sessions, and visualize your improvement over time.',
      image: require('../../assets/images/react-logo.png'),
      icon: 'trending-up-outline',
    },
    {
      title: 'Build Study Habits',
      description: 'Develop consistent study habits with our streak system and daily reminders.',
      image: require('../../assets/images/react-logo.png'),
      icon: 'flame-outline',
    },
    {
      title: 'Stay Organized',
      description: 'Manage tasks, exams, and study resources all in one place.',
      image: require('../../assets/images/react-logo.png'),
      icon: 'folder-open-outline',
    },
  ];

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newPage = Math.floor(event.nativeEvent.contentOffset.x / width);
          setCurrentPage(newPage);
        }}
        scrollEnabled={false}
        ref={(ref) => (this.scrollRef = ref)}
      >
        {onboardingData.map((page, index) => (
          <View key={index} style={styles.page}>
            <View style={styles.iconContainer}>
              <Ionicons name={page.icon} size={80} color="#6C63FF" />
            </View>
            <Image source={page.image} style={styles.image} />
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.description}>{page.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentPage && styles.activeIndicator
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  page: {
    width,
    alignItems: 'center',
    padding: 40,
    paddingTop: 60,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDDDDD',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#6C63FF',
    width: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
