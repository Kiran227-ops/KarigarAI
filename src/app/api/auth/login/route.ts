import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { SESSION_COOKIE } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { name, role } = await req.json();

  if (!name || typeof name !== 'string' || !['user', 'technician'].includes(role)) {
    return NextResponse.json({ error: 'name and a valid role are required' }, { status: 400 });
  }

  await connectDB();

  // Demo auth: one user document per (name, role) pair, no password.
  let user = await User.findOne({ name, role });
  if (!user) {
    user = await User.create({ name, role });
  }

  const session = { id: String(user._id), name: user.name, role: user.role };

  const res = NextResponse.json({ session });
  res.cookies.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
