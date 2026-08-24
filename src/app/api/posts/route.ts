import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import TechnicianProfile from '@/lib/models/TechnicianProfile';
import { getSession } from '@/lib/session';

import {
  translateToEnglish,
} from '@/lib/ai/llm';

import { embedText } from '@/lib/ai/embeddings';
import { upsertPostVector } from '@/lib/ai/vectorstore';

export async function POST(req: NextRequest) {
  try {
    // =====================================================
    // 1. Check technician login
    // =====================================================

    const session = getSession();

    if (!session || session.role !== 'technician') {
      return NextResponse.json(
        { error: 'Must be logged in as a technician' },
        { status: 401 }
      );
    }

    // =====================================================
    // 2. Receive FormData
    // =====================================================

    const formData = await req.formData();

    const content = formData.get('content') as string;
    const imageFile = formData.get('image') as File | null;

    // =====================================================
    // 3. Validate content
    // =====================================================

    if (
      !content ||
      typeof content !== 'string' ||
      content.trim().length < 10
    ) {
      return NextResponse.json(
        {
          error: 'Content must be at least 10 characters',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // =====================================================
    // 4. Find technician profile
    // =====================================================

    const profile = await TechnicianProfile.findOne({
      userId: session.id,
    });

    if (!profile) {
      return NextResponse.json(
        {
          error: 'Create your technician profile before posting',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 5. Translate technician's post to English
    // =====================================================

    const originalContent = content.trim();

    const englishContent = await translateToEnglish(
      originalContent
    );

    console.log('Original technician post:', originalContent);
    console.log('English technician post:', englishContent);

    // =====================================================
    // 6. Convert image to Base64
    // =====================================================

    let image: string | null = null;

    if (imageFile && imageFile.size > 0) {
      // Limit image size to 5 MB
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            error: 'Image must be smaller than 5MB',
          },
          { status: 400 }
        );
      }

      const bytes = await imageFile.arrayBuffer();

      const buffer = Buffer.from(bytes);

      image = `data:${imageFile.type};base64,${buffer.toString(
        'base64'
      )}`;
    }

    // =====================================================
    // 7. Generate embedding from ENGLISH content
    // =====================================================

    const embedding = await embedText(englishContent);

    // =====================================================
    // 8. Create MongoDB post
    // =====================================================

    const post = await Post.create({
      technicianId: session.id,

      technicianName: profile.name,

      category: profile.category,

      location: profile.location,

      skills: profile.skills,

      // Store English version
      content: englishContent,

      // Save image
      image,

      embedding,
    });

    // =====================================================
    // 9. Save vector for semantic search
    // =====================================================

    await upsertPostVector(
      {
        postId: String(post._id),

        technicianId: session.id,

        technicianName: profile.name,

        content: englishContent,

        category: profile.category,

        location: profile.location,

        skills: profile.skills,
      },
      embedding
    );

    // =====================================================
    // 10. Don't send embedding to frontend
    // =====================================================

    const {
      embedding: _omit,
      ...safePost
    } = post.toObject();

    return NextResponse.json({
      post: safePost,

      // Useful for testing
      originalContent,

      englishContent,
    });

  } catch (error) {
    console.error(
      'POST /api/posts error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create post',
      },
      { status: 500 }
    );
  }
}


// =========================================================
// GET POSTS
// =========================================================

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const technicianId =
      req.nextUrl.searchParams.get(
        'technicianId'
      );

    const filter = technicianId
      ? { technicianId }
      : {};

    const posts = await Post.find(
      filter,
      {
        embedding: 0,
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      posts,
    });

  } catch (error) {
    console.error(
      'GET /api/posts error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch posts',
      },
      { status: 500 }
    );
  }
}