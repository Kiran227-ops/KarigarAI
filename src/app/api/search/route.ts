import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import TechnicianProfile from '@/lib/models/TechnicianProfile';
import { understandProblem, buildSearchText } from '@/lib/ai/llm';
import { embedText } from '@/lib/ai/embeddings';
import { queryTopMatches } from '@/lib/ai/vectorstore';

// Problem -> AI understanding -> embedding -> semantic search -> top matches.
export async function POST(req: NextRequest) {
  const { problem } = await req.json();
  if (!problem || typeof problem !== 'string' || problem.trim().length < 5) {
    return NextResponse.json({ error: 'Describe your problem in a bit more detail' }, { status: 400 });
  }

  await connectDB();

  // 1. LLM understanding (structured fields shown in UI + used to build a
  //    cleaner string for embedding, per "don't do keyword search" requirement).
  const understanding = await understandProblem(problem);
  const searchText = buildSearchText(understanding);

  // 2. Embed the *understood* problem.
  const embedding = await embedText(searchText);

  // 3. Semantic search (Pinecone if configured, else local cosine similarity).
  const matches = await queryTopMatches(embedding, 3);

  if (matches.length === 0) {
    return NextResponse.json({ understanding, results: [] });
  }

  // 4. Hydrate posts + technician profiles from Mongo.
  const posts = await Post.find({ _id: { $in: matches.map((m) => m.postId) } }, { embedding: 0 }).lean();
  const postById = new Map(posts.map((p: any) => [String(p._id), p]));

  const technicianIds = [...new Set(posts.map((p: any) => p.technicianId))];
  const profiles = await TechnicianProfile.find({ userId: { $in: technicianIds } }).lean();
  const profileByUserId = new Map(profiles.map((p: any) => [p.userId, p]));

  const relevanceLabels = ['Best match', 'Also relevant', 'Also relevant'];

  const results = matches
    .map((m, i) => {
      const post = postById.get(m.postId);
      if (!post) return null;
      const technician = profileByUserId.get(post.technicianId);
      return {
        score: m.score,
        relevanceLabel: relevanceLabels[i] ?? 'Also relevant',
        post: {
          id: String(post._id),
          content: post.content,
          category: post.category,
          createdAt: post.createdAt,
        },
        technician: technician
          ? {
              id: technician.userId,
              name: technician.name,
              category: technician.category,
              location: technician.location,
              skills: technician.skills,
              rating: technician.rating,
            }
          : { id: post.technicianId, name: post.technicianName, category: post.category, location: post.location },
      };
    })
    .filter(Boolean);

  return NextResponse.json({ understanding, results });
}
