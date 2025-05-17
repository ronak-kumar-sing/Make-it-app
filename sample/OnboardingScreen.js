import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const onboardingData = [
    {
      title: 'Welcome to StudyStreak',
      description: 'Your personal study companion to build consistent study habits and ace your academics.',
      image: require('../assets/onboarding-1.png'),
    },
    {
      title: 'Track Your Tasks',
      description: 'Organize your assignments, projects, and study sessions by subject, priority, and due dates.',
      image: require('../assets/onboarding-2.png'),
    },
    {
      title: 'Focus Timer',
      description: 'Use the Pomodoro technique to maintain focus and take strategic breaks for optimal productivity.',
      image: require('../assets/onboarding-3.png'),
    },
    {
      title: 'Build Streaks',
      description: 'Maintain your study streak and watch your productivity soar with visual progress tracking.',
      image: require('../assets/onboarding-4.png'),
    },
  ];
  
  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      navigation.replace('Main');
    }
  };
  
  const handleSkip = () => {
    navigation.replace('Main');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipContainer}>
        {currentPage < onboardingData.length - 1 ? (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Image
          source={onboardingData[currentPage].image}
          style={styles.image}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>{onboardingData[currentPage].title}</Text>
        <Text style={styles.description}>
          {onboardingData[currentPage].description}
        </Text>
      </View>
      
      <View style={styles.paginationContainer}>
        <View style={styles.paginationDots}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentPage && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
        
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Ionicons
            name={
              currentPage === onboardingData.length - 1
                ? 'checkmark'
                : 'arrow-forward'
            }
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipContainer: {
    alignItems: 'flex-end',
    padding: 16,
  },
  skipText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 32,
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
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  paginationDots: {
    flexDirection: 'row',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDDDDD',
    marginRight: 8,
  },
  paginationDotActive: {
    backgroundColor: '#6C63FF',
    width: 16,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OnboardingScreen;