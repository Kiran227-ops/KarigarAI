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

  if (
    !problem ||
    typeof problem !== 'string' ||
    problem.trim().length < 5
  ) {
    return NextResponse.json(
      { error: 'Describe your problem in a bit more detail' },
      { status: 400 }
    );
  }

  await connectDB();

  // 1. Understand the customer's problem
  const understanding = await understandProblem(problem);
  const searchText = buildSearchText(understanding);

  // 2. Create embedding
  const embedding = await embedText(searchText);

  // 3. Semantic search
  const matches = await queryTopMatches(embedding, 3);

  if (matches.length === 0) {
    return NextResponse.json({
      understanding,
      results: [],
    });
  }

  // 4. Get matching posts from MongoDB
  const posts = await Post.find(
    {
      _id: {
        $in: matches.map((m) => m.postId),
      },
    },
    {
      embedding: 0,
    }
  ).lean();

  const postById = new Map(
    posts.map((p: any) => [String(p._id), p])
  );

  // 5. Get technician profiles
  const technicianIds = [
    ...new Set(posts.map((p: any) => p.technicianId)),
  ];

  const profiles = await TechnicianProfile.find({
    userId: {
      $in: technicianIds,
    },
  }).lean();

  const profileByUserId = new Map(
    profiles.map((p: any) => [p.userId, p])
  );

  const relevanceLabels = [
    'Best match',
    'Also relevant',
    'Also relevant',
  ];

  // 6. Build search results
  const results = matches
    .map((m, i) => {
      const post = postById.get(m.postId);

      if (!post) return null;

      const technician = profileByUserId.get(
        post.technicianId
      );

      return {
        score: m.score,

        relevanceLabel:
          relevanceLabels[i] ?? 'Also relevant',

        // POST DATA
        post: {
          id: String(post._id),

          content: post.content,

          category: post.category,

          createdAt: post.createdAt,

          // ⭐ IMPORTANT: SEND IMAGE
          image: post.image ?? null,
        },

        // TECHNICIAN DATA
        technician: technician
          ? {
              id: technician.userId,

              name: technician.name,

              category: technician.category,

              location: technician.location,

              skills: technician.skills,

              rating: technician.rating,
            }
          : {
              id: post.technicianId,

              name: post.technicianName,

              category: post.category,

              location: post.location,

              skills: post.skills,

              rating: undefined,
            },
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    understanding,
    results,
  });
}