import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, DietPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateDietPlan(profile: UserProfile): Promise<DietPlan['plan']> {
  const prompt = `Generate a 7-day diet plan for a user with the following profile:
    Age: ${profile.age}
    Height: ${profile.height} cm
    Weight: ${profile.weight} kg
    Goal: ${profile.goal === 'weight_loss' ? 'Weight Loss' : 'Weight Gain'}
    Allergies: ${profile.allergies || 'None'}
    Health Issues: ${profile.healthIssues || 'None'}

    Each meal must include a detailed recipe in Markdown. Ensure the total calories and macros align with the user's goal.
    
    CRITICAL: The "plan" object must have exactly 7 keys: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday".`;

  const mealSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      calories: { type: Type.NUMBER },
      protein: { type: Type.NUMBER },
      carbs: { type: Type.NUMBER },
      fats: { type: Type.NUMBER },
      recipe: { type: Type.STRING }
    },
    required: ["name", "calories", "protein", "carbs", "fats", "recipe"]
  };

  const dayPlanSchema = {
    type: Type.OBJECT,
    properties: {
      breakfast: mealSchema,
      lunch: mealSchema,
      dinner: mealSchema,
      snacks: mealSchema
    },
    required: ["breakfast", "lunch", "dinner", "snacks"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan: {
              type: Type.OBJECT,
              properties: {
                Monday: dayPlanSchema,
                Tuesday: dayPlanSchema,
                Wednesday: dayPlanSchema,
                Thursday: dayPlanSchema,
                Friday: dayPlanSchema,
                Saturday: dayPlanSchema,
                Sunday: dayPlanSchema
              },
              required: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            }
          },
          required: ["plan"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    const result = JSON.parse(response.text);
    if (!result.plan) {
      throw new Error("Invalid response structure from Gemini");
    }
    return result.plan;
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate diet plan: " + error.message);
  }
}
