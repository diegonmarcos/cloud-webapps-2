// Types for Feed Yourself Menu Designer

export interface FoodItem {
  id: string;
  name: string;
  type: 'Vegan' | 'Veg' | 'Meat';
  sub: 'vegan' | 'veg' | 'meat';
  grams: number;
  unitG: number;
  unitName: string;
  shopCat: ShopCategory;
  prot: number;
  carb: number;
  fat: number;
  kcal: number;
  priceKg: number;
  img: string;
}

export type ShopCategory =
  | 'Veggies'
  | 'Fruits'
  | 'Fridge (Vegan)'
  | 'Dairy'
  | 'Meat'
  | 'Fish'
  | 'Freezer'
  | 'Pantry'
  | 'Others';

export type MealSlot = 0 | 1 | 2 | 3; // 0 = none, 1 = breakfast, 2 = lunch, 3 = dinner

export interface Selections {
  [id: string]: MealSlot;
}

export interface MealData {
  k: number; // kcal
  p: number; // protein
  c: number; // carbs
  f: number; // fat
  i: string[]; // item names
}

export interface MealsState {
  1: MealData;
  2: MealData;
  3: MealData;
}

export interface ShopItem {
  name: string;
  g: number;
  unitSize: number;
  priceKg: number;
  isProtein: boolean;
}

export interface ShopData {
  [category: string]: ShopItem[];
}

export interface PriceItem extends ShopItem {
  cat: string;
  total: number;
}

export interface CalculatorInputs {
  base: number;
  active: number;
  deficit: number;
  proteinTarget: number;
  carbLimit: number;
  cost: number;
}

export interface CalculatorOutputs {
  totalNet: number;
  proteinKcal: number;
  sidesKcal: number;
}
