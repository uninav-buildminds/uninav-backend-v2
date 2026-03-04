/** Pre-defined interest tags shared with club discovery. */
export const CLUB_INTERESTS = [
  // Technology
  'Technology & Computing',
  'AI & Data Science',
  'Cybersecurity',
  'Game Development',
  // Business & Finance
  'Entrepreneurship',
  'Finance & Investing',
  'Marketing & PR',
  'Business Strategy',
  // Arts & Creativity
  'Music',
  'Film & Cinema',
  'Photography',
  'Art & Illustration',
  'Creative Writing',
  'Theatre & Drama',
  // Academics & Research
  'Science & Research',
  'Mathematics',
  'Engineering',
  'Law & Policy',
  'Medicine & Health Sciences',
  'History & Philosophy',
  // Social & Civic
  'Debate & Public Speaking',
  'Model UN & Diplomacy',
  'Social Impact & Advocacy',
  'Volunteering & Community Service',
  'Religion & Spirituality',
  // Lifestyle & Culture
  'Sports & Fitness',
  'Dance',
  'Fashion',
  'Cooking & Culinary',
  'Reading & Book Club',
  'Languages & Culture',
  'Travel & Exploration',
  // Health & Environment
  'Health & Wellness',
  'Environmental & Sustainability',
  'Mental Health',
  'Nutrition & Dietetics',
  // Media & Communication
  'Journalism & Media',
  'Networking & Professional Dev',
  'Podcasting & Broadcasting',
  'Content Creation',
] as const;

export type ClubInterest = (typeof CLUB_INTERESTS)[number];
