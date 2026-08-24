export interface ProblemUnderstanding {
  problem: string;
  device: string;
  symptoms: string[];
  category: string;
}

/**
 * Translate text from any supported Indian language to English.
 *
 * The user may speak Telugu, Hindi, Tamil, Kannada, Malayalam,
 * Marathi, Bengali, or English.
 */
export async function translateToEnglish(
  rawText: string
): Promise<string> {
  const prompt = `You are a translation assistant for a technician discovery application.

Translate the user's text into clear, natural English.

Rules:
- If the text is already English, return it unchanged or lightly normalize it.
- If the text is Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali, or another language, translate it into English.
- Preserve the actual meaning of the user's problem.
- Do not explain anything.
- Do not add information.
- Return ONLY the English translation as plain text.

User text:
${rawText}`;

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
        options: {
          temperature: 0,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama translation error: ${response.status}`);
    }

    const data = await response.json();

    const translatedText = data?.message?.content?.trim();

    if (!translatedText) {
      return rawText;
    }

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);

    // If translation fails, continue using the original text.
    return rawText;
  }
}


/**
 * Understand the translated English problem.
 */
export async function understandProblem(
  rawText: string
): Promise<ProblemUnderstanding> {
  const prompt = `You read a casual description of a broken appliance, home, agricultural equipment, or vehicle problem.

Extract structured information and respond with ONLY valid JSON.

The JSON must have exactly this shape:
{
  "problem": "clean normalized one-sentence restatement",
  "device": "device or system involved",
  "symptoms": ["short symptom phrase"],
  "category": "short service category"
}

Examples of categories:
"AC repair"
"plumbing"
"electrical"
"geyser repair"
"appliance repair"
"vehicle repair"
"agricultural equipment repair"
"drip irrigation"
"pump repair"
"painting"
"water tank cleaning"
"car dent repair"

User's problem:
${rawText}`;

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
        format: 'json',
        options: {
          temperature: 0,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();

    const content = data?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return {
      problem: parsed.problem ?? rawText,
      device: parsed.device ?? '',
      symptoms: Array.isArray(parsed.symptoms)
        ? parsed.symptoms
        : [],
      category: parsed.category ?? '',
    };
  } catch (error) {
    console.error('Llama error:', error);

    return {
      problem: rawText,
      device: '',
      symptoms: [],
      category: '',
    };
  }
}


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