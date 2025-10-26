import { GoogleGenAI, Type } from "@google/genai";
import type { FoodItem, LogEntry, MacroGoals } from "../types";

// Singleton AI instance to reduce overhead (recreated only if API key changes)
let aiInstance: GoogleGenAI | null = null;
let cachedKey: string | null = null;

const getAIInstance = (): GoogleGenAI => {
  const currentKey = process.env.API_KEY;
  if (!currentKey) {
    throw new Error("API_KEY environment variable is required.");
  }
  if (!aiInstance || cachedKey !== currentKey) {
    aiInstance = new GoogleGenAI({ apiKey: currentKey });
    cachedKey = currentKey;
  }
  return aiInstance;
};

const foodItemSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The name of the food item." },
    portion: { type: Type.STRING, description: "The estimated portion size (e.g., '1 cup', '100g')." },
    calories: { type: Type.NUMBER, description: "Estimated calories for the portion." },
    protein: { type: Type.NUMBER, description: "Estimated protein in grams." },
    carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams." },
    fat: { type: Type.NUMBER, description: "Estimated fat in grams." },
  },
  required: ["name", "portion", "calories", "protein", "carbs", "fat"],
};

/**
 * Centralized error handler for API calls.
 */
const handleAPIError = (error: unknown, context: string): never => {
  console.error(`Error in ${context}:`, error);
  throw new Error(`Failed to ${context}. Please check your connection and try again.`);
};

/**
 * Analyzes an image of food and returns a list of identified food items with nutritional information.
 * @param base64ImageData The base64 encoded image data (without the data URL prefix).
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg', 'image/png').
 * @returns A promise that resolves to an array of FoodItem objects.
 */
export const identifyFoodFromImage = async (
  base64ImageData: string,
  mimeType: string
): Promise<FoodItem[]> => {
  try {
    const ai = getAIInstance();
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64ImageData,
      },
    };

    const textPart = {
      text: `Analyze the image and identify each distinct food item. For each item, provide its name, estimated portion size, and nutritional information (calories, protein, carbs, fat). Respond only with valid JSON, no additional text. Return the data as a JSON array of objects matching the schema.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: foodItemSchema,
        },
      },
    });

    if (typeof response.text !== "string") {
      throw new Error("Invalid API response format: expected string text.");
    }

    const jsonString = response.text.trim();
    if (!jsonString) {
      throw new Error("API returned an empty response.");
    }

    const foodItems: FoodItem[] = JSON.parse(jsonString);
    // Basic validation: ensure all items have required fields
    foodItems.forEach((item, index) => {
      if (!item.name || typeof item.calories !== "number") {
        throw new Error(`Invalid data for food item at index ${index}: missing required fields.`);
      }
    });

    return foodItems;
  } catch (error) {
    if (error instanceof Error && error.message.includes("API_KEY")) {
      throw error; // Preserve original for auth issues
    }
    handleAPIError(error, "analyze the food image");
  }
};

/**
 * Searches for a food item by name and returns its nutritional information.
 * @param query The user's search query (e.g., "one banana").
 * @returns A promise that resolves to a single FoodItem object or null if not found.
 */
export const searchFoodDatabase = async (query: string): Promise<FoodItem | null> => {
  try {
    const ai = getAIInstance();

    const prompt = `
      Provide estimated nutritional information for the following food query: "${query}".
      Return a single JSON object with the following properties: name, portion, calories, protein, carbs, and fat.
      For the name, use a standardized name for the food item. For portion, use a common serving size (e.g., '1 cup', '100g', '1 medium apple').
      If the query is ambiguous or you cannot find a reasonable match, respond with null (as a JSON null value).
      Respond only with valid JSON, no additional text.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            portion: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
          },
        },
      },
    });

    if (typeof response.text !== "string") {
      throw new Error("Invalid API response format: expected string text.");
    }

    const jsonString = response.text.trim();
    if (!jsonString || jsonString.toLowerCase() === "null" || jsonString === "{}") {
      return null;
    }

    const foodItem: FoodItem = JSON.parse(jsonString);
    // Basic validation
    if (!foodItem.name || typeof foodItem.calories !== "number") {
      return null;
    }

    return foodItem;
  } catch (error) {
    if (error instanceof Error && error.message.includes("API_KEY")) {
      throw error;
    }
    handleAPIError(error, `search for food "${query}"`);
  }
};

/**
 * Generates personalized nutritional insights based on logged foods and goals.
 * @param loggedFoods An array of food log entries for a specific period.
 * @param goals The user's daily macro goals.
 * @returns A promise that resolves to a string containing personalized insights in Markdown format.
 */
export const getPersonalizedInsights = async (
  loggedFoods: LogEntry[],
  goals: MacroGoals
): Promise<string> => {
  if (loggedFoods.length === 0) {
    return "No food has been logged yet. Log some meals to get your personalized AI insights!";
  }

  try {
    const ai = getAIInstance();

    const totals = loggedFoods.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Calculate progress percentages for more precise insights
    const progress = {
      calories: Math.round((totals.calories / goals.calories) * 100),
      protein: Math.round((totals.protein / goals.protein) * 100),
      carbs: Math.round((totals.carbs / goals.carbs) * 100),
      fat: Math.round((totals.fat / goals.fat) * 100),
    };

    const foodList = loggedFoods.map((f) => `- ${f.name} (${f.calories} kcal)`).join("\n");

    const prompt = `
      You are a friendly and encouraging nutrition coach. Analyze the user's food log for the day and provide personalized insights.
      The user's daily goals are: ${goals.calories} calories, ${goals.protein}g protein, ${goals.carbs}g carbs, and ${goals.fat}g fat.
      So far today, they have consumed: ${totals.calories} calories (${progress.calories}% of goal), ${totals.protein}g protein (${progress.protein}% of goal), ${totals.carbs}g carbs (${progress.carbs}% of goal), and ${totals.fat}g fat (${progress.fat}% of goal).
      
      Here are the foods they ate:
      ${foodList}

      Based on this, provide 2-3 short, actionable, and positive insights in Markdown format (use bullet points).
      - Start with a positive observation.
      - Compare their current intake to their goals (e.g., "You're on track with your protein goal at ${progress.protein}%!").
      - Offer a simple, helpful suggestion for their next meal or for tomorrow.
      - Keep the tone friendly and supportive, not critical.
      - Do not just list the numbers back to them. Provide actual insight.
      Respond only with the Markdown content, no additional text.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    if (typeof response.text !== "string") {
      throw new Error("Invalid API response format: expected string text.");
    }

    return response.text.trim();
  } catch (error) {
    if (error instanceof Error && error.message.includes("API_KEY")) {
      throw error;
    }
    handleAPIError(error, "generate personalized insights");
  }
};