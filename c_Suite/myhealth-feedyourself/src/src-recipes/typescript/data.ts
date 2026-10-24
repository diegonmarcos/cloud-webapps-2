import type { Recipe } from './types';

export const recipes: Recipe[] = [
  // Breakfast
  {
    id: 'protein-oatmeal',
    name: 'Protein Oatmeal',
    category: 'breakfast',
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    calories: 380,
    protein: 28,
    carbs: 45,
    fat: 8,
    ingredients: [
      '50g oats',
      '1 scoop whey protein',
      '200ml almond milk',
      '1 tbsp honey',
      'Handful of berries'
    ],
    instructions: [
      'Combine oats and almond milk in a pot',
      'Cook on medium heat for 5-7 minutes',
      'Remove from heat and let cool slightly',
      'Stir in protein powder',
      'Top with honey and berries'
    ],
    tags: ['high-protein', 'quick', 'vegetarian']
  },
  {
    id: 'egg-veggie-scramble',
    name: 'Egg & Veggie Scramble',
    category: 'breakfast',
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    calories: 320,
    protein: 24,
    carbs: 8,
    fat: 22,
    ingredients: [
      '3 whole eggs',
      '50g spinach',
      '50g mushrooms',
      '30g feta cheese',
      '1 tsp olive oil',
      'Salt & pepper'
    ],
    instructions: [
      'Heat olive oil in a pan',
      'Sauté mushrooms until golden',
      'Add spinach and cook until wilted',
      'Beat eggs and pour into pan',
      'Scramble gently, add feta',
      'Season with salt and pepper'
    ],
    tags: ['keto', 'low-carb', 'vegetarian']
  },
  // Lunch
  {
    id: 'chicken-salad-bowl',
    name: 'Chicken Salad Bowl',
    category: 'lunch',
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    calories: 450,
    protein: 42,
    carbs: 25,
    fat: 18,
    ingredients: [
      '150g chicken breast',
      '100g mixed greens',
      '50g cherry tomatoes',
      '30g cucumber',
      '30g avocado',
      '2 tbsp olive oil dressing'
    ],
    instructions: [
      'Season and grill chicken breast',
      'Let rest for 5 minutes, then slice',
      'Arrange greens in a bowl',
      'Add tomatoes, cucumber, avocado',
      'Top with sliced chicken',
      'Drizzle with olive oil dressing'
    ],
    tags: ['high-protein', 'low-carb', 'meal-prep']
  },
  {
    id: 'tuna-wrap',
    name: 'High-Protein Tuna Wrap',
    category: 'lunch',
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    calories: 380,
    protein: 35,
    carbs: 30,
    fat: 12,
    ingredients: [
      '1 can tuna (150g)',
      '1 whole wheat wrap',
      '2 tbsp Greek yogurt',
      '30g lettuce',
      '30g tomato',
      'Lemon juice, salt, pepper'
    ],
    instructions: [
      'Drain tuna and mix with Greek yogurt',
      'Add lemon juice, salt, pepper',
      'Warm the wrap slightly',
      'Layer lettuce and tomato',
      'Add tuna mixture',
      'Roll tightly and slice'
    ],
    tags: ['high-protein', 'quick', 'no-cook']
  },
  // Dinner
  {
    id: 'salmon-vegetables',
    name: 'Baked Salmon with Roasted Vegetables',
    category: 'dinner',
    prepTime: 10,
    cookTime: 25,
    servings: 1,
    calories: 520,
    protein: 40,
    carbs: 20,
    fat: 30,
    ingredients: [
      '150g salmon fillet',
      '100g broccoli',
      '100g bell peppers',
      '50g zucchini',
      '2 tbsp olive oil',
      'Garlic, herbs, lemon'
    ],
    instructions: [
      'Preheat oven to 200°C',
      'Cut vegetables and toss with olive oil',
      'Spread on baking sheet',
      'Season salmon and place on vegetables',
      'Bake for 20-25 minutes',
      'Finish with fresh lemon'
    ],
    tags: ['high-protein', 'omega-3', 'one-pan']
  },
  {
    id: 'beef-stir-fry',
    name: 'Beef & Vegetable Stir-Fry',
    category: 'dinner',
    prepTime: 15,
    cookTime: 15,
    servings: 2,
    calories: 480,
    protein: 38,
    carbs: 25,
    fat: 24,
    ingredients: [
      '200g lean beef strips',
      '100g broccoli',
      '100g bell peppers',
      '50g snap peas',
      '2 tbsp soy sauce',
      '1 tbsp sesame oil',
      'Ginger, garlic'
    ],
    instructions: [
      'Slice beef into thin strips',
      'Heat sesame oil in wok',
      'Stir-fry beef until browned, set aside',
      'Cook vegetables until crisp-tender',
      'Return beef, add soy sauce',
      'Toss with ginger and garlic'
    ],
    tags: ['high-protein', 'quick', 'meal-prep']
  },
  // Snacks
  {
    id: 'greek-yogurt-parfait',
    name: 'Greek Yogurt Parfait',
    category: 'snacks',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    calories: 220,
    protein: 18,
    carbs: 25,
    fat: 6,
    ingredients: [
      '150g Greek yogurt',
      '30g granola',
      '50g mixed berries',
      '1 tsp honey'
    ],
    instructions: [
      'Layer yogurt in a glass',
      'Add half the granola',
      'Add berries',
      'Top with remaining granola',
      'Drizzle with honey'
    ],
    tags: ['high-protein', 'quick', 'vegetarian']
  },
  {
    id: 'protein-energy-balls',
    name: 'Protein Energy Balls',
    category: 'snacks',
    prepTime: 15,
    cookTime: 0,
    servings: 10,
    calories: 120,
    protein: 8,
    carbs: 12,
    fat: 5,
    ingredients: [
      '100g oats',
      '2 scoops protein powder',
      '60g peanut butter',
      '60g honey',
      '30g dark chocolate chips'
    ],
    instructions: [
      'Mix oats and protein powder',
      'Add peanut butter and honey',
      'Mix until combined',
      'Fold in chocolate chips',
      'Roll into 10 balls',
      'Refrigerate for 30 minutes'
    ],
    tags: ['high-protein', 'meal-prep', 'vegetarian']
  }
];
