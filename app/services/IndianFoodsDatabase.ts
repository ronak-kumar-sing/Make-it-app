/**
 * IndianFoodsDatabase.ts
 *
 * Database of Indian foods with nutritional information for health tracking
 */

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  // Additional nutrition values
  iron?: number;
  calcium?: number;
  vitaminA?: number;
  vitaminC?: number;
  magnesium?: number;
  folate?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  description: string;
  nutrition: NutritionInfo;
  servingSize: string;
  servingSizeGrams: number;
  healthBenefits: string[];
  tags: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  region?: string; // Optional: Region of India where this is common
}

export enum FoodCategory {
  GRAINS_AND_BREADS = 'GRAINS_AND_BREADS',
  PROTEIN_SOURCES = 'PROTEIN_SOURCES',
  VEGETABLE_DISHES = 'VEGETABLE_DISHES',
  SNACKS_AND_APPETIZERS = 'SNACKS_AND_APPETIZERS',
  DAIRY_AND_ALTERNATIVES = 'DAIRY_AND_ALTERNATIVES',
  SPICES_AND_CONDIMENTS = 'SPICES_AND_CONDIMENTS',
  DESSERTS = 'DESSERTS'
}

// Indian Foods Database
export const indianFoods: FoodItem[] = [
  // Staple Grains & Breads
  {
    id: 'roti',
    name: 'Roti/Chapati',
    category: FoodCategory.GRAINS_AND_BREADS,
    description: 'Whole wheat flatbread, high in fiber and complex carbs',
    nutrition: {
      calories: 120,
      protein: 3,
      carbs: 20,
      fat: 3.7,
      fiber: 2.7,
      iron: 0.8,
    },
    servingSize: '1 medium roti',
    servingSizeGrams: 30,
    healthBenefits: ['Source of complex carbohydrates', 'Provides sustained energy'],
    tags: ['whole grain', 'staple', 'everyday food'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: false,
  },
  {
    id: 'brown_rice',
    name: 'Brown Rice',
    category: FoodCategory.GRAINS_AND_BREADS,
    description: 'Fiber-rich alternative to white rice with lower glycemic index',
    nutrition: {
      calories: 216,
      protein: 5,
      carbs: 45,
      fat: 1.8,
      fiber: 3.5,
      iron: 0.5,
      magnesium: 86,
    },
    servingSize: '1 cup cooked',
    servingSizeGrams: 195,
    healthBenefits: ['High in manganese', 'Rich in antioxidants', 'Helps regulate blood sugar'],
    tags: ['whole grain', 'low gi', 'fiber-rich'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
  },
  {
    id: 'jowar_roti',
    name: 'Jowar (Sorghum) Roti',
    category: FoodCategory.GRAINS_AND_BREADS,
    description: 'Gluten-free option rich in protein and iron',
    nutrition: {
      calories: 115,
      protein: 3.5,
      carbs: 24,
      fat: 1.5,
      fiber: 2.8,
      iron: 1.2,
    },
    servingSize: '1 medium roti',
    servingSizeGrams: 30,
    healthBenefits: ['Gluten-free option', 'Rich in antioxidants', 'Good for heart health'],
    tags: ['millets', 'gluten-free', 'diabetic-friendly'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    region: 'Western India',
  },
  {
    id: 'bajra_roti',
    name: 'Bajra (Pearl Millet) Roti',
    category: FoodCategory.GRAINS_AND_BREADS,
    description: 'High in fiber, magnesium and antioxidants',
    nutrition: {
      calories: 130,
      protein: 4.5,
      carbs: 21,
      fat: 5,
      fiber: 3.2,
      iron: 3,
      magnesium: 54,
    },
    servingSize: '1 medium roti',
    servingSizeGrams: 35,
    healthBenefits: ['High in magnesium', 'Helps reduce cholesterol', 'Supports blood sugar control'],
    tags: ['millets', 'winter food', 'warming food'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    region: 'Rajasthan and Gujarat',
  },

  // Protein Sources
  {
    id: 'moong_dal',
    name: 'Moong Dal',
    category: FoodCategory.PROTEIN_SOURCES,
    description: 'Split yellow mung beans, easy to digest and high in protein',
    nutrition: {
      calories: 120,
      protein: 9,
      carbs: 20,
      fat: 0.4,
      fiber: 4.5,
      iron: 1.4,
    },
    servingSize: '1/2 cup cooked',
    servingSizeGrams: 100,
    healthBenefits: ['Easy to digest', 'Good for diabetics', 'Rich in B vitamins'],
    tags: ['lentils', 'dal', 'everyday food'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
  },
  {
    id: 'chana',
    name: 'Chana (Chickpeas)',
    category: FoodCategory.PROTEIN_SOURCES,
    description: 'High in protein and fiber, great for sustained energy',
    nutrition: {
      calories: 269,
      protein: 14.5,
      carbs: 45,
      fat: 4.3,
      fiber: 12.5,
      iron: 4.7,
    },
    servingSize: '1 cup cooked',
    servingSizeGrams: 164,
    healthBenefits: ['Helps manage weight', 'Supports digestion', 'Rich in folate'],
    tags: ['legumes', 'protein', 'North Indian'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
  },
  {
    id: 'paneer',
    name: 'Paneer',
    category: FoodCategory.PROTEIN_SOURCES,
    description: 'Indian cottage cheese, excellent protein source',
    nutrition: {
      calories: 265,
      protein: 18.3,
      carbs: 3.1,
      fat: 20.8,
      fiber: 0,
      calcium: 683,
    },
    servingSize: '100g',
    servingSizeGrams: 100,
    healthBenefits: ['High-quality protein', 'Good source of calcium', 'Low in carbs'],
    tags: ['dairy', 'cheese', 'North Indian'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
  },

  // Vegetable Dishes
  {
    id: 'palak_paneer',
    name: 'Palak Paneer',
    category: FoodCategory.VEGETABLE_DISHES,
    description: 'Spinach-rich dish high in iron, calcium and vitamin A',
    nutrition: {
      calories: 290,
      protein: 15,
      carbs: 13,
      fat: 19,
      fiber: 5.7,
      iron: 4.2,
      calcium: 420,
      vitaminA: 8652,
    },
    servingSize: '1 cup',
    servingSizeGrams: 200,
    healthBenefits: ['Rich in iron', 'High in calcium', 'Good for eye health'],
    tags: ['greens', 'spinach', 'calcium-rich', 'North Indian'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
  },
  {
    id: 'bhindi_masala',
    name: 'Bhindi Masala',
    category: FoodCategory.VEGETABLE_DISHES,
    description: 'Okra dish high in soluble fiber and vitamin C',
    nutrition: {
      calories: 120,
      protein: 3.5,
      carbs: 12,
      fat: 7.5,
      fiber: 4,
      vitaminC: 23,
      folate: 88,
    },
    servingSize: '1 cup',
    servingSizeGrams: 150,
    healthBenefits: ['Rich in Vitamin C', 'Good for digestion', 'Helps lower cholesterol'],
    tags: ['okra', 'ladyfinger', 'side dish'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
  },

  // Snacks & Appetizers
  {
    id: 'dhokla',
    name: 'Dhokla',
    category: FoodCategory.SNACKS_AND_APPETIZERS,
    description: 'Fermented chickpea flour snack, probiotic-rich and low-calorie',
    nutrition: {
      calories: 165,
      protein: 9,
      carbs: 30,
      fat: 2,
      fiber: 5,
      iron: 1.9,
    },
    servingSize: '2 medium pieces',
    servingSizeGrams: 100,
    healthBenefits: ['Fermented food good for gut health', 'Low in fat', 'High in protein'],
    tags: ['fermented', 'probiotic', 'Gujarati food'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    region: 'Gujarat',
  },
  {
    id: 'roasted_makhana',
    name: 'Roasted Makhana (Fox Nuts)',
    category: FoodCategory.SNACKS_AND_APPETIZERS,
    description: 'Low-calorie, high-antioxidant snack',
    nutrition: {
      calories: 106,
      protein: 4.5,
      carbs: 23.2,
      fat: 0.1,
      fiber: 1.9,
      calcium: 60,
      iron: 1.4,
    },
    servingSize: '1/4 cup',
    servingSizeGrams: 30,
    healthBenefits: ['Low in fat', 'High in antioxidants', 'Good for heart health'],
    tags: ['low calorie', 'snack', 'vrat food'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
  },

  // Dairy & Alternatives
  {
    id: 'lassi',
    name: 'Lassi',
    category: FoodCategory.DAIRY_AND_ALTERNATIVES,
    description: 'Traditional yogurt drink rich in probiotics',
    nutrition: {
      calories: 150,
      protein: 5,
      carbs: 15,
      fat: 8,
      fiber: 0,
      calcium: 187,
    },
    servingSize: '1 glass (250ml)',
    servingSizeGrams: 250,
    healthBenefits: ['Good for gut health', 'Cooling for the body', 'Aids digestion'],
    tags: ['yogurt', 'probiotic', 'summer drink', 'Punjabi'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    region: 'Punjab',
  },

  // Spices & Condiments
  {
    id: 'turmeric',
    name: 'Turmeric',
    category: FoodCategory.SPICES_AND_CONDIMENTS,
    description: 'Anti-inflammatory properties',
    nutrition: {
      calories: 29,
      protein: 0.9,
      carbs: 6.3,
      fat: 0.3,
      fiber: 2.1,
      iron: 2.9,
    },
    servingSize: '1 teaspoon',
    servingSizeGrams: 3,
    healthBenefits: ['Anti-inflammatory', 'Antioxidant', 'Supports brain health'],
    tags: ['spice', 'healing', 'ayurvedic'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
  },

  // Desserts
  {
    id: 'ragi_halwa',
    name: 'Ragi Halwa',
    category: FoodCategory.DESSERTS,
    description: 'Iron and calcium-rich alternative to traditional halwa',
    nutrition: {
      calories: 180,
      protein: 3,
      carbs: 30,
      fat: 6,
      fiber: 3.5,
      calcium: 150,
      iron: 2.5,
    },
    servingSize: '1/2 cup',
    servingSizeGrams: 100,
    healthBenefits: ['Rich in calcium', 'Good source of iron', 'Healthier dessert option'],
    tags: ['finger millet', 'dessert', 'iron-rich'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
  }
];

/**
 * Get all foods in a specific category
 */
export function getFoodsByCategory(category: FoodCategory): FoodItem[] {
  return indianFoods.filter(food => food.category === category);
}

/**
 * Search for foods by name or description
 */
export function searchFoods(query: string): FoodItem[] {
  const lowerCaseQuery = query.toLowerCase();
  return indianFoods.filter(
    food =>
      food.name.toLowerCase().includes(lowerCaseQuery) ||
      food.description.toLowerCase().includes(lowerCaseQuery) ||
      food.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
  );
}

/**
 * Get food by ID
 */
export function getFoodById(id: string): FoodItem | undefined {
  return indianFoods.find(food => food.id === id);
}

/**
 * Filter foods by dietary preferences
 */
export function filterFoodsByDiet(vegetarian: boolean, vegan: boolean, glutenFree: boolean): FoodItem[] {
  return indianFoods.filter(food => {
    let match = true;
    if (vegetarian) match = match && food.isVegetarian;
    if (vegan) match = match && food.isVegan;
    if (glutenFree) match = match && food.isGlutenFree;
    return match;
  });
}

/**
 * Get foods rich in a specific nutrient (e.g., "iron", "calcium", etc.)
 */
export function getFoodsRichIn(nutrient: string, threshold: number): FoodItem[] {
  return indianFoods.filter(food => {
    const nutrientValue = food.nutrition[nutrient as keyof NutritionInfo];
    return nutrientValue !== undefined && nutrientValue >= threshold;
  });
}