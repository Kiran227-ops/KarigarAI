// Seeds demo technicians + solved-problem posts with local embeddings.
//
// Run with: node scripts/seed.mjs

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  role: String,
  createdAt: Date,
});

const TechnicianProfileSchema = new mongoose.Schema({
  userId: String,
  name: String,
  category: String,
  location: String,
  skills: [String],
  bio: String,
  rating: Number,
  createdAt: Date,
});

const PostSchema = new mongoose.Schema({
  technicianId: String,
  technicianName: String,
  category: String,
  location: String,
  skills: [String],
  content: String,
  embedding: [Number],
  createdAt: Date,
});

const User = mongoose.model('User', UserSchema);
const TechnicianProfile = mongoose.model(
  'TechnicianProfile',
  TechnicianProfileSchema
);
const Post = mongoose.model('Post', PostSchema);

const demoTechnicians = [
  {
    name: 'Ravi Kumar',
    category: 'AC Technician',
    location: 'Hyderabad',
    skills: ['AC repair', 'condensate drain', 'gas refill'],
    rating: 4.8,
    posts: [
      "Fixed a split AC that was running but wasn't cooling. There was water leakage from the indoor unit — the condensate drain was blocked. Cleaned the drain and restored full cooling.",
      "Repaired a window AC with weak airflow caused by a dirty filter and frozen coil. Defrosted the unit and cleaned the filter.",
    ],
  },
  {
    name: 'Suresh',
    category: 'AC Technician',
    location: 'Hyderabad',
    skills: ['AC repair', 'drainage', 'servicing'],
    rating: 4.7,
    posts: [
      "Repaired a split AC with a drainage blockage causing water to drip inside the room and reduced cooling performance.",
    ],
  },
  {
    name: 'Arjun',
    category: 'AC Technician',
    location: 'Secunderabad',
    skills: ['AC repair', 'diagnostics'],
    rating: 4.6,
    posts: [
      "Diagnosed an AC that was running continuously but not providing sufficient cooling — low refrigerant gas was the cause, topped up the gas.",
    ],
  },
  {
    name: 'Ravi Kumar (Geyser)',
    category: 'Geyser Technician',
    location: 'Hyderabad',
    skills: ['geyser repair', 'heating element', 'thermostat'],
    rating: 4.8,
    posts: [
      "Repaired a 15L geyser that wasn't heating water. The heating element had failed, so I replaced it and tested the thermostat.",
    ],
  },
  {
    name: 'Suresh Kumar',
    category: 'Appliance Technician',
    location: 'Hyderabad',
    skills: ['geyser repair', 'thermostat', 'appliance repair'],
    rating: 4.7,
    posts: [
      "Fixed a geyser with a faulty heating element and a stuck thermostat that was preventing the water from heating properly.",
    ],
  },
  {
    name: 'Imran',
    category: 'Electrician',
    location: 'Hyderabad',
    skills: ['wiring', 'MCB', 'switchboard'],
    rating: 4.5,
    posts: [
      "Fixed frequent tripping of the main MCB caused by a short circuit in the kitchen switchboard wiring.",
    ],
  },
  {
    name: 'Mahesh',
    category: 'Plumber',
    location: 'Hyderabad',
    skills: ['leak repair', 'pipe fitting'],
    rating: 4.6,
    posts: [
      "Repaired a leaking kitchen sink pipe joint that was causing water to pool under the cabinet.",
    ],
  },
];

async function embed(text) {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama embedding error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data.embedding)) {
    throw new Error('Ollama returned an invalid embedding');
  }

  return data.embedding;
}

async function main() {
  if (!MONGODB_URI) {
    throw new Error('Set MONGODB_URI in .env.local');
  }

  await mongoose.connect(MONGODB_URI);

  console.log('Connected to MongoDB. Seeding with local embeddings…');

  for (const tech of demoTechnicians) {
    const username = tech.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const email = `${username}@demo.local`;

    let user = await User.findOne({
      name: tech.name,
      role: 'technician',
    });

    if (!user) {
      user = await User.create({
        name: tech.name,
        username,
        email,
        role: 'technician',
        createdAt: new Date(),
      });
    } else {
      user.username = username;
      user.email = email;
      await user.save();
    }

    await TechnicianProfile.findOneAndUpdate(
      { userId: String(user._id) },
      {
        userId: String(user._id),
        name: tech.name,
        category: tech.category,
        location: tech.location,
        skills: tech.skills,
        bio: '',
        rating: tech.rating,
        createdAt: new Date(),
      },
      { upsert: true }
    );

    for (const content of tech.posts) {
      const exists = await Post.findOne({
        technicianId: String(user._id),
        content,
      });

      if (exists) continue;

      console.log(`  Embedding post for ${tech.name}...`);

      const embedding = await embed(content);

      await Post.create({
        technicianId: String(user._id),
        technicianName: tech.name,
        category: tech.category,
        location: tech.location,
        skills: tech.skills,
        content,
        embedding,
        createdAt: new Date(),
      });

      console.log(`  + post for ${tech.name}`);
    }
  }

  console.log('Done.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});