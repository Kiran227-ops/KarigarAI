import { InferenceClient } from '@huggingface/inference';

const token = process.env.HF_TOKEN;

if (!token) {
  throw new Error('HF_TOKEN is missing from environment variables');
}

const hf = new InferenceClient(token);

// Hugging Face embedding model
export const EMBEDDING_MODEL =
  'sentence-transformers/all-MiniLM-L6-v2';

export async function embedText(
  text: string
): Promise<number[]> {
  if (!text || !text.trim()) {
    throw new Error('Cannot create embedding for empty text');
  }

  const result = await hf.featureExtraction({
    model: EMBEDDING_MODEL,
    inputs: text,
  });

  // Hugging Face can return a nested array
  if (Array.isArray(result)) {
    const first = result[0];

    if (Array.isArray(first)) {
      return first.map(Number);
    }

    return result.map(Number);
  }

  throw new Error('Invalid embedding returned by Hugging Face');
}