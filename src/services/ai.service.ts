import { EnvHandler } from "@/handlers/env.handler";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/prisma/client";

const genAI = new GoogleGenerativeAI(EnvHandler.instance.GEMINI_API_KEY);

export interface AnalyzeImageResult {
  category: string;
  categoryId: number | null;
  title: string;
  description: string;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 40000
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable = error?.status === 429 || error?.status === 503;
      if (isRetryable && attempt < retries - 1) {
        // Use retryDelay from error if available, otherwise use default
        const retryDelay = error?.errorDetails?.find((d: any) =>
          d["@type"]?.includes("RetryInfo")
        )?.retryDelay;
        const waitMs = retryDelay
          ? Math.ceil(parseFloat(retryDelay)) * 1000 + 1000
          : delayMs;
        console.warn(
          `Gemini quota hit, retrying in ${waitMs}ms... (attempt ${
            attempt + 1
          }/${retries})`
        );
        await new Promise((res) => setTimeout(res, waitMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export class AiService {
  static async analyzeImage(
    buffer: Buffer,
    mimeType: string
  ): Promise<AnalyzeImageResult> {
    const base64Data = buffer.toString("base64");

    let reportCategories: { reportCategoryId: number; name: string }[] = [];
    try {
      reportCategories = await prisma.reportCategory.findMany({
        select: { reportCategoryId: true, name: true },
      });
    } catch (error) {
      console.error(
        "Failed to fetch report categories from DB, falling back to empty list",
        error
      );
    }

    const categoryNames = reportCategories.map((category) => category.name);
    if (categoryNames.length === 0) {
      categoryNames.push("Other");
    }

    const prompt = `
    You are an expert Smart City incident analyzer. Analyze this image and extract concise details for a public report.
    Return ONLY a strict JSON object with the following schema:
    {
      "category": "<one of the predefined categories>",
      "title": "<a short, descriptive title>",
      "description": "<a brief incident description>"
    }

Allowed categories (choose EXACTLY one of these names):
${categoryNames.map((category) => `- ${category}`).join("\n")}

If the image doesn't clearly match a category, use the closest match from the list above.
Make sure the JSON is valid and "category" is exactly one of the allowed strings.
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
      const parsed = JSON.parse(text) as Omit<AnalyzeImageResult, "categoryId">;

      const matched = reportCategories.find(
        (category) =>
          category.name.toLowerCase() === parsed.category?.toLowerCase()
      );

      return {
        ...parsed,
        categoryId: matched?.reportCategoryId ?? null,
      };
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

  static async getSeverity(description: string): Promise<number> {
    const prompt = `
You are an expert Smart City incident analyzer. Evaluate the severity of the following incident description on a scale of 1 to 10.
- 1-3: Low (minor graffiti, small pothole, non-blocking trash)
- 4-6: Medium (clogged drain, broken streetlight, large pothole)
- 7-8: High (broken water main, major road obstruction, dangerous electrical wires)
- 9-10: Critical (immediate danger to life, gas leak, building collapse)

Return ONLY a strict JSON object with the following schema:
{
  "severity": <number between 1 and 10>
}

Description:
${description}
`;

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const parsed = JSON.parse(text);

      return Math.min(Math.max(Number(parsed.severity) || 1, 1), 10);
    } catch (error) {
      console.error("Error getting severity from Gemini:", error);
      return 1; // Default to 1 on error
    }
  }

  static async generateMayorInsights(
    statsText: string
  ): Promise<{ insight: string; action_type: string }> {
    const prompt = `
You are an expert city planner and data analyst advising the Mayor. Based on the following aggregated statistics of city reports, analyze and detect any critical issues, spikes in specific categories, or geographic clusters.
Provide a concise, professional, executive-level insight string for the Mayor's dashboard. Do not include markdown formatting in the insight.
Also recommend exactly one of the following action types based on the insight:
- 'DEPLOY_WORKERS' (e.g. for potholes, plumbing, cleanup spikes)
- 'INVESTIGATE_INFRASTRUCTURE' (e.g. for electrical, safety hazards, large infrastructure issues)
- 'PUBLIC_ALERT' (e.g. for widespread safety hazards or major emergencies)
- 'RESOLVE_URGENT' (e.g. for specific urgent safety/critical hazards)
- 'MONITOR' (e.g. if everything is normal or low activity)

Statistics:
${statsText}

Return ONLY a strict JSON object with the following schema:
{
  "insight": "<generated insight string>",
  "action_type": "<one of the action types listed above>"
}
`;

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await withRetry(() => model.generateContent(prompt));
      const response = await result.response;
      const text = response.text();
      const parsed = JSON.parse(text);

      return {
        insight: parsed.insight || "No critical issues detected.",
        action_type: parsed.action_type || "MONITOR",
      };
    } catch (error) {
      console.error("Error generating mayor insights with Gemini:", error);
      return {
        insight:
          "Unable to generate insights at this time due to service error.",
        action_type: "MONITOR",
      };
    }
  }

  static async generatePulseSummary(descriptions: string): Promise<string> {
    const prompt = `
You are an AI citizen sentiment analyzer. Summarize the public pulse and mood based on the following recent citizen reports in the city.
Generate a concise, single-sentence summary (around 15-20 words, max 25 words) that reflects the main issues reported. Do not use markdown or quotes.
Example: "Public sentiment is positive on park renovations, but south district concerns are rising."

Recent report descriptions:
${descriptions}
`;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim().replace(/^"|"$/g, "");
    } catch (error) {
      console.error("Error generating pulse summary with Gemini:", error);
      return "Public sentiment is positive on park renovations, but south district concerns are rising.";
    }
  }

  static async generateCityImprovementRecommendations(
    metricsText: string,
    slaText: string,
    sentimentText: string,
    urgentText: string
  ): Promise<
    Array<{
      title: string;
      description: string;
      category: string;
      impact: string;
    }>
  > {
    const prompt = `
You are an expert city planner and data analyst advising the Mayor. Based on the following aggregated city metrics, SLA status of various departments, citizen sentiment, and critical/urgent issues, generate a list of 3-4 key actionable recommendations for improving the city.
Ensure the recommendations are professional, clear, in English, and highly actionable.

City Metrics:
${metricsText}

Department SLA Status:
${slaText}

Citizen Sentiment & Pulse:
${sentimentText}

Critical Alerts & Urgent Issues:
${urgentText}

Return ONLY a strict JSON array of objects, where each object has the following schema:
[
  {
    "title": "<Concise recommendation title>",
    "description": "<One concise sentence, max 20 words, actionable and specific>",
    "category": "<One of: 'Infrastructure', 'Service Delivery', 'Public Safety', 'Citizen Engagement', 'Environment'>",
    "impact": "<One of: 'High', 'Medium', 'Low'>"
  }
]
`;

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await withRetry(() => model.generateContent(prompt));
      const response = await result.response;
      const text = response.text();
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          title: String(item.title || "Improvement Initiative"),
          description: String(
            item.description || "Take proactive action on city reports."
          ),
          category: [
            "Infrastructure",
            "Service Delivery",
            "Public Safety",
            "Citizen Engagement",
            "Environment",
          ].includes(item.category)
            ? item.category
            : "Service Delivery",
          impact: ["High", "Medium", "Low"].includes(item.impact)
            ? item.impact
            : "Medium",
        }));
      }
      throw new Error("Gemini response is not an array");
    } catch (error) {
      console.error(
        "Error generating city recommendations with Gemini:",
        error
      );
      return [
        {
          title: "Prioritize Critical Overdue Reports",
          description:
            "Several safety and high-severity issues have exceeded their target SLA. Focus resources on resolving these urgent complaints first.",
          category: "Public Safety",
          impact: "High",
        },
        {
          title: "Optimize Department Response Times",
          description:
            "Identify and resolve bottlenecks in departments showing lower SLA compliance to improve overall citizen satisfaction.",
          category: "Service Delivery",
          impact: "High",
        },
        {
          title: "Proactively Address Active Clusters",
          description:
            "Monitor coordinates of frequent reports to deploy preventive maintenance teams and lower recurrence rates.",
          category: "Infrastructure",
          impact: "Medium",
        },
      ];
    }
  }
}
