import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import TechnicianProfile from '@/lib/models/TechnicianProfile';
import { getSession } from '@/lib/session';

// Create or update the logged-in technician's profile.
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'technician') {
    return NextResponse.json({ error: 'Must be logged in as a technician' }, { status: 401 });
  }

  const { category, location, skills, bio } = await req.json();
  if (!category || !location) {
    return NextResponse.json({ error: 'category and location are required' }, { status: 400 });
  }

  await connectDB();

  const profile = await TechnicianProfile.findOneAndUpdate(
    { userId: session.id },
    {
      userId: session.id,
      name: session.name,
      category,
      location,
      skills: Array.isArray(skills) ? skills : [],
      bio: bio || '',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return NextResponse.json({ profile });
}

export async function GET() {
  await connectDB();
  const technicians = await TechnicianProfile.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ technicians });
}
