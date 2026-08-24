import { InferenceClient } from '@huggingface/inference';

const token = process.env.HF_TOKEN;

const EMBEDDING_MODEL =
  'sentence-transformers/all-MiniLM-L6-v2';

const hf = token
  ? new InferenceClient(token)
  : null;

export async function embedText(
  text: string
): Promise<number[]> {
  const input = text.trim();

  if (!input) {
    throw new Error(
      'Cannot create embedding for empty text'
    );
  }

  if (!hf) {
    throw new Error(
      'HF_TOKEN is missing from environment variables'
    );
  }

  try {
    const result = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: input,
    });

    if (!Array.isArray(result)) {
      throw new Error(
        'Invalid embedding returned by Hugging Face'
      );
    }

    // Handle [number, number, ...]
    if (
      result.length > 0 &&
      typeof result[0] === 'number'
    ) {
      return result.map(Number);
    }

    // Handle [[number, number, ...]]
    if (
      result.length > 0 &&
      Array.isArray(result[0])
    ) {
      return (result[0] as number[]).map(Number);
    }

    throw new Error(
      'Unexpected embedding format from Hugging Face'
    );
  } catch (error) {
    console.error(
      'Embedding generation error:',
      error
    );

    throw error;
  }
}

export { EMBEDDING_MODEL };