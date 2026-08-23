import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import TechnicianProfile from '@/lib/models/TechnicianProfile';
import Post from '@/lib/models/Post';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();

  const profile = await TechnicianProfile.findOne({ userId: params.id }).lean();
  if (!profile) {
    return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
  }

  const posts = await Post.find({ technicianId: params.id }, { embedding: 0 })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ profile, posts });
}
