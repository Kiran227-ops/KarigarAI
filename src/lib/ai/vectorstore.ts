import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import { Pinecone } from '@pinecone-database/pinecone';

export const isPineconeEnabled = !!process.env.PINECONE_API_KEY;

let cachedIndex: ReturnType<Pinecone['index']> | null = null;

function getIndex() {
  if (cachedIndex) return cachedIndex;

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });

  cachedIndex = pc.index(
    process.env.PINECONE_INDEX_NAME || 'technician-posts'
  );

  return cachedIndex;
}

export interface PostVectorMetadata {
  postId: string;
  technicianId: string;
  technicianName: string;
  content: string;
  category: string;
  location: string;
  skills: string[];
}

/**
 * Upserts a post's embedding into Pinecone.
 * No-op when Pinecone isn't configured.
 */
export async function upsertPostVector(
  meta: PostVectorMetadata,
  embedding: number[]
) {
  if (!isPineconeEnabled) return;

  const index = getIndex();

  await index.upsert([
    {
      id: meta.postId,
      values: embedding,
      metadata: {
        postId: meta.postId,
        technicianId: meta.technicianId,
        technicianName: meta.technicianName,
        content: meta.content,
        category: meta.category,
        location: meta.location,
        skills: meta.skills,
      },
    },
  ]);
}

export function cosineSimilarity(
  a: number[],
  b: number[]
): number {
  // Protect against missing or invalid embeddings
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  if (a.length === 0 || b.length === 0) return 0;

  // Embeddings must have the same dimensions
  if (a.length !== b.length) return 0;

  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  if (na === 0 || nb === 0) return 0;

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface VectorMatch {
  postId: string;
  score: number;
}

/**
 * Returns the top-K matching post IDs + similarity scores.
 *
 * Uses Pinecone if configured.
 * Otherwise scans MongoDB and performs cosine similarity locally.
 */
export async function queryTopMatches(
  embedding: number[],
  topK = 3
): Promise<VectorMatch[]> {
  if (isPineconeEnabled) {
    const index = getIndex();

    const result = await index.query({
      vector: embedding,
      topK,
      includeMetadata: false,
    });

    return (result.matches || [])
      .filter((m) => !!m.id)
      .map((m) => ({
        postId: m.id as string,
        score: m.score ?? 0,
      }));
  }

  await connectDB();

  const posts = await Post.find(
    {},
    { embedding: 1 }
  ).lean();

  // Ignore old/invalid posts that don't have embeddings
  const scored = posts
    .filter(
      (p: any) =>
        Array.isArray(p.embedding) &&
        p.embedding.length > 0
    )
    .map((p: any) => ({
      postId: String(p._id),
      score: cosineSimilarity(
        embedding,
        p.embedding
      ),
    }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}