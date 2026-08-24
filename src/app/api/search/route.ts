import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import TechnicianProfile from '@/lib/models/TechnicianProfile';

import {
  translateToEnglish,
  understandProblem,
  buildSearchText,
} from '@/lib/ai/llm';

import { embedText } from '@/lib/ai/embeddings';
import { queryTopMatches } from '@/lib/ai/vectorstore';

export async function POST(req: NextRequest) {
  try {
    const { problem } = await req.json();

    // Validate input
    if (
      !problem ||
      typeof problem !== 'string' ||
      problem.trim().length < 5
    ) {
      return NextResponse.json(
        {
          error:
            'Describe your problem in a bit more detail',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const originalProblem = problem.trim();

    // =====================================================
    // 1. Translate customer language to English
    // =====================================================

    const translatedProblem =
      await translateToEnglish(originalProblem);

    console.log(
      'Original problem:',
      originalProblem
    );

    console.log(
      'Translated problem:',
      translatedProblem
    );

    // =====================================================
    // 2. Understand the translated problem
    // =====================================================

    const understanding =
      await understandProblem(translatedProblem);

    console.log(
      'AI understanding:',
      understanding
    );

    // =====================================================
    // 3. Build search text
    // =====================================================

    const searchText =
      buildSearchText(understanding);

    console.log(
      'Search text:',
      searchText
    );

    // =====================================================
    // 4. Generate embedding
    // =====================================================

    const embedding =
      await embedText(searchText);

    // =====================================================
    // 5. Semantic search
    // =====================================================

    const matches =
      await queryTopMatches(
        embedding,
        3
      );

    // =====================================================
    // No matching posts
    // =====================================================

    if (matches.length === 0) {
      return NextResponse.json({
        originalProblem,
        translatedProblem,
        understanding,
        results: [],
      });
    }

    // =====================================================
    // 6. Get posts from MongoDB
    // =====================================================

    const posts = await Post.find(
      {
        _id: {
          $in: matches.map(
            (m) => m.postId
          ),
        },
      },
      {
        embedding: 0,
      }
    ).lean();

    const postById = new Map(
      posts.map((p: any) => [
        String(p._id),
        p,
      ])
    );

    // =====================================================
    // 7. Get technician profiles
    // =====================================================

    const technicianIds = [
      ...new Set(
        posts.map(
          (p: any) => p.technicianId
        )
      ),
    ];

    const profiles =
      await TechnicianProfile.find({
        userId: {
          $in: technicianIds,
        },
      }).lean();

    const profileByUserId =
      new Map(
        profiles.map((p: any) => [
          p.userId,
          p,
        ])
      );

    // =====================================================
    // 8. Build results
    // =====================================================

    const relevanceLabels = [
      'Best match',
      'Also relevant',
      'Also relevant',
    ];

    const results = matches
      .map((m, i) => {
        const post =
          postById.get(m.postId);

        if (!post) {
          return null;
        }

        const technician =
          profileByUserId.get(
            post.technicianId
          );

        return {
          score: m.score,

          relevanceLabel:
            relevanceLabels[i] ??
            'Also relevant',

          post: {
            id: String(post._id),

            content:
              post.content,

            category:
              post.category,

            createdAt:
              post.createdAt,

            // Send image to frontend
            image:
              post.image ?? null,
          },

          technician: technician
            ? {
                id:
                  technician.userId,

                name:
                  technician.name,

                category:
                  technician.category,

                location:
                  technician.location,

                skills:
                  technician.skills,

                rating:
                  technician.rating,
              }
            : {
                id:
                  post.technicianId,

                name:
                  post.technicianName,

                category:
                  post.category,

                location:
                  post.location,

                skills:
                  post.skills,

                rating:
                  undefined,
              },
        };
      })
      .filter(
        (
          result
        ): result is NonNullable<
          typeof result
        > => result !== null
      );

    // =====================================================
    // 9. Return response
    // =====================================================

    return NextResponse.json({
      originalProblem,
      translatedProblem,
      understanding,
      results,
    });
  } catch (error) {
    console.error(
      'POST /api/search error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Search failed',
      },
      {
        status: 500,
      }
    );
  }
}