/**
 * NutritionTracker.tsx
 * Screen for tracking food intake, water consumption, and providing nutritional guidance
 */

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as HealthTrackingService from '../services/HealthTrackingService';
import { FoodCategory, FoodItem, indianFoods, searchFoods } from '../services/IndianFoodsDatabase';

export default function NutritionTracker({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  // Date picker state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Time picker state
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Food input
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<Array<{
    foodId: string;
    foodItem: FoodItem;
    servings: number;
  }>>([]);

  // Water and caffeine input
  const [waterIntake, setWaterIntake] = useState('');
  const [caffeine, setCaffeine] = useState('');

  // Additional notes
  const [notes, setNotes] = useState('');

  // Modal for food search
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState('1');

  // History
  const [nutritionHistory, setNutritionHistory] = useState<HealthTrackingService.NutritionEntry[]>([]);

  // Nutrition goals
  const [healthGoals, setHealthGoals] = useState<HealthTrackingService.HealthGoals | null>(null);

  useEffect(() => {
    loadNutritionHistory();
    loadHealthGoals();
  }, []);

  const loadNutritionHistory = async () => {
    try {
      // Get the last 7 days of nutrition data
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const history = await HealthTrackingService.getNutritionEntries(
        weekAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      setNutritionHistory(history);
    } catch (error) {
      console.error('Error loading nutrition history:', error);
      Alert.alert('Error', 'Failed to load nutrition history.');
    }
  };

  const loadHealthGoals = async () => {
    try {
      const goals = await HealthTrackingService.getHealthGoals();
      setHealthGoals(goals);
    } catch (error) {
      console.error('Error loading health goals:', error);
    }
  };

  // Date picker handlers
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  // Time picker handlers
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim().length > 0) {
      const results = searchFoods(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleFoodSelection = (food: FoodItem) => {
    setSelectedFood(food);
    setModalVisible(true);
  };

  const handleAddFood = () => {
    if (!selectedFood) return;

    const newSelectedFoods = [...selectedFoods];
    const existingIndex = newSelectedFoods.findIndex(item => item.foodId === selectedFood.id);

    if (existingIndex !== -1) {
      // Update servings if food already exists
      newSelectedFoods[existingIndex].servings += Number(servings);
    } else {
      // Add new food entry
      newSelectedFoods.push({
        foodId: selectedFood.id,
        foodItem: selectedFood,
        servings: Number(servings)
      });
    }

    setSelectedFoods(newSelectedFoods);
    setModalVisible(false);
    setSelectedFood(null);
    setServings('1');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveFood = (foodId: string) => {
    setSelectedFoods(selectedFoods.filter(item => item.foodId !== foodId));
  };

  const calculateTotalNutrition = () => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };

    selectedFoods.forEach(item => {
      totals.calories += item.foodItem.nutrition.calories * item.servings;
      totals.protein += item.foodItem.nutrition.protein * item.servings;
      totals.carbs += item.foodItem.nutrition.carbs * item.servings;
      totals.fat += item.foodItem.nutrition.fat * item.servings;
      totals.fiber += item.foodItem.nutrition.fiber * item.servings;
    });

    return totals;
  };

  const handleSave = async () => {
    if (selectedFoods.length === 0 && !waterIntake) {
      Alert.alert('Missing Data', 'Please add at least one food item or water intake.');
      return;
    }

    setLoading(true);

    try {
      const nutritionEntry: HealthTrackingService.NutritionEntry = {
        id: `nutrition_${Date.now()}`,
        date: format(date, 'yyyy-MM-dd'),
        time: format(time, 'HH:mm'),
        foodItems: selectedFoods.map(item => ({
          foodId: item.foodId,
          servings: item.servings
        })),
        waterIntake: waterIntake ? parseInt(waterIntake) : 0,
        caffeine: caffeine ? parseInt(caffeine) : undefined,
        notes: notes || undefined
      };

      const success = await HealthTrackingService.addNutritionEntry(nutritionEntry);

      if (success) {
        Alert.alert('Success', 'Nutrition data recorded successfully!');

        // Reset form (except date and time)
        setSelectedFoods([]);
        setWaterIntake('');
        setCaffeine('');
        setNotes('');

        // Refresh history
        await loadNutritionHistory();
      } else {
        Alert.alert('Error', 'Failed to save nutrition data.');
      }
    } catch (error) {
      console.error('Error saving nutrition data:', error);
      Alert.alert('Error', 'Failed to save nutrition data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getWaterProgress = () => {
    if (!healthGoals) return 0;
    return Math.min(100, (parseInt(waterIntake) || 0) / healthGoals.waterIntake * 100);
  };

  const getFoodCategoryIcon = (category: FoodCategory) => {
    switch (category) {
      case FoodCategory.GRAINS_AND_BREADS:
        return 'nutrition-outline';
      case FoodCategory.PROTEIN_SOURCES:
        return 'egg-outline';
      case FoodCategory.VEGETABLE_DISHES:
        return 'leaf-outline';
      case FoodCategory.SNACKS_AND_APPETIZERS:
        return 'fast-food-outline';
      case FoodCategory.DAIRY_AND_ALTERNATIVES:
        return 'cafe-outline';
      case FoodCategory.SPICES_AND_CONDIMENTS:
        return 'color-fill-outline';
      case FoodCategory.DESSERTS:
        return 'ice-cream-outline';
      default:
        return 'restaurant-outline';
    }
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => {
    return (
      <TouchableOpacity
        style={[styles.searchResultItem, { borderColor: theme.border }]}
        onPress={() => handleFoodSelection(item)}
      >
        <View style={styles.foodInfo}>
          <Ionicons name={getFoodCategoryIcon(item.category)} size={24} color={theme.primary} />
          <View style={styles.foodTextContainer}>
            <Text style={[styles.foodName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.foodDetails, { color: theme.textLight }]}>
              {item.servingSize} • {item.nutrition.calories} cal
            </Text>
          </View>
        </View>
        <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
      </TouchableOpacity>
    );
  };

  const renderSelectedFoodItem = ({ item }: { item: { foodId: string; foodItem: FoodItem; servings: number } }) => {
    return (
      <View style={[styles.selectedFoodItem, { backgroundColor: theme.cardLight, borderColor: theme.border }]}>
        <View style={styles.foodInfo}>
          <Ionicons name={getFoodCategoryIcon(item.foodItem.category)} size={20} color={theme.primary} />
          <View style={styles.foodTextContainer}>
            <Text style={[styles.selectedFoodName, { color: theme.text }]}>{item.foodItem.name}</Text>
            <Text style={[styles.foodDetails, { color: theme.textLight }]}>
              {item.servings} x {item.foodItem.servingSize} • {item.foodItem.nutrition.calories * item.servings} cal
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleRemoveFood(item.foodId)}>
          <Ionicons name="close-circle-outline" size={24} color={theme.error} />
        </TouchableOpacity>
      </View>
    );
  };

  const getFoodItemById = (id: string): FoodItem | undefined => {
    return indianFoods.find(food => food.id === id);
  };

  // Render a limited number of search results
  const renderSearchResults = () => {
    if (searchResults.length === 0) return null;

    // Only show up to 5 results to avoid excessive nesting
    const limitedResults = searchResults.slice(0, 5);
    return (
      <View style={[styles.searchResults, { backgroundColor: theme.card }]}>
        {limitedResults.map(item => (
          <React.Fragment key={item.id}>
            {renderFoodItem({ item })}
          </React.Fragment>
        ))}
        {searchResults.length > 5 && (
          <Text style={[styles.moreResultsText, { color: theme.textLight, textAlign: 'center', paddingVertical: 8 }]}>
            {searchResults.length - 5} more results found. Please refine your search.
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Nutrition Tracker</Text>
      </View>

      {/* Main content - use a single FlatList to prevent nested scrolling */}
      <FlatList
        data={[{ key: 'content' }]}
        keyExtractor={item => item.key}
        renderItem={() => (
          <>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>Record Nutrition</Text>

              {/* Date and Time selection */}
              <View style={styles.dateTimeContainer}>
                {/* Date selection */}
                <TouchableOpacity
                  style={[styles.dateSelector, { borderColor: theme.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={24} color={theme.primary} />
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {format(date, 'MMM d, yyyy')}
                  </Text>
                </TouchableOpacity>

                {/* Time selection */}
                <TouchableOpacity
                  style={[styles.dateSelector, { borderColor: theme.border }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={24} color={theme.primary} />
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {format(time, 'h:mm a')}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                />
              )}

              {/* Food Search */}
              <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Add Food Items</Text>
              <View style={[styles.searchContainer, { borderColor: theme.border }]}>
                <Ionicons name="search-outline" size={20} color={theme.textLight} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search Indian foods..."
                  placeholderTextColor={theme.textLight}
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
              </View>

              {/* Search Results - Displayed as individual components, not a FlatList */}
              {renderSearchResults()}

              {/* Selected Foods - Displayed as individual components, not a FlatList */}
              {selectedFoods.length > 0 && (
                <>
                  <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Selected Foods</Text>
                  <View style={styles.selectedFoodsList}>
                    {selectedFoods.map(item => (
                      <React.Fragment key={item.foodId}>
                        {renderSelectedFoodItem({ item })}
                      </React.Fragment>
                    ))}
                  </View>

                  {/* Nutrition Summary */}
                  <View style={[styles.nutritionSummary, { borderColor: theme.border }]}>
                    <Text style={[styles.nutritionSummaryTitle, { color: theme.text }]}>Total Nutrition</Text>
                    <View style={styles.nutrientRow}>
                      <Text style={[styles.nutrientLabel, { color: theme.textLight }]}>Calories:</Text>
                      <Text style={[styles.nutrientValue, { color: theme.text }]}>
                        {Math.round(calculateTotalNutrition().calories)} kcal
                      </Text>
                    </View>
                    <View style={styles.nutrientRow}>
                      <Text style={[styles.nutrientLabel, { color: theme.textLight }]}>Protein:</Text>
                      <Text style={[styles.nutrientValue, { color: theme.text }]}>
                        {Math.round(calculateTotalNutrition().protein)}g
                      </Text>
                    </View>
                    <View style={styles.nutrientRow}>
                      <Text style={[styles.nutrientLabel, { color: theme.textLight }]}>Carbs:</Text>
                      <Text style={[styles.nutrientValue, { color: theme.text }]}>
                        {Math.round(calculateTotalNutrition().carbs)}g
                      </Text>
                    </View>
                    <View style={styles.nutrientRow}>
                      <Text style={[styles.nutrientLabel, { color: theme.textLight }]}>Fat:</Text>
                      <Text style={[styles.nutrientValue, { color: theme.text }]}>
                        {Math.round(calculateTotalNutrition().fat)}g
                      </Text>
                    </View>
                    <View style={styles.nutrientRow}>
                      <Text style={[styles.nutrientLabel, { color: theme.textLight }]}>Fiber:</Text>
                      <Text style={[styles.nutrientValue, { color: theme.text }]}>
                        {Math.round(calculateTotalNutrition().fiber)}g
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {/* Water Intake */}
              <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Water Intake (mL)</Text>
              <View style={[styles.waterInputContainer, { borderColor: theme.border }]}>
                <Ionicons name="water-outline" size={24} color={theme.primary} />
                <TextInput
                  style={[styles.waterInput, { color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.textLight}
                  keyboardType="numeric"
                  value={waterIntake}
                  onChangeText={setWaterIntake}
                />
                <Text style={[styles.waterUnit, { color: theme.textLight }]}>mL</Text>
              </View>

              {healthGoals && waterIntake && (
                <View style={styles.waterProgressContainer}>
                  <View
                    style={[
                      styles.waterProgressBar,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border
                      }
                    ]}
                  >
                    <View
                      style={[
                        styles.waterProgressFill,
                        {
                          backgroundColor: theme.primary,
                          width: `${getWaterProgress()}%`
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.waterProgressText, { color: theme.textLight }]}>
                    {waterIntake ? parseInt(waterIntake) : 0} of {healthGoals.waterIntake} mL
                  </Text>
                </View>
              )}

              {/* Caffeine Intake */}
              <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Caffeine Intake (mg) - Optional</Text>
              <View style={[styles.waterInputContainer, { borderColor: theme.border }]}>
                <Ionicons name="cafe-outline" size={24} color={theme.accent} />
                <TextInput
                  style={[styles.waterInput, { color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.textLight}
                  keyboardType="numeric"
                  value={caffeine}
                  onChangeText={setCaffeine}
                />
                <Text style={[styles.waterUnit, { color: theme.textLight }]}>mg</Text>
              </View>

              {/* Notes input */}
              <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Notes</Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="How was your meal? Any digestive issues or cravings?"
                placeholderTextColor={theme.textLight}
                multiline={true}
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={[styles.saveButtonText, { color: theme.cardLight }]}>
                  {loading ? 'Saving...' : 'Save Nutrition Data'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Nutrition history */}
            <View style={[styles.card, { backgroundColor: theme.card, marginTop: 20, marginBottom: 20 }]}>
              <View style={styles.historyHeader}>
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>Recent Nutrition History</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ActivityHistory', { tab: 'nutrition' })}>
                  <Text style={[styles.viewAllText, { color: theme.accent }]}>View All</Text>
                </TouchableOpacity>
              </View>

              {nutritionHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="restaurant-outline" size={40} color={theme.textLight} />
                  <Text style={[styles.emptyStateText, { color: theme.textLight }]}>
                    No nutrition data recorded yet. Start tracking your meals to see history here.
                  </Text>
                </View>
              ) : (
                nutritionHistory.slice(0, 3).map((entry) => (
                  <View key={entry.id} style={[styles.historyItem, { borderColor: theme.border }]}>
                    <View style={styles.historyItemHeader}>
                      <Text style={[styles.historyDate, { color: theme.text }]}>
                        {format(new Date(entry.date), 'MMM d')} at {entry.time}
                      </Text>
                      <Text style={[styles.waterBadge, { color: theme.primary }]}>
                        <Ionicons name="water-outline" size={16} color={theme.primary} /> {entry.waterIntake} mL
                      </Text>
                    </View>

                    <View style={styles.historyDetails}>
                      {entry.foodItems.length > 0 && (
                        <View style={styles.foodList}>
                          {entry.foodItems.map((foodItem, index) => {
                            const food = getFoodItemById(foodItem.foodId);
                            return food ? (
                              <Text
                                key={index}
                                style={[styles.historyFoodItem, { color: theme.textLight }]}
                                numberOfLines={1}
                              >
                                {foodItem.servings}x {food.name}
                              </Text>
                            ) : null;
                          })}
                        </View>
                      )}

                      {entry.caffeine && (
                        <Text style={[styles.caffeineBadge, { color: theme.accent }]}>
                          <Ionicons name="cafe-outline" size={14} color={theme.accent} /> {entry.caffeine} mg caffeine
                        </Text>
                      )}
                    </View>

                    {entry.notes && (
                      <Text style={[styles.historyNotes, { color: theme.textLight }]}>
                        {entry.notes}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={true}
      />

      {/* Food selection modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add to your meal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-outline" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedFood && (
              <View style={styles.foodDetailContainer}>
                <View style={styles.foodTitleContainer}>
                  <Ionicons name={getFoodCategoryIcon(selectedFood.category)} size={24} color={theme.primary} />
                  <Text style={[styles.modalFoodName, { color: theme.text }]}>{selectedFood.name}</Text>
                </View>

                <Text style={[styles.modalFoodDescription, { color: theme.textLight }]}>
                  {selectedFood.description}
                </Text>

                <View style={[styles.nutritionContainer, { borderColor: theme.border }]}>
                  <Text style={[styles.nutritionTitle, { color: theme.text }]}>
                    Nutrition per {selectedFood.servingSize}:
                  </Text>
                  <View style={styles.nutrientGrid}>
                    <View style={styles.nutrientItem}>
                      <Text style={[styles.nutrientValue, { color: theme.text }]}>
                        {selectedFood.nutrition.calories}
                      </Text>
                      <Text style={[styles.nutrientName, { color: theme.textLight }]}>Calories</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={[styles.nutrientValue, { color: theme.text }]}>
                        {selectedFood.nutrition.protein}g
                      </Text>
                      <Text style={[styles.nutrientName, { color: theme.textLight }]}>Protein</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={[styles.nutrientValue, { color: theme.text }]}>
                        {selectedFood.nutrition.carbs}g
                      </Text>
                      <Text style={[styles.nutrientName, { color: theme.textLight }]}>Carbs</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={[styles.nutrientValue, { color: theme.text }]}>
                        {selectedFood.nutrition.fat}g
                      </Text>
                      <Text style={[styles.nutrientName, { color: theme.textLight }]}>Fat</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.servingsContainer}>
                  <Text style={[styles.servingsLabel, { color: theme.text }]}>Servings:</Text>
                  <View style={styles.servingsInputContainer}>
                    <TouchableOpacity
                      style={[styles.servingsButton, { borderColor: theme.border }]}
                      onPress={() => {
                        const currentServings = Number(servings);
                        if (currentServings > 0.5) {
                          setServings((currentServings - 0.5).toString());
                        }
                      }}
                    >
                      <Ionicons name="remove-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>
                    <TextInput
                      style={[
                        styles.servingsInput,
                        {
                          color: theme.text,
                          borderColor: theme.border,
                          backgroundColor: theme.inputBackground
                        }
                      ]}
                      keyboardType="numeric"
                      value={servings}
                      onChangeText={setServings}
                    />
                    <TouchableOpacity
                      style={[styles.servingsButton, { borderColor: theme.border }]}
                      onPress={() => {
                        const currentServings = Number(servings);
                        setServings((currentServings + 0.5).toString());
                      }}
                    >
                      <Ionicons name="add-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.healthBenefitsTitle, { color: theme.text }]}>Health Benefits:</Text>
                <View style={styles.benefitsList}>
                  {selectedFood.healthBenefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={theme.primary} />
                      <Text style={[styles.benefitText, { color: theme.textLight }]}>{benefit}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.tagContainer}>
                  {selectedFood.isVegetarian && (
                    <View style={[styles.dietTag, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.dietTagText, { color: theme.primary }]}>Vegetarian</Text>
                    </View>
                  )}
                  {selectedFood.isVegan && (
                    <View style={[styles.dietTag, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.dietTagText, { color: theme.primary }]}>Vegan</Text>
                    </View>
                  )}
                  {selectedFood.isGlutenFree && (
                    <View style={[styles.dietTag, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.dietTagText, { color: theme.primary }]}>Gluten Free</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.primary }]}
                  onPress={handleAddFood}
                >
                  <Text style={[styles.addButtonText, { color: theme.cardLight }]}>
                    Add to Meal
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    width: '48%',
  },
  dateText: {
    fontSize: 14,
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    marginLeft: 8,
  },
  searchResults: {
    maxHeight: 200,
    marginTop: 8,
    borderRadius: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  foodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  foodTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  foodName: {
    fontSize: 16,
  },
  foodDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedFoodsList: {
    marginTop: 8,
  },
  selectedFoodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  selectedFoodName: {
    fontSize: 14,
    fontWeight: '500',
  },
  nutritionSummary: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  nutritionSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  nutrientLabel: {
    fontSize: 14,
  },
  nutrientValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  waterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  waterInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    textAlign: 'right',
  },
  waterUnit: {
    fontSize: 16,
    marginLeft: 8,
  },
  waterProgressContainer: {
    marginTop: 8,
  },
  waterProgressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  waterProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  waterProgressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  historyItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  waterBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyDetails: {
    marginVertical: 4,
  },
  foodList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  historyFoodItem: {
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
  caffeineBadge: {
    fontSize: 12,
    marginTop: 4,
  },
  historyNotes: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  foodDetailContainer: {
    flex: 1,
  },
  foodTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalFoodName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  modalFoodDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  nutritionContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  nutrientGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientName: {
    fontSize: 12,
    marginTop: 4,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  servingsLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  servingsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingsButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    marginHorizontal: 10,
    fontSize: 16,
  },
  healthBenefitsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dietTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  dietTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  moreResultsText: {
    fontSize: 12,
    padding: 8,
  },
});
