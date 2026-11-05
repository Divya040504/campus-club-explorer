insert into public.clubs (
  name,
  category,
  venue,
  short_description,
  full_description,
  contact_email
)
values
  (
    'Dance',
    'Performing Arts, Visual Arts & Crafts',
    'A Block Foyer',
    'Move, perform, and connect through a shared love of dance.',
    'Dance Club is a welcoming space for students to explore movement, learn new styles, and build confidence through performance.',
    'dance.club@campus.edu'
  ),
  (
    'Music',
    'Performing Arts, Visual Arts & Crafts',
    'VBTF 06',
    'Find your rhythm and make music with fellow students.',
    'Music Club brings singers, instrumentalists, and music lovers together to collaborate, practice, and share their sound.',
    'music.club@campus.edu'
  ),
  (
    'Theatre Arts',
    'Performing Arts, Visual Arts & Crafts',
    'VBTF 04',
    'Build stories, characters, and performances for the stage.',
    'Theatre Arts Club helps students discover acting, direction, backstage work, and the creative process behind live theatre.',
    'theatre.club@campus.edu'
  ),
  (
    'Fashion',
    'Performing Arts, Visual Arts & Crafts',
    'VBFF 04',
    'Explore personal style, design, and fashion culture.',
    'Fashion Club is a creative community for students interested in styling, design, visual storytelling, and the evolving world of fashion.',
    'fashion.club@campus.edu'
  ),
  (
    'Arts & Crafts',
    'Performing Arts, Visual Arts & Crafts',
    'VBFTF 01',
    'Make something thoughtful with your hands and imagination.',
    'Arts & Crafts Club is a relaxed place to experiment with materials, share creative ideas, and learn from fellow makers.',
    'arts.club@campus.edu'
  ),
  (
    'Readers',
    'Literature & Media',
    'VBTF 02',
    'Discover new books and exchange ideas with other readers.',
    'Readers Club creates space for thoughtful conversations about books, authors, genres, and the many ways stories shape us.',
    'readers.club@campus.edu'
  ),
  (
    'Writers',
    'Literature & Media',
    'VBFF 03',
    'Write, workshop, and share your voice with the campus community.',
    'Writers Club supports students who enjoy creative writing, poetry, essays, and constructive feedback in a friendly setting.',
    'writers.club@campus.edu'
  ),
  (
    'Orators',
    'Literature & Media',
    'VBSF 02',
    'Strengthen your public speaking and persuasive communication.',
    'Orators Club helps students practice clear speaking, confident presentations, debate, and thoughtful communication.',
    'orators.club@campus.edu'
  ),
  (
    'Photography',
    'Literature & Media',
    'VBSF 05',
    'See campus differently through the lens of a camera.',
    'Photography Club invites students to learn visual storytelling, share their work, and explore photography as an art form.',
    'photography.club@campus.edu'
  ),
  (
    'Film',
    'Literature & Media',
    'VBFFTF 01',
    'Discuss, create, and appreciate the art of film.',
    'Film Club is for students who enjoy cinema and want to explore film discussion, criticism, storytelling, and production.',
    'film.club@campus.edu'
  ),
  (
    'Language',
    'Literature & Media',
    'VBTF 01',
    'Celebrate languages, communication, and cultural expression.',
    'Language Club brings students together to explore language learning, communication, and the cultures connected to language.',
    'language.club@campus.edu'
  ),
  (
    'Quiz',
    'Literature & Media',
    'VBSF 04',
    'Put your curiosity and knowledge to the test.',
    'Quiz Club is a lively community for students who enjoy trivia, teamwork, learning, and friendly intellectual challenges.',
    'quiz.club@campus.edu'
  ),
  (
    'Culture & Heritage',
    'Inclusive',
    'VBSF 03',
    'Learn from and celebrate the cultures around you.',
    'Culture & Heritage Club encourages students to share traditions, learn from one another, and build a more connected campus.',
    'culture.club@campus.edu'
  ),
  (
    'Gender Champions',
    'Inclusive',
    'VBTF 08',
    'Promote equality, awareness, and respectful communities.',
    'Gender Champions Club gives students a platform to learn, speak up, and support a more equitable and inclusive campus.',
    'gender.champions@campus.edu'
  ),
  (
    'Mental Health & Wellbeing',
    'Inclusive',
    'VBFF 02',
    'Build a kinder campus culture around mental wellbeing.',
    'Mental Health & Wellbeing Club promotes open conversations, peer support, and practical approaches to caring for mental health.',
    'wellbeing.club@campus.edu'
  )
on conflict (name) do update set
  category = excluded.category,
  venue = excluded.venue,
  short_description = excluded.short_description,
  full_description = excluded.full_description,
  contact_email = excluded.contact_email;
