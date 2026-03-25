export interface UserProfile {
  uid: string;
  age: number;
  height: number;
  weight: number;
  allergies: string;
  healthIssues: string;
  goal: 'weight_loss' | 'weight_gain';
  createdAt: string;
}

export interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  recipe: string;
}

export interface DayPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
}

export interface DietPlan {
  id?: string;
  uid: string;
  plan: {
    [day: string]: DayPlan;
  };
  createdAt: string;
}

export interface Feedback {
  uid: string;
  planId: string;
  rating: number;
  comments: string;
  createdAt: string;
}
