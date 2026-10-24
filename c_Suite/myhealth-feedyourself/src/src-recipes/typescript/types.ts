export interface Recipe {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
}

export type TabId = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
