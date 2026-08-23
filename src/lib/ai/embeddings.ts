export const EMBEDDING_MODEL = 'nomic-embed-text';

export async function embedText(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding error: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.embedding)) {
    throw new Error('Ollama returned an invalid embedding');
  }

  return data.embedding;
}