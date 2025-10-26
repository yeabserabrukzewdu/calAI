import { GoogleGenAI, Type } from "@google/genai";
// FIX: Corrected import path for FoodItem type.
import { FoodItem } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const foodItemSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the food item." },
    calories: { type: Type.NUMBER, description: "Estimated calories." },
    protein: { type: Type.NUMBER, description: "Estimated grams of protein." },
    carbs: { type: Type.NUMBER, description: "Estimated grams of carbohydrates." },
    fat: { type: Type.NUMBER, description: "Estimated grams of fat." },
    portion: { type: Type.STRING, description: "Estimated portion size, e.g., '100g' or '1 cup'." },
  },
  required: ["name", "calories", "protein", "carbs", "fat", "portion"],
};


export const analyzeMealImage = async (base64Image: string, mimeType: string): Promise<FoodItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        parts: [
          {
            text: 'Analyze this image of a meal. Identify each food item, estimate its portion size, and provide its nutritional information (calories, protein, carbs, fat).',
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: foodItemSchema,
        },
      },
    });

    const resultText = response.text.trim();
    const result = JSON.parse(resultText);

    // Add a unique ID to each food item
    return result.map((item: Omit<FoodItem, 'id'>) => ({
        ...item,
        id: crypto.randomUUID(),
    }));

  } catch (error) {
    console.error("Error analyzing meal image:", error);
    throw new Error("Failed to analyze image. The AI could not process the request.");
  }
};

export const searchFoodDatabase = async (query: string): Promise<FoodItem | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: `Provide nutritional information for "${query}". If it's a generic item, assume a standard portion size (e.g., 1 medium for fruit, 100g for meat).` },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: foodItemSchema,
            },
        });

        const resultText = response.text.trim();
        if (!resultText) return null;

        const result = JSON.parse(resultText);
        return { ...result, id: crypto.randomUUID() };

    } catch (error) {
        console.error("Error searching food database:", error);
        throw new Error("Failed to search for food item.");
    }
};

export const getPersonalizedInsights = async (log: FoodItem[], goals: {calories: number, protein: number, carbs: number, fat: number}): Promise<string> => {
    try {
        const logSummary = log.map(item => `${item.name} (${item.calories} kcal)`).join(', ');
        const prompt = `
            Based on the following daily food log and nutritional goals, provide some personalized insights and recommendations.
            
            Today's Log: ${logSummary || 'No items logged.'}
            
            Goals:
            - Calories: ${goals.calories} kcal
            - Protein: ${goals.protein} g
            - Carbohydrates: ${goals.carbs} g
            - Fat: ${goals.fat} g
            
            Analyze my intake, suggest one healthy meal for tomorrow, and provide a brief, encouraging tip. Keep the response formatted in Markdown.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error getting personalized insights:", error);
        throw new Error("Failed to generate insights.");
    }
};