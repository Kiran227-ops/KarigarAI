export interface ProblemUnderstanding {
  problem: string;
  device: string;
  symptoms: string[];
  category: string;
}

export async function understandProblem(
  rawText: string
): Promise<ProblemUnderstanding> {
  const prompt = `You read a casual description of a broken appliance, home, or vehicle problem.

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
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
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

export function buildSearchText(u: ProblemUnderstanding): string {
  return [
    u.problem,
    u.device,
    u.symptoms.join(', '),
    u.category,
  ]
    .filter(Boolean)
    .join('. ');
}