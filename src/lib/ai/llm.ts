import { InferenceClient } from '@huggingface/inference';

export interface ProblemUnderstanding {
  problem: string;
  device: string;
  symptoms: string[];
  category: string;
}

const token = process.env.HF_TOKEN;

const MODEL = 'Qwen/Qwen2.5-7B-Instruct-1M';

const hf = token ? new InferenceClient(token) : null;

async function askAI(prompt: string): Promise<string> {
  if (!hf) {
    throw new Error('HF_TOKEN is missing from environment variables');
  }

  const response = await hf.chatCompletion({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0,
    max_tokens: 500,
  });

  return response.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Translate customer problem into English.
 */
export async function translateToEnglish(
  rawText: string
): Promise<string> {
  if (!rawText.trim()) {
    return rawText;
  }

  const prompt = `
You are a translation assistant for a technician discovery application.

Translate the following customer problem into clear English.

Rules:
- If already English, return it unchanged.
- If it is Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi,
  Bengali, or another language, translate it into English.
- Preserve the exact meaning.
- Do not add information.
- Do not explain anything.
- Return ONLY the English translation.

Customer problem:
${rawText}
`;

  try {
    const result = await askAI(prompt);

    return result || rawText;
  } catch (error) {
    console.error('Translation error:', error);

    // If AI translation fails, continue with original text.
    return rawText;
  }
}

/**
 * Understand customer problem.
 */
export async function understandProblem(
  rawText: string
): Promise<ProblemUnderstanding> {

  const prompt = `
You are an AI assistant for a technician discovery application.

Analyze the customer's problem and return ONLY valid JSON.

Required JSON format:

{
  "problem": "one sentence describing the problem",
  "device": "device or system involved",
  "symptoms": ["symptom 1", "symptom 2"],
  "category": "service category"
}

Possible categories:

AC repair
plumbing
electrical
geyser repair
appliance repair
vehicle repair
agricultural equipment repair
drip irrigation
pump repair
painting
water tank cleaning
car dent repair
carpentry
cleaning
general maintenance
home & property maintenance

Important rules:

- If the problem is about creating or designing rangoli,
  classify it as "home & property maintenance".
- Do not invent technical problems.
- Keep symptoms short.
- The problem should be a clean one-sentence description.
- device can be empty if there is no device.
- symptoms can be an empty array if there are no symptoms.
- Return ONLY JSON.
- Do NOT use markdown.
- Do NOT wrap JSON in ```.

Customer problem:
${rawText}
`;

  try {
    const content = await askAI(prompt);

    console.log('AI raw response:', content);

    // Remove accidental markdown fences.
    const cleaned = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      problem:
        typeof parsed.problem === 'string'
          ? parsed.problem
          : rawText,

      device:
        typeof parsed.device === 'string'
          ? parsed.device
          : '',

      symptoms:
        Array.isArray(parsed.symptoms)
          ? parsed.symptoms.filter(
              (item: unknown): item is string =>
                typeof item === 'string'
            )
          : [],

      category:
        typeof parsed.category === 'string'
          ? parsed.category
          : '',
    };

  } catch (error) {
    console.error('Problem understanding error:', error);

    // Don't break the whole search if AI fails.
    return {
      problem: rawText,
      device: '',
      symptoms: [],
      category: '',
    };
  }
}

/**
 * Build semantic-search text.
 */
export function buildSearchText(
  u: ProblemUnderstanding
): string {
  return [
    u.problem,
    u.device,
    u.symptoms.join(', '),
    u.category,
  ]
    .filter(Boolean)
    .join('. ');
}