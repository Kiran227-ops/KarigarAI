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

/* =========================================================
   TRANSLATION
========================================================= */

export async function translateToEnglish(
  rawText: string
): Promise<string> {
  const text = rawText.trim();

  if (!text) {
    return text;
  }

  const prompt = `
You are a translation assistant for KarigarAI.

Translate the customer's message into clear natural English.

The message can be:
- English
- Telugu
- Hindi
- Tamil
- Kannada
- Malayalam
- Marathi
- Bengali
- Hinglish
- Telugu + English
- Hindi + English
- any other mixed language

Rules:
- Preserve the exact meaning.
- Do not add information.
- Do not remove information.
- Keep device names and service names.
- If already English, return the same meaning in English.
- Return ONLY the translated English sentence.
- No explanation.
- No JSON.
- No markdown.

Customer message:
${text}
`;

  try {
    const result = await askAI(prompt);

    return result.trim() || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

/* =========================================================
   JSON EXTRACTION
========================================================= */

function extractJSON(content: string): any {
  const cleaned = content
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
      const jsonText = cleaned.slice(start, end + 1);

      return JSON.parse(jsonText);
    }

    throw new Error('AI did not return valid JSON');
  }
}

/* =========================================================
   PROBLEM UNDERSTANDING
========================================================= */

export async function understandProblem(
  rawText: string
): Promise<ProblemUnderstanding> {
  const text = rawText.trim();

  if (!text) {
    return {
      problem: '',
      device: '',
      symptoms: [],
      category: '',
    };
  }

  const prompt = `
You are the AI problem classifier for KarigarAI.

Understand ANY customer request and identify the correct
service required.

The customer may describe:

HOME SERVICES:
plumbing, electrical, carpentry, painting, cleaning,
masonry, welding, home maintenance, water tank cleaning,
pest control, gardening, landscaping

APPLIANCES:
AC, refrigerator, washing machine, dishwasher, microwave,
oven, geyser, water purifier, cooler, fan, television,
mixer, grinder

ELECTRONICS:
mobile phone, laptop, computer, printer, CCTV,
Wi-Fi router, television, electronics

VEHICLES:
car, bike, motorcycle, scooter, auto, truck, tractor,
battery, tyre, engine, servicing, dent repair

AGRICULTURE:
drip irrigation, irrigation, water pump, borewell,
tractor, agricultural machinery, farming equipment

OTHER:
welding, fabrication, locksmith, solar panel, inverter,
battery, generator, RO service, rangoli, decoration,
general maintenance

IMPORTANT:

Classify according to the ACTUAL SERVICE REQUEST.

Examples:

AC is not cooling
=> AC repair

fan is making noise
=> fan repair

washing machine is not draining
=> washing machine repair

fridge is not cooling
=> refrigerator repair

pipe is leaking
=> plumbing

light is not working
=> electrical

water pump is not starting
=> pump repair

bike won't start
=> bike repair

car battery is dead
=> car repair

laptop screen is broken
=> laptop repair

phone display is damaged
=> mobile phone repair

paint my house
=> painting

wooden door needs repair
=> carpentry

need traditional rangoli for doorstep
=> rangoli and decoration

drip irrigation pipe is leaking
=> drip irrigation

Do NOT force everything into "general maintenance".

Create a useful and specific service category.

Return ONLY valid JSON.

Use EXACTLY this structure:

{
  "problem": "one clear sentence describing the customer's request",
  "device": "main device, object, vehicle or system",
  "symptoms": ["actual symptoms or requirements"],
  "category": "specific service category"
}

Rules:

problem:
- Describe the actual request.
- One clear sentence.
- Do not invent information.

device:
- Main device/object/system.
- Empty string if there is no specific device.

symptoms:
- Actual symptoms or requirements.
- Short phrases.
- Empty array if none.

category:
- Specific service needed.
- Use the most useful category for technician matching.

Customer message:
${text}
`;

  try {
    const content = await askAI(prompt);

    console.log('AI raw response:', content);

    const parsed = extractJSON(content);

    const problem =
      typeof parsed.problem === 'string' &&
      parsed.problem.trim()
        ? parsed.problem.trim()
        : text;

    const device =
      typeof parsed.device === 'string'
        ? parsed.device.trim()
        : '';

    const symptoms =
      Array.isArray(parsed.symptoms)
        ? parsed.symptoms
            .filter(
              (item: unknown): item is string =>
                typeof item === 'string'
            )
            .map((item: string) => item.trim())
            .filter(Boolean)
        : [];

    const category =
      typeof parsed.category === 'string'
        ? parsed.category.trim()
        : '';

    return {
      problem,
      device,
      symptoms,
      category,
    };
  } catch (error) {
    console.error(
      'Problem understanding error:',
      error
    );

    /*
     * IMPORTANT:
     * If Hugging Face fails, don't destroy the
     * customer's original search query.
     */
    return {
      problem: text,
      device: '',
      symptoms: [],
      category: '',
    };
  }
}

/* =========================================================
   SEARCH TEXT
========================================================= */

export function buildSearchText(
  u: ProblemUnderstanding
): string {
  return [
    u.problem,
    u.device,
    ...u.symptoms,
    u.category,
  ]
    .filter(
      (value) =>
        typeof value === 'string' &&
        value.trim().length > 0
    )
    .join('. ');
}