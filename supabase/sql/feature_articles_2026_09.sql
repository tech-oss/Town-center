-- ═══════════════════════════════════════════════════════════════════════════
-- Feature Articles — the homepage "FEATURED STORIES" / "In Focus" section
-- (src/components/FeatureBlocks.jsx) and its detail pages at /story/:slug
-- (src/components/FeatureArticlePage.jsx). This content used to live only in
-- the hardcoded src/Data/features.js array; this table replaces that so the
-- admin "Featured Stories" editor can actually manage it. Seeded below with
-- the same 4 stories so the live site's content doesn't change on cutover.
--
-- Max 2 stories with homepage = true, enforced client-side the same way as
-- news_offers.featured_on_home (see src/api/admin/featuredArticles.js).
--
-- Depends on admin_users.sql having been run (public.is_admin()).
--
-- NOT RUN YET.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.feature_articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  homepage      boolean not null default false,
  eyebrow       text,
  category      text,
  date_label    text,
  card_heading  text,
  card_body     text,
  card_image    text,
  title         text not null,             -- authored "Name: subtitle" — split client-side into hero title/subtitle
  hero_image    text,
  standfirst    text,
  location      text,
  website       text,
  body          jsonb not null default '[]'::jsonb,  -- [{heading?, paras[], bullets?[], parasAfter?[]}]
  gallery       text[] not null default '{}',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists feature_articles_homepage_idx on public.feature_articles (homepage, sort_order);

insert into public.feature_articles
  (slug, homepage, eyebrow, category, date_label, card_heading, card_body, card_image, title, hero_image, standfirst, location, website, body, gallery, sort_order)
values
  (
    'jetts-maidenhead', true, 'Fitness & Wellbeing', 'Fitness & Wellbeing', 'Now open · One Maidenhead',
    'Jetts Maidenhead: 24/7 Fitness in the Heart of Town',
    'A modern, results-driven gym built around one simple idea — train whenever you want, on your own terms, with no barriers.',
    '/images/jetts/entrance.webp',
    'Jetts Maidenhead: A New Era of 24/7 Fitness in the Heart of Town',
    '/images/jetts/entrance.webp',
    'A major addition to Maidenhead''s fitness scene has arrived with the launch of Jetts Maidenhead, a modern, results-driven gym designed to fit seamlessly into busy lifestyles. Located at the One Maidenhead development, this 24-hour fitness space is built around one simple idea: train whenever you want, on your own terms, with no barriers.',
    'One Maidenhead, Queen Street, Maidenhead SL6 1HT',
    'jetts.co.uk/gyms/jetts-maidenhead',
    '[
      {"heading":"A Gym That Never Sleeps","paras":["One of Jetts'' standout features is its 24/7 access, giving members complete freedom over when they train. Early morning lifters, late-night gym-goers, and shift workers all benefit from round-the-clock entry, making it one of the most flexible fitness options in the area.","Whether you''re squeezing in a quick session before work or committing to a full evening workout, the gym is always open and ready."]},
      {"heading":"Modern Training Space Built for Results","paras":["Jetts Maidenhead offers a state-of-the-art training environment designed for all fitness levels. The gym features a spacious layout with dedicated zones for:"],"bullets":["Strength training","Free weights and functional training","Cardio equipment","Conditioning and performance workouts"],"parasAfter":["The setup is intentionally uncluttered and performance-focused, allowing members to move efficiently through workouts without unnecessary distractions."]},
      {"heading":"Classes That Keep You Motivated","paras":["Beyond the gym floor, Jetts also delivers structured group training through its signature programmes, including J-Series and J-Hybrid classes. These sessions are designed to combine strength, conditioning, and athletic training principles in a supportive group environment.","For those who prefer coaching and structure, these classes offer a clear path to progression while still maintaining the energy and community feel Jetts is known for."]},
      {"heading":"A Supportive Fitness Community","paras":["Despite being a modern chain gym, Jetts places strong emphasis on building a welcoming and motivating community atmosphere. Staff are on hand to support members, whether it''s helping with equipment guidance, training advice, or general motivation.","The goal is simple: create a space where people feel comfortable training consistently and progressing toward their goals."]},
      {"heading":"Central Location, Easy Access","paras":["Situated in the heart of Maidenhead''s town centre at One Maidenhead, the gym benefits from excellent transport links and proximity to shops, cafés, and residential areas. This makes it a convenient stop whether fitness is part of a daily commute or a dedicated trip."]},
      {"heading":"Fitness Without Compromise","paras":["Jetts Maidenhead represents a shift toward flexible, accessible training. There are no rigid time restrictions, and the focus is on giving members control over how they train.","It''s a gym built for modern life: fast-paced, flexible, and focused on results."]}
    ]'::jsonb,
    array['/images/jetts/hybrid.webp','/images/jetts/strength.webp','/images/jetts/cardio.webp'],
    1
  ),
  (
    'the-fat-duck', true, 'Eat & Drink', 'Fine Dining', 'Bray · Three Michelin Stars',
    'The Fat Duck, Bray: Where Fine Dining Becomes Fiction',
    'A few miles from Maidenhead sits one of the most extraordinary dining rooms on earth — Heston Blumenthal''s three-Michelin-star theatre of taste, memory and illusion.',
    '/images/fatduck/food-1.jpg',
    'The Fat Duck, Bray: Where Fine Dining Becomes Fiction',
    '/images/fatduck/food-1.jpg',
    'In the unassuming riverside village of Bray, a few miles from the Thames'' slow bend and postcard English calm, sits one of the most extraordinary dining rooms on earth: The Fat Duck. From the outside, it could be mistaken for a refined country inn. Inside, it behaves more like a stage set for memory, illusion, and controlled culinary theatre.',
    'High Street, Bray, Berkshire SL6 2AQ',
    'thefatduck.co.uk',
    '[
      {"paras":["This is not a restaurant in the conventional sense. It is a constructed experience — meticulously composed, emotionally engineered, and deliberately surreal."]},
      {"heading":"A Michelin Legend Disguised as a Fairytale","paras":["Under the vision of Heston Blumenthal, The Fat Duck has become synonymous with modern experimental gastronomy. Its three Michelin stars are not simply a marker of technical excellence, but of conceptual ambition: a kitchen that treats taste as science, psychology, and storytelling all at once.","Here, nostalgia is an ingredient. Sound is seasoning. Texture becomes narrative.","The result is a dining experience that feels less like service and more like curated immersion — each course unfolding as a chapter in an abstract, edible novel."]},
      {"heading":"The Architecture of Sensation","paras":["The dining room itself is deliberately understated, almost disarming. Muted tones, restrained design, and a sense of quiet anticipation allow the food to take psychological centre stage. But nothing about the experience remains still for long.","Dishes arrive with theatrical precision: glass domes filled with drifting smoke, scents that seem to arrive before the plate, and unexpected sensory cues that alter perception before the first bite.","One moment you are in a fine-dining restaurant in Berkshire. The next, you are somewhere else entirely."]},
      {"heading":"“Sound of the Sea”: A Dish That Listens Back","paras":["Perhaps the restaurant''s most famous creation, Sound of the Sea, exemplifies its philosophy. Guests are given headphones playing ocean waves and distant gulls while a dish of seafood, foam, and edible “shoreline” arrives at the table.","The effect is disorienting in the most deliberate way: flavour is no longer isolated. It is shaped by sound, memory, and imagination working in concert.","It is not just eaten — it is perceived."]},
      {"heading":"A Language of Culinary Illusion","paras":["Across the menu, familiar ingredients are dismantled and reassembled into unfamiliar forms. Breakfast may arrive as dessert. Childhood flavours may appear disguised as modernist sculpture. What matters is not recognition, but re-examination.","The Fat Duck''s genius lies in its refusal to let diners remain passive. It insists on participation — on attention, curiosity, and surrender to the unknown."]},
      {"heading":"The Luxury of Being Led Astray","paras":["In an era where luxury often signals minimalism and restraint, The Fat Duck offers something rarer: abundance of imagination. It is luxurious not because of opulence, but because of orchestration — every detail considered, every sensation calibrated, every moment designed to unsettle expectation.","To dine here is to accept a simple premise: that taste is never just taste, and memory is always part of the menu.","Long after the final course, what remains is not merely the memory of what was eaten, but the strange clarity of having been temporarily somewhere else entirely."]}
    ]'::jsonb,
    array['/images/fatduck/food-3.jpg','/images/fatduck/madhatter.jpg','/images/fatduck/icecream.jpg'],
    2
  ),
  (
    'esquires-coffee-maidenhead', false, 'Eat & Drink', 'Coffee & Culture', 'Open Daily · High Street',
    'Esquires Coffee: Maidenhead''s Independent Living Room',
    'A relaxed, plant-filled café on the High Street built for lingering — good coffee, honest food and a table for as long as you need it.',
    '/images/esquires/hero-1.png',
    'Esquires Coffee: Maidenhead''s Independent Living Room',
    '/images/esquires/hero-1.png',
    'Tucked into the High Street, Esquires Coffee has become the kind of place regulars call their second office: a relaxed, independently-run café built for lingering over a proper coffee rather than rushing one down.',
    'High Street, Maidenhead SL6 1JN',
    'esquirescoffee.co.uk/maidenhead',
    '[
      {"heading":"Coffee Taken Seriously, Atmosphere Kept Easy","paras":["Esquires has built its name on ethically-sourced, carefully roasted beans, and Maidenhead''s branch doesn''t cut corners — every cup is pulled with the same attention whether it''s a quiet Tuesday morning or the Saturday rush.","But the coffee is only half the appeal. The room itself, all warm wood and greenery, is set up for people who want to stay: laptops open, meetings running long, friends catching up over a second flat white."]},
      {"heading":"A Menu Built for the Whole Day","paras":["Alongside the coffee menu, Esquires serves breakfasts, brunch plates, toasties and cakes made to be eaten slowly, not grabbed on the way past — the kind of food that matches the pace of the room."]},
      {"heading":"Part of the High Street''s Daily Rhythm","paras":["For a lot of Maidenhead regulars, Esquires is simply where the day starts or where an afternoon gets reclaimed — a dependable, unpretentious spot in the middle of town that''s become part of the daily routine for locals and commuters alike."]}
    ]'::jsonb,
    array['/images/esquires/cafe-1.jpg','/images/esquires/cafe-2.jpg','/images/esquires/cafe-3.jpg'],
    3
  ),
  (
    'cocoba-chocolate-cafe-story', false, 'Eat & Drink', 'Chocolate Café', 'Open Daily · High Street',
    'COCOBA: The Chocolate Café That Became a High Street Fixture',
    'Since opening in 2024, COCOBA has turned a simple idea — real chocolate, properly made — into one of the High Street''s most-loved cafés.',
    '/images/cocoba/storefront.jpg',
    'COCOBA: The Chocolate Café That Became a High Street Fixture',
    '/images/cocoba/storefront.jpg',
    'Since opening in October 2024, COCOBA Maidenhead has become a much-loved spot for coffee and chocolate lovers alike — a warm, welcoming café built around one straightforward idea: real chocolate, properly made.',
    'High Street, Maidenhead SL6 1JN',
    'cocobachocolate.com',
    '[
      {"heading":"Chocolate as the Main Event","paras":["Owners Viv and Shashank set out to make COCOBA a chocolate café in the fullest sense — not a coffee shop that happens to sell chocolate, but a space where the chocolate itself, crafted at COCOBA''s own Kent factory, is the reason people come back.","That shows up everywhere on the menu: luxurious real-chocolate hot drinks, the café''s now-famous hot chocolate bombes, and a rotating case of handmade truffles and bars."]},
      {"heading":"A Café for the Whole Day","paras":["Alongside the chocolate, there''s expertly pulled barista coffee, freshly made cakes, waffles and desserts, plus light lunches and brunch favourites — enough to make COCOBA a genuine all-day stop, not just a treat on the way past."]},
      {"heading":"A Fixture in Under a Year","paras":["In a short space of time, COCOBA has settled into the rhythm of the High Street — a spot for meeting friends, working over a coffee, spending time with family, or simply treating yourself on an ordinary afternoon."]}
    ]'::jsonb,
    array['/images/cocoba/interior.jpg','/images/cocoba/dessert.jpg','/images/cocoba/truffles.jpg'],
    4
  )
on conflict (slug) do nothing;

alter table public.feature_articles enable row level security;

drop policy if exists "public reads feature_articles" on public.feature_articles;
create policy "public reads feature_articles" on public.feature_articles for select using (true);

drop policy if exists "admins manage feature_articles" on public.feature_articles;
create policy "admins manage feature_articles" on public.feature_articles for all using (public.is_admin()) with check (public.is_admin());
