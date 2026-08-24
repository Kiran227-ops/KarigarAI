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


// =====================================================
// Detect specific service intent
// =====================================================

function detectIntent(text: string): string {
  const t = text.toLowerCase();

  // Rangoli
  if (
    t.includes('rangoli') ||
    t.includes('kolam') ||
    t.includes('muggu')
  ) {
    return 'rangoli';
  }

  // AC
  if (
    t.includes('ac technician') ||
    t.includes('air conditioner') ||
    t.includes('air conditioning') ||
    t.includes('ac repair') ||
    /\bac\b/.test(t)
  ) {
    return 'ac';
  }

  // Plumbing
  if (
    t.includes('plumber') ||
    t.includes('plumbing') ||
    t.includes('water leakage') ||
    t.includes('pipe leakage') ||
    t.includes('tap') ||
    t.includes('faucet')
  ) {
    return 'plumbing';
  }

  // Electrical
  if (
    t.includes('electrician') ||
    t.includes('electrical') ||
    t.includes('wiring') ||
    t.includes('switchboard') ||
    t.includes('socket') ||
    t.includes('lights not working')
  ) {
    return 'electrical';
  }

  // Geyser
  if (
    t.includes('geyser') ||
    t.includes('water heater')
  ) {
    return 'geyser';
  }

  // Pump
  if (
    t.includes('pump repair') ||
    t.includes('water pump') ||
    t.includes('motor pump') ||
    t.includes('pump')
  ) {
    return 'pump';
  }

  // Drip irrigation
  if (
    t.includes('drip irrigation') ||
    t.includes('irrigation pipe') ||
    t.includes('drip system')
  ) {
    return 'drip irrigation';
  }

  // Vehicle
  if (
    t.includes('car repair') ||
    t.includes('bike repair') ||
    t.includes('vehicle repair') ||
    t.includes('engine')
  ) {
    return 'vehicle';
  }

  return '';
}


// =====================================================
// Check whether a post is relevant to specific intent
// =====================================================

function matchesIntent(
  post: any,
  intent: string
): boolean {

  if (!intent) {
    return true;
  }

  const searchableText = [
    post.content,
    post.category,
    post.technicianName,
    post.location,
    ...(post.skills || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();


  switch (intent) {

    case 'rangoli':
      return (
        searchableText.includes('rangoli') ||
        searchableText.includes('kolam') ||
        searchableText.includes('muggu') ||
        searchableText.includes('floor decoration') ||
        searchableText.includes('decorative design')
      );


    case 'ac':
      return (
        searchableText.includes('ac') ||
        searchableText.includes('air conditioner') ||
        searchableText.includes('air conditioning') ||
        searchableText.includes('air-conditioner')
      );


    case 'plumbing':
      return (
        searchableText.includes('plumb') ||
        searchableText.includes('pipe') ||
        searchableText.includes('leak') ||
        searchableText.includes('tap') ||
        searchableText.includes('faucet')
      );


    case 'electrical':
      return (
        searchableText.includes('electric') ||
        searchableText.includes('wiring') ||
        searchableText.includes('switch') ||
        searchableText.includes('socket') ||
        searchableText.includes('light')
      );


    case 'geyser':
      return (
        searchableText.includes('geyser') ||
        searchableText.includes('water heater')
      );


    case 'pump':
      return (
        searchableText.includes('pump') ||
        searchableText.includes('motor')
      );


    case 'drip irrigation':
      return (
        searchableText.includes('drip') ||
        searchableText.includes('irrigation')
      );


    case 'vehicle':
      return (
        searchableText.includes('vehicle') ||
        searchableText.includes('car') ||
        searchableText.includes('bike') ||
        searchableText.includes('engine')
      );


    default:
      return true;
  }
}


// =====================================================
// SEARCH API
// =====================================================

export async function POST(req: NextRequest) {

  try {

    const { problem } = await req.json();


    // =================================================
    // Validate
    // =================================================

    if (
      !problem ||
      typeof problem !== 'string' ||
      problem.trim().length < 3
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


    // =================================================
    // 1. Translate using Hugging Face
    // =================================================

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


    // =================================================
    // 2. Understand using Hugging Face
    // =================================================

    const understanding =
      await understandProblem(
        translatedProblem
      );


    console.log(
      'AI understanding:',
      understanding
    );


    // =================================================
    // 3. Detect specific intent
    // =================================================

    const intent =
      detectIntent(
        `${originalProblem} ${translatedProblem} ${understanding.problem}`
      );


    console.log(
      'Detected intent:',
      intent
    );


    // =================================================
    // 4. Build semantic search text
    // =================================================

    let searchText =
      buildSearchText(
        understanding
      );


    // Add specific intent to embedding text
    if (intent) {

      searchText +=
        `. Specific service: ${intent}`;

    }


    console.log(
      'Search text:',
      searchText
    );


    // =================================================
    // 5. Generate embedding
    // =================================================

    const embedding =
      await embedText(
        searchText
      );


    // =================================================
    // 6. Get MORE vector matches
    //
    // Previously only 3 were retrieved.
    // Now retrieve 20 so we can filter/rerank.
    // =================================================

    const matches = await queryTopMatches(
  embedding,
  5
);


    if (matches.length === 0) {

      return NextResponse.json({

        originalProblem,

        translatedProblem,

        understanding,

        results: [],

      });

    }


    // =================================================
    // 7. Get posts
    // =================================================

    const posts =
      await Post.find(
        {
          _id: {
            $in:
              matches.map(
                (m) => m.postId
              ),
          },
        },
        {
          embedding: 0,
        }
      ).lean();


    const postById =
      new Map(
        posts.map(
          (p: any) => [
            String(p._id),
            p,
          ]
        )
      );

// =====================================================
// 8. Create candidates
// =====================================================

const candidates = matches
  .map((m, originalIndex) => {
    const post = postById.get(m.postId);

    if (!post) {
      return null;
    }

    const searchableText = [
      post.content,
      post.category,
      post.technicianName,
      post.location,
      ...(post.skills || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return {
      match: m,
      post,
      originalIndex,
      searchableText,
    };
  })
  .filter(Boolean) as any[];


// =====================================================
// 9. Smart reranking
// =====================================================

const queryText = [
  originalProblem,
  translatedProblem,
  understanding.problem,
  understanding.device,
  understanding.category,
  ...understanding.symptoms,
  intent,
]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

const queryWords = queryText
  .split(/[^a-z0-9]+/)
  .filter((word) => word.length >= 3);


// Category aliases
const categoryAliases: Record<string, string[]> = {
  'ac repair': [
    'ac',
    'air conditioner',
    'air conditioning',
    'cooling',
    'split ac',
    'window ac',
  ],

  plumbing: [
    'plumbing',
    'plumber',
    'pipe',
    'tap',
    'faucet',
    'leak',
    'water leakage',
  ],

  electrical: [
    'electrical',
    'electrician',
    'wiring',
    'switch',
    'socket',
    'light',
    'fan',
    'power',
  ],

  'geyser repair': [
    'geyser',
    'water heater',
    'heater',
    'hot water',
  ],

  'appliance repair': [
    'appliance',
    'washing machine',
    'refrigerator',
    'fridge',
    'microwave',
    'oven',
    'mixer',
    'grinder',
    'iron',
    'television',
    'tv',
  ],

  'vehicle repair': [
    'vehicle',
    'car',
    'bike',
    'motorcycle',
    'scooter',
    'engine',
    'brake',
    'tyre',
    'tire',
  ],

  'pump repair': [
    'pump',
    'water pump',
    'motor',
    'motor pump',
  ],

  'drip irrigation': [
    'drip',
    'irrigation',
    'irrigation pipe',
    'sprinkler',
    'farm water',
  ],

  carpentry: [
    'carpenter',
    'carpentry',
    'wood',
    'door',
    'furniture',
    'table',
    'chair',
  ],

  painting: [
    'painting',
    'painter',
    'wall',
    'paint',
    'color',
    'colour',
  ],

  cleaning: [
    'cleaning',
    'cleaner',
    'deep cleaning',
    'house cleaning',
  ],

  'water tank cleaning': [
    'water tank',
    'tank cleaning',
    'tank',
  ],

  'car dent repair': [
    'car dent',
    'dent',
    'body repair',
    'car body',
  ],

  'agricultural equipment repair': [
    'tractor',
    'agricultural',
    'farm equipment',
    'cultivator',
    'harvester',
  ],

  'home & property maintenance': [
    'home',
    'house',
    'property',
    'maintenance',
    'rangoli',
    'kolam',
    'muggu',
  ],
};


// Determine AI category
const aiCategory =
  understanding.category
    ?.toLowerCase()
    .trim() || '';

const aliases =
  categoryAliases[aiCategory] || [];


// =====================================================
// Calculate improved score
// =====================================================

const rankedCandidates = candidates
  .map((candidate) => {

    const semanticScore =
      Number(candidate.match.score || 0);

    let keywordScore = 0;

    // Query keyword matches
    for (const word of queryWords) {
      if (candidate.searchableText.includes(word)) {
        keywordScore += 0.02;
      }
    }

    // Category matches
    for (const alias of aliases) {
      if (
        candidate.searchableText.includes(alias)
      ) {
        keywordScore += 0.15;
      }
    }

    // Exact category match
    if (
      aiCategory &&
      candidate.post.category
        ?.toLowerCase()
        .includes(aiCategory)
    ) {
      keywordScore += 0.30;
    }

    const finalScore =
      semanticScore + keywordScore;

    return {
      ...candidate,
      finalScore,
    };
  })
  .sort(
    (a, b) =>
      b.finalScore - a.finalScore
  )
  .slice(0, 3);

    // =================================================
    // 11. Technician IDs
    // =================================================

    const technicianIds =
      [
        ...new Set(
          rankedCandidates.map(
            (c) =>
              c.post.technicianId
          )
        ),
      ];


    // =================================================
    // 12. Technician profiles
    // =================================================

    const profiles =
      await TechnicianProfile.find(
        {
          userId: {
            $in:
              technicianIds,
          },
        }
      ).lean();


    const profileByUserId =
      new Map(
        profiles.map(
          (p: any) => [
            p.userId,
            p,
          ]
        )
      );


    // =================================================
    // 13. Build final results
    // =================================================

    const results =
      rankedCandidates.map(
        (candidate, index) => {

          const post =
            candidate.post;


          const technician =
            profileByUserId.get(
              post.technicianId
            );


          return {

            score:
              candidate.match.score,

            relevanceLabel:
              index === 0
                ? 'Best match'
                : 'Also relevant',


            post: {

              id:
                String(
                  post._id
                ),

              content:
                post.content,

              category:
                post.category,

              createdAt:
                post.createdAt,

              image:
                post.image ??
                null,

            },


            technician:
              technician
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

        }
      );


    // =================================================
    // 14. Return
    // =================================================

    return NextResponse.json({

      originalProblem,

      translatedProblem,

      understanding,

      intent,

      results,

    });

  }

  catch (error) {

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