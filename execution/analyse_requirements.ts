import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateSchema } from "./utils/schema_validator";
import { logger } from "./utils/logger";
import * as dotenv from "dotenv";

dotenv.config();

export interface AnalyzeRequest {
  userRequirements: string;
  systemPrompt: string;
  fewShotExamples?: string[];
  model?: string;
  temperature?: number;
}

export async function analyzeRequirements(req: AnalyzeRequest): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = req.model || 'gemini-1.5-flash';
  const temperature = req.temperature || 0.1;

  await logger.logInfo('analyzeRequirements', `Starting analysis with ${modelName}`);

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: temperature,
        responseMimeType: "application/json",
      },
    });

    // Construct the prompt with system instructions and few-shot examples
    let fullPrompt = `${req.systemPrompt}\n\n`;
    
    if (req.fewShotExamples && req.fewShotExamples.length > 0) {
      fullPrompt += "### Examples:\n";
      req.fewShotExamples.forEach((ex, i) => {
        fullPrompt += `Example ${i + 1}:\n${ex}\n\n`;
      });
    }

    fullPrompt += `### User Requirements:\n${req.userRequirements}\n\nReturn the structured JSON schema now:`;

    await logger.logInfo('analyzeRequirements', 'Invoking Gemini...');
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();

    let parsedJson;
    try {
      parsedJson = JSON.parse(content);
    } catch (e) {
      await logger.logError('analyzeRequirements', 'Gemini Output was not valid JSON string', content);
      throw new Error('Gemini did not return parseable JSON.');
    }

    await logger.logInfo('analyzeRequirements', 'Gemini returned valid JSON structure. Validating schema...');

    // Validate output matches expected types
    const validationResult = validateSchema(parsedJson);

    if (!validationResult.isValid) {
      await logger.logError('analyzeRequirements', 'Schema Validation Failed', validationResult.errors);
      throw new Error(`Generated Schema represents invalid database structure. Errors: ${JSON.stringify(validationResult.errors)}`);
    }

    await logger.logInfo('analyzeRequirements', 'Analysis complete and strictly validated.');
    
    return validationResult.data;

  } catch (error: any) {
    await logger.logError('analyzeRequirements', 'Fatal Gemini execution error', error.message);
    throw error;
  }
}
