# FixMatch — AI Technician Discovery (MVP prototype)

Problem → LLM understanding → embedding → semantic search → matched technicians.

This is a standalone Next.js app implementing the core loop from your spec. It's
built to run with **zero external vector DB setup** (Pinecone is optional — see
below) so you can demo the semantic matching immediately, then swap in Pinecone
and your existing Clerk/Cloudinary app once you're happy with it.

## What's implemented

- **Technician side**: demo login → create profile (category, location, skills) →
  post a "problem I solved" write-up. Each post is embedded (OpenAI
  `text-embedding-3-small`) and stored both in MongoDB and (optionally) Pinecone.
- **User side**: describe a problem in plain language → an LLM
  (`gpt-4o-mini`) extracts structured fields (device, symptoms, category) →
  that understanding is embedded → top-3 semantically similar technician
  posts are retrieved and shown with the technician's profile.
- **Vector search**: works two ways, same code path either way:
  - `PINECONE_API_KEY` **not set** → in-app cosine similarity over all posts
    in MongoDB. Fine for a prototype / a few hundred posts.
  - `PINECONE_API_KEY` **set** → posts are upserted to a Pinecone index and
    search queries Pinecone directly, per your spec.
- **Copy** on the results page deliberately says "demonstrated experience
  solving similar problems," never "will fix your problem" — per your
  Section 7 principle.

## What's intentionally simplified (see "What to extend" below)

- **Auth**: name + role only, no password, cookie-based session. This is
  the biggest simplification — it's there so you can run the whole thing in
  five minutes without setting up an auth provider.
- **Ranking**: pure semantic similarity, no blending with rating/distance yet
  (matches your Section 6 — MVP prioritizes correct semantic matching first).

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/technician-discovery
OPENAI_API_KEY=sk-...
# leave these two blank to use the local fallback vector search
PINECONE_API_KEY=
PINECONE_INDEX_NAME=technician-posts
```

You need a MongoDB instance running (local `mongod`, or a free MongoDB Atlas
cluster — paste its connection string into `MONGODB_URI`).

### Seed some demo technicians (recommended)

This creates ~7 technicians across AC/geyser/electrical/plumbing with real
embedded posts, so search returns something interesting immediately:

```bash
npm run seed
```

### Run it

```bash
npm run dev
```

Open http://localhost:3000.

- Try the homepage search box with: *"My AC is running but the room isn't
  getting cold and water is dripping inside."* You should see Ravi Kumar,
  Suresh, and Arjun ranked by relevance — even though none of their posts
  use the exact words "dripping" or "room isn't getting cold."
- Go to **Log in → "I'm a technician"** to create your own profile and post,
  then search for something matching it to see a fresh post get embedded
  and retrieved live.

### Enabling Pinecone (optional)

1. Create a Pinecone index with dimension **1536** (matches
   `text-embedding-3-small`), metric `cosine`.
2. Set `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` in `.env.local`.
3. Restart the dev server, then re-run `npm run seed` (or re-post) so
   existing posts get upserted to Pinecone too — the fallback path only
   reads from Mongo, it doesn't backfill Pinecone retroactively.

No other code changes needed — `src/lib/ai/vectorstore.ts` is the only file
that branches on Pinecone vs. local.

## Project structure

```
src/
  app/
    page.tsx                 landing + search box
    search/page.tsx          results page (calls /api/search)
    login/page.tsx           demo auth
    technician/dashboard/    profile + post creation
    technician/[id]/         public technician profile
    api/
      auth/login             demo session
      technicians            profile CRUD
      posts                  create post -> embed -> store (+ Pinecone)
      search                 the core AI pipeline
  lib/
    ai/
      embeddings.ts          OpenAI embeddings
      llm.ts                 problem understanding (structured extraction)
      vectorstore.ts         Pinecone client + local cosine-similarity fallback
    models/                  Mongoose schemas (User, TechnicianProfile, Post)
    db.ts                    Mongo connection
    session.ts               demo session helper
scripts/seed.mjs             demo data generator
```

## What I'd extend first

1. **Swap demo auth for Clerk** — since you already have Clerk wired into
   your LinkedIn clone, replace `src/lib/session.ts` with a Clerk session
   lookup, and drop `/api/auth/login`. `TechnicianProfile.userId` and
   `Post.technicianId` already store an opaque string ID, so they'll work
   unchanged with a Clerk user ID.
2. **Combined ranking** (Section 6) — once semantic search is solid, blend
   in `technician.rating` and a distance calc from `technician.location`
   (geocode once at profile-save time, store lat/lng, sort by a weighted
   score instead of raw cosine similarity).
3. **Backfill script** — a one-off script to re-embed and re-upsert all
   existing posts when you change embedding models or turn on Pinecone
   after posts already exist.
4. **Post moderation / quality** — right now any technician can post
   anything; you'll likely want a minimum-length check plus maybe an LLM
   pass to flag posts that don't actually describe a solved problem.
5. **"Contact technician"** is currently a `mailto:` placeholder — replace
   with your real messaging/contact flow.
6. **Merge into your existing repo** — the existing Post model becomes your
   technician experience post type (add `embedding: number[]` to your
   current post schema), your existing search box's submit handler should
   POST to `/api/search` instead of a keyword query, and your existing
   feed/profile components can mostly be reused by swapping the data shape
   for `ResultCard`.
