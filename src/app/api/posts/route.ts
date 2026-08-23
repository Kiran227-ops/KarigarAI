import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import TechnicianProfile from '@/lib/models/TechnicianProfile';
import { getSession } from '@/lib/session';
import { embedText } from '@/lib/ai/embeddings';
import { upsertPostVector } from '@/lib/ai/vectorstore';

// Technician writes up a problem they solved. This is the write side of
// the pipeline: store normally in Mongo AND embed + store as a vector.
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'technician') {
    return NextResponse.json({ error: 'Must be logged in as a technician' }, { status: 401 });
  }

  const { content } = await req.json();
  if (!content || typeof content !== 'string' || content.trim().length < 10) {
    return NextResponse.json({ error: 'content must be at least 10 characters' }, { status: 400 });
  }

  await connectDB();

  const profile = await TechnicianProfile.findOne({ userId: session.id });
  if (!profile) {
    return NextResponse.json(
      { error: 'Create your technician profile before posting' },
      { status: 400 }
    );
  }

  const embedding = await embedText(content);

  const post = await Post.create({
    technicianId: session.id,
    technicianName: profile.name,
    category: profile.category,
    location: profile.location,
    skills: profile.skills,
    content,
    embedding,
  });

  // No-op automatically if PINECONE_API_KEY isn't set.
  await upsertPostVector(
    {
      postId: String(post._id),
      technicianId: session.id,
      technicianName: profile.name,
      content,
      category: profile.category,
      location: profile.location,
      skills: profile.skills,
    },
    embedding
  );

  const { embedding: _omit, ...safePost } = post.toObject();
  return NextResponse.json({ post: safePost });
}

export async function GET(req: NextRequest) {
  await connectDB();
  const technicianId = req.nextUrl.searchParams.get('technicianId');
  const filter = technicianId ? { technicianId } : {};
  const posts = await Post.find(filter, { embedding: 0 }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ posts });
}
