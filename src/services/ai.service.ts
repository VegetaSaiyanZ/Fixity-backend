import { EnvHandler } from "@/handlers/env.handler";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(EnvHandler.instance.GEMINI_API_KEY);

export interface AnalyzeImageResult {
  category: string;
  title: string;
  description: string;
}

export class AiService {
  static async analyzeImage(
    buffer: Buffer,
    mimeType: string,
  ): Promise<AnalyzeImageResult> {
    const base64Data = buffer.toString("base64");

    // Fetch categories from the database
    let categories: string[] = [];
    try {
      const dbCategories = await prisma.category.findMany({
        select: { name: true },
      });
      categories = dbCategories.map((c) => c.name);
    } catch (error) {
      console.error(
        "Failed to fetch categories from DB, falling back to empty list",
        error,
      );
    }

    if (categories.length === 0) {
      categories = ["Other"]; // Fallback
    }

    const prompt = `
You are an expert Smart City incident analyzer. Analyze this image and extract details for a public report.
Return ONLY a strict JSON object with the following schema:
{
  "category": "<one of the predefined categories>",
  "title": "<a short, descriptive title>",
  "description": "<a detailed description of the incident>"
}

Allowed categories:
${categories.map((c) => `- ${c}`).join("\n")}

If the image doesn't clearly match a category, use "Other" or the closest match.
Make sure the JSON is valid.
`;

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      return JSON.parse(text) as AnalyzeImageResult;
    } catch (error) {
      console.error("Error analyzing image with Gemini:", error);
      throw error;
    }
  }

  static async generateExecutiveSummary(statsText: string): Promise<string> {
    const prompt = `
You are an expert city planner and data analyst. Read the following aggregated statistics for city incidents and generate a brief, professional, plain-text executive summary addressed to the Mayor. Do not include markdown formatting. Keep it concise, highlighting the most critical issues and trends.

Statistics:
${statsText}
`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Error generating summary with Gemini:", error);
      throw error;
    }
  }
}
