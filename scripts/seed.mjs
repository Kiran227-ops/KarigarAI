// Seeds demo technicians + solved-problem posts
// using the SAME Hugging Face embedding model
// used by the application.
//
// Run:
// node scripts/seed.mjs

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { InferenceClient } from '@huggingface/inference';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const HF_TOKEN = process.env.HF_TOKEN;

const EMBEDDING_MODEL =
  'sentence-transformers/all-MiniLM-L6-v2';

if (!MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is missing from .env.local'
  );
}

if (!HF_TOKEN) {
  throw new Error(
    'HF_TOKEN is missing from .env.local'
  );
}

const hf = new InferenceClient(HF_TOKEN);

/* =========================================================
   MONGOOSE SCHEMAS
========================================================= */

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

const User =
  mongoose.models.User ||
  mongoose.model('User', UserSchema);

const TechnicianProfile =
  mongoose.models.TechnicianProfile ||
  mongoose.model(
    'TechnicianProfile',
    TechnicianProfileSchema
  );

const Post =
  mongoose.models.Post ||
  mongoose.model('Post', PostSchema);

/* =========================================================
   DEMO TECHNICIANS
========================================================= */

const demoTechnicians = [
  {
    name: 'Ravi Kumar',
    category: 'AC Technician',
    location: 'Hyderabad',
    skills: [
      'AC repair',
      'condensate drain',
      'gas refill',
    ],
    rating: 4.8,

    posts: [
      "Fixed a split AC that was running but wasn't cooling. There was water leakage from the indoor unit because the condensate drain was blocked. Cleaned the drain and restored full cooling.",

      "Repaired a window AC with weak airflow caused by a dirty filter and frozen coil. Defrosted the unit and cleaned the filter.",

      "Serviced an AC that was running continuously but not cooling properly. Checked refrigerant level, cleaned the filters and condenser, and restored normal cooling.",
    ],
  },

  {
    name: 'Suresh',
    category: 'AC Technician',
    location: 'Hyderabad',
    skills: [
      'AC repair',
      'drainage',
      'servicing',
    ],
    rating: 4.7,

    posts: [
      "Repaired a split AC with a drainage blockage causing water to drip inside the room and reduced cooling performance.",

      "Serviced an air conditioner that was not cooling properly. Cleaned the indoor filter and checked the refrigerant system.",
    ],
  },

  {
    name: 'Arjun',
    category: 'AC Technician',
    location: 'Secunderabad',
    skills: [
      'AC repair',
      'diagnostics',
    ],
    rating: 4.6,

    posts: [
      "Diagnosed an AC that was running continuously but not providing sufficient cooling. Low refrigerant gas was the cause, so the refrigerant was restored.",

      "Fixed an AC with poor cooling performance by diagnosing the condenser and refrigerant system.",
    ],
  },

  {
    name: 'Ravi Kumar (Geyser)',
    category: 'Geyser Technician',
    location: 'Hyderabad',
    skills: [
      'geyser repair',
      'heating element',
      'thermostat',
    ],
    rating: 4.8,

    posts: [
      "Repaired a 15L geyser that wasn't heating water. The heating element had failed, so I replaced it and tested the thermostat.",

      "Fixed a geyser that was producing cold water because the heating element was faulty.",
    ],
  },

  {
    name: 'Suresh Kumar',
    category: 'Appliance Technician',
    location: 'Hyderabad',
    skills: [
      'geyser repair',
      'thermostat',
      'appliance repair',
    ],
    rating: 4.7,

    posts: [
      "Fixed a geyser with a faulty heating element and a stuck thermostat that was preventing the water from heating properly.",

      "Repaired a home appliance with a faulty heating component and restored normal operation.",
    ],
  },

  {
    name: 'Imran',
    category: 'Electrician',
    location: 'Hyderabad',
    skills: [
      'wiring',
      'MCB',
      'switchboard',
    ],
    rating: 4.5,

    posts: [
      "Fixed frequent tripping of the main MCB caused by a short circuit in the kitchen switchboard wiring.",

      "Repaired an electrical switchboard with loose wiring that was causing intermittent power problems.",

      "Fixed a light that was not working because of a faulty switch and damaged wiring.",
    ],
  },

  {
    name: 'Mahesh',
    category: 'Plumber',
    location: 'Hyderabad',
    skills: [
      'leak repair',
      'pipe fitting',
    ],
    rating: 4.6,

    posts: [
      "Repaired a leaking kitchen sink pipe joint that was causing water to pool under the cabinet.",

      "Fixed a leaking bathroom water pipe by replacing the damaged pipe fitting.",

      "Repaired a leaking tap and replaced the faulty plumbing connection.",
    ],
  },

  {
    name: 'Ramesh',
    category: 'Washing Machine Technician',
    location: 'Hyderabad',
    skills: [
      'washing machine repair',
      'drainage',
      'motor repair',
    ],
    rating: 4.7,

    posts: [
      "Repaired a washing machine that was not draining water. The drain pump and blocked filter were causing the problem.",

      "Fixed a washing machine that was making unusual noise during the spin cycle and checked the motor and drum.",

      "Serviced a washing machine that was not starting properly and repaired the faulty door lock.",
    ],
  },

  {
    name: 'Vikram',
    category: 'Refrigerator Technician',
    location: 'Hyderabad',
    skills: [
      'refrigerator repair',
      'cooling',
      'compressor',
    ],
    rating: 4.6,

    posts: [
      "Repaired a refrigerator that was not cooling properly. Checked the compressor, condenser and refrigerant system.",

      "Fixed a fridge with poor cooling caused by a blocked condenser and dirty coils.",

      "Diagnosed a refrigerator that was running continuously but not getting cold enough.",
    ],
  },

  {
    name: 'Kiran',
    category: 'Bike Technician',
    location: 'Hyderabad',
    skills: [
      'bike repair',
      'engine',
      'battery',
    ],
    rating: 4.8,

    posts: [
      "Repaired a motorcycle that would not start. Diagnosed the battery and ignition system and restored the bike.",

      "Fixed a bike that was having starting problems because of a weak battery.",

      "Serviced a motorcycle with engine starting issues and checked the fuel and ignition systems.",
    ],
  },

  {
    name: 'Ajay',
    category: 'Car Technician',
    location: 'Hyderabad',
    skills: [
      'car repair',
      'battery',
      'engine',
    ],
    rating: 4.7,

    posts: [
      "Fixed a car that would not start because the battery was weak. Replaced the battery and tested the charging system.",

      "Diagnosed a car with engine starting problems and repaired the electrical connection.",

      "Serviced a car with battery and starting issues.",
    ],
  },

  {
    name: 'Naveen',
    category: 'Laptop Technician',
    location: 'Hyderabad',
    skills: [
      'laptop repair',
      'screen repair',
      'hardware',
    ],
    rating: 4.6,

    posts: [
      "Repaired a laptop with a broken screen by replacing the damaged display.",

      "Fixed a laptop that was overheating by cleaning the cooling system and replacing the thermal compound.",

      "Diagnosed a laptop that was not turning on and repaired the faulty power connection.",
    ],
  },

  {
    name: 'Prakash',
    category: 'Carpenter',
    location: 'Hyderabad',
    skills: [
      'carpentry',
      'wooden doors',
      'furniture repair',
    ],
    rating: 4.7,

    posts: [
      "Repaired a wooden door that was not closing properly and adjusted the hinges.",

      "Fixed damaged wooden furniture and restored the joints.",

      "Repaired a wooden cupboard with a damaged hinge and door alignment problem.",
    ],
  },

  {
    name: 'Srinivas',
    category: 'Painter',
    location: 'Hyderabad',
    skills: [
      'painting',
      'wall painting',
      'home painting',
    ],
    rating: 4.6,

    posts: [
      "Completed interior wall painting for a residential house and repaired minor wall cracks before painting.",

      "Painted a house interior after preparing and smoothing the walls.",

      "Completed exterior house painting and repaired damaged wall surfaces.",
    ],
  },

  {
    name: 'Raju',
    category: 'Pump Technician',
    location: 'Hyderabad',
    skills: [
      'water pump repair',
      'motor repair',
      'irrigation',
    ],
    rating: 4.8,

    posts: [
      "Repaired a water pump that was not starting. Diagnosed the motor and electrical connection.",

      "Fixed an agricultural water pump that had stopped working and restored the motor.",

      "Serviced a water pump used for irrigation and repaired the faulty motor connection.",
    ],
  },

  {
    name: 'Ganesh',
    category: 'Drip Irrigation Technician',
    location: 'Hyderabad',
    skills: [
      'drip irrigation',
      'irrigation pipes',
      'agriculture',
    ],
    rating: 4.8,

    posts: [
      "Repaired leaking drip irrigation pipes in an agricultural field and replaced damaged connectors.",

      "Fixed blocked drip irrigation lines and restored proper water flow.",

      "Installed and repaired a drip irrigation system for an agricultural field.",
    ],
  },

  {
    name: 'Lakshmi',
    category: 'Rangoli Artist',
    location: 'Hyderabad',
    skills: [
      'rangoli',
      'traditional rangoli',
      'decoration',
    ],
    rating: 4.9,

    posts: [
      "Created a traditional rangoli design for a house doorstep using traditional patterns and colors.",

      "Designed a decorative traditional rangoli for a festival celebration.",

      "Created a beautiful doorstep rangoli for a family function.",
    ],
  },
];

/* =========================================================
   HUGGING FACE EMBEDDING
========================================================= */

async function embed(text) {
  if (!text || !text.trim()) {
    throw new Error(
      'Cannot create embedding for empty text'
    );
  }

  const result = await hf.featureExtraction({
    model: EMBEDDING_MODEL,
    inputs: text,
  });

  if (!Array.isArray(result)) {
    throw new Error(
      'Invalid embedding returned by Hugging Face'
    );
  }

  if (
    result.length > 0 &&
    typeof result[0] === 'number'
  ) {
    return result.map(Number);
  }

  if (
    result.length > 0 &&
    Array.isArray(result[0])
  ) {
    return result[0].map(Number);
  }

  throw new Error(
    'Unexpected embedding format from Hugging Face'
  );
}

/* =========================================================
   MAIN
========================================================= */

async function main() {
  await mongoose.connect(MONGODB_URI);

  console.log('');
  console.log('==========================================');
  console.log('KarigarAI database seeding');
  console.log('==========================================');
  console.log(
    `Embedding model: ${EMBEDDING_MODEL}`
  );
  console.log('');

  /*
   * IMPORTANT:
   *
   * Old posts were generated with Ollama
   * nomic-embed-text.
   *
   * They are NOT compatible with the new
   * Hugging Face embeddings.
   *
   * Delete old posts so we don't mix
   * different embedding models.
   */

  console.log(
    'Removing old demo posts...'
  );

  await Post.deleteMany({});

  console.log(
    'Old posts removed.'
  );

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
      {
        userId: String(user._id),
      },
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
      {
        upsert: true,
      }
    );

    for (const content of tech.posts) {
      console.log(
        `Embedding post for ${tech.name}...`
      );

      const embedding = await embed(content);

      console.log(
        `Embedding dimensions: ${embedding.length}`
      );

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

      console.log(
        `✓ Added post for ${tech.name}`
      );
    }
  }

  console.log('');
  console.log('==========================================');
  console.log('Seeding completed successfully!');
  console.log('==========================================');
  console.log('');

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('');
  console.error('SEED ERROR:');
  console.error(error);
  process.exit(1);
});