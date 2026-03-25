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

    Each meal must include a detailed recipe in Markdown. Ensure the total calories and macros align with the user's goal.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plan: {
            type: Type.OBJECT,
            additionalProperties: {
              type: Type.OBJECT,
              properties: {
                breakfast: { $ref: "#/definitions/Meal" },
                lunch: { $ref: "#/definitions/Meal" },
                dinner: { $ref: "#/definitions/Meal" },
                snacks: { $ref: "#/definitions/Meal" }
              }
            }
          }
        },
        definitions: {
          Meal: {
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
          }
        }
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  return result.plan;
}
