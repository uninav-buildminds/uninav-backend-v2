export interface CourseData {
  code: string;
  name: string;
  description: string;
  departments: string[];
  levels: number[];
}

export const courseData: CourseData[] = [
  // General Studies/University-wide Courses (100 Level)
  {
    code: 'GST101',
    name: 'Use of English I',
    description:
      'Development of communication skills in English language focusing on reading, writing and critical thinking',
    departments: ['ALL_DEPARTMENTS'],
    levels: [100],
  },
  {
    code: 'GST102',
    name: 'Use of English II',
    description:
      'Advanced communication skills with emphasis on academic writing and presentations',
    departments: ['ALL_DEPARTMENTS'],
    levels: [100],
  },
  {
    code: 'GST103',
    name: 'Nigerian Peoples and Culture',
    description:
      'Study of Nigerian cultural diversity, history, and national identity',
    departments: ['ALL_DEPARTMENTS'],
    levels: [100],
  },
  {
    code: 'GST104',
    name: 'History and Philosophy of Science',
    description:
      'Introduction to scientific thinking, methods and its historical development',
    departments: ['ALL_DEPARTMENTS'],
    levels: [100],
  },

  // Mathematics Courses
  {
    code: 'MTH101',
    name: 'Elementary Mathematics I',
    description: 'Introduction to calculus, analytical geometry, and algebra',
    departments: [
      'DEPARTMENT OF MATHEMATICS',
      'DEPARTMENT OF PHYSICS',
      'DEPARTMENT OF STATISTICS',
      'DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING',
    ],
    levels: [100],
  },
  {
    code: 'MTH102',
    name: 'Elementary Mathematics II',
    description: 'Vectors, matrices, and further analytical geometry topics',
    departments: [
      'DEPARTMENT OF MATHEMATICS',
      'DEPARTMENT OF PHYSICS',
      'DEPARTMENT OF STATISTICS',
    ],
    levels: [100],
  },
  {
    code: 'MTH201',
    name: 'Mathematical Methods I',
    description: 'Advanced calculus and differential equations',
    departments: ['DEPARTMENT OF MATHEMATICS', 'DEPARTMENT OF PHYSICS'],
    levels: [200],
  },
  {
    code: 'MTH301',
    name: 'Abstract Algebra',
    description: 'Groups, rings, fields and their applications',
    departments: ['DEPARTMENT OF MATHEMATICS'],
    levels: [300],
  },
  {
    code: 'MTH401',
    name: 'Complex Analysis',
    description: 'Advanced study of functions of complex variables',
    departments: ['DEPARTMENT OF MATHEMATICS'],
    levels: [400],
  },

  // Biology Courses
  {
    code: 'BIO101',
    name: 'General Biology I',
    description: 'Basic principles of biology and cellular organization',
    departments: [
      'DEPARTMENT OF BOTANY',
      'DEPARTMENT OF ZOOLOGY',
      'DEPARTMENT OF MICROBIOLOGY',
    ],
    levels: [100],
  },
  {
    code: 'BIO102',
    name: 'General Biology II',
    description:
      'Continuation of general biology with focus on ecology and evolution',
    departments: ['DEPARTMENT OF BOTANY', 'DEPARTMENT OF ZOOLOGY'],
    levels: [100],
  },
  {
    code: 'BOT201',
    name: 'Plant Morphology',
    description: 'Study of the form and structure of plants',
    departments: ['DEPARTMENT OF BOTANY'],
    levels: [200],
  },
  {
    code: 'ZOO201',
    name: 'Animal Physiology',
    description: 'Study of animal organ systems and their functions',
    departments: ['DEPARTMENT OF ZOOLOGY'],
    levels: [200],
  },
  {
    code: 'MCB201',
    name: 'General Microbiology',
    description: 'Introduction to microbial world and basic techniques',
    departments: ['DEPARTMENT OF MICROBIOLOGY'],
    levels: [200],
  },

  // Physics Courses
  {
    code: 'PHY101',
    name: 'Mechanics and Properties of Matter',
    description: 'Introduction to classical mechanics and material properties',
    departments: [
      'DEPARTMENT OF PHYSICS',
      'DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING',
      'DEPARTMENT OF MECHANICAL ENGINEERING',
    ],
    levels: [100],
  },
  {
    code: 'PHY102',
    name: 'Electricity, Magnetism and Modern Physics',
    description:
      'Basic principles of electromagnetism and introduction to modern physics',
    departments: [
      'DEPARTMENT OF PHYSICS',
      'DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING',
    ],
    levels: [100],
  },
  {
    code: 'PHY301',
    name: 'Quantum Mechanics',
    description: 'Introduction to quantum theory and applications',
    departments: ['DEPARTMENT OF PHYSICS'],
    levels: [300],
  },

  // Engineering Courses
  {
    code: 'ENG101',
    name: 'Engineering Drawing',
    description: 'Technical drawing principles and practices for engineers',
    departments: [
      'DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING',
      'DEPARTMENT OF MECHANICAL ENGINEERING',
      'DEPARTMENT OF INDUSTRIAL AND PRODUCTION ENGINEERING',
    ],
    levels: [100],
  },
  {
    code: 'ENG201',
    name: 'Engineering Mathematics',
    description: 'Advanced mathematical concepts for engineering applications',
    departments: [
      'DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING',
      'DEPARTMENT OF MECHANICAL ENGINEERING',
    ],
    levels: [200],
  },
  {
    code: 'EEE301',
    name: 'Circuit Theory',
    description: 'Analysis and design of electrical circuits',
    departments: ['DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING'],
    levels: [300],
  },
  {
    code: 'MEE301',
    name: 'Thermodynamics',
    description: 'Energy conversion principles and applications',
    departments: ['DEPARTMENT OF MECHANICAL ENGINEERING'],
    levels: [300],
  },
  {
    code: 'IPE401',
    name: 'Operations Research',
    description: 'Mathematical modeling for industrial process optimization',
    departments: ['DEPARTMENT OF INDUSTRIAL AND PRODUCTION ENGINEERING'],
    levels: [400],
  },

  // Agriculture Courses
  {
    code: 'AGR101',
    name: 'Introduction to Agriculture',
    description: 'Overview of agricultural principles and practices',
    departments: [
      'DEPARTMENT OF ANIMAL SCIENCE',
      'DEPARTMENT OF AGRICULTURAL ECONOMICS',
      'DEPARTMENT OF AGRONOMY',
    ],
    levels: [100],
  },
  {
    code: 'ANS201',
    name: 'Animal Nutrition',
    description: 'Principles of animal feeding and nutrition',
    departments: ['DEPARTMENT OF ANIMAL SCIENCE'],
    levels: [200],
  },
  {
    code: 'AGE301',
    name: 'Farm Management',
    description:
      'Economics and management principles applied to farm operations',
    departments: ['DEPARTMENT OF AGRICULTURAL ECONOMICS'],
    levels: [300],
  },
  {
    code: 'AGR301',
    name: 'Crop Production',
    description: 'Principles and practices of crop cultivation',
    departments: ['DEPARTMENT OF AGRONOMY'],
    levels: [300],
  },
  {
    code: 'FOR401',
    name: 'Forest Management',
    description: 'Sustainable management of forest resources',
    departments: ['DEPARTMENT OF FOREST RESOURCES MANAGEMENT'],
    levels: [400],
  },

  // Medicine Courses
  {
    code: 'MED201',
    name: 'Human Anatomy',
    description: 'Study of structure and organization of the human body',
    departments: [
      'DEPARTMENT OF MEDICINE',
      'DEPARTMENT OF SURGERY',
      'DEPARTMENT OF PHYSIOLOGY',
    ],
    levels: [200],
  },
  {
    code: 'BCH201',
    name: 'Medical Biochemistry',
    description: 'Biochemical processes and their relevance to medicine',
    departments: ['DEPARTMENT OF BIOCHEMISTRY'],
    levels: [200],
  },
  {
    code: 'MED301',
    name: 'Pathology',
    description: 'Study of diseases and their effects on body systems',
    departments: ['DEPARTMENT OF MEDICINE'],
    levels: [300],
  },
  {
    code: 'SUR401',
    name: 'Surgical Principles',
    description: 'Fundamentals of surgical techniques and procedures',
    departments: ['DEPARTMENT OF SURGERY'],
    levels: [400],
  },
  {
    code: 'MED401',
    name: 'Clinical Medicine',
    description: 'Clinical practice and patient care approaches',
    departments: ['DEPARTMENT OF MEDICINE', 'DEPARTMENT OF SURGERY'],
    levels: [400],
  },

  // Education Courses
  {
    code: 'EDU101',
    name: 'Introduction to Education',
    description: 'Foundations and principles of educational theory',
    departments: [
      'DEPARTMENT OF TEACHER EDUCATION',
      'DEPARTMENT OF ADULT EDUCATION',
      'DEPARTMENT OF GUIDANCE AND COUNSELLING',
    ],
    levels: [100],
  },
  {
    code: 'TED201',
    name: 'Educational Psychology',
    description: 'Psychological principles applied to teaching and learning',
    departments: ['DEPARTMENT OF TEACHER EDUCATION'],
    levels: [200],
  },
  {
    code: 'AED301',
    name: 'Adult Learning Theories',
    description: 'Understanding how adults learn and educational approaches',
    departments: ['DEPARTMENT OF ADULT EDUCATION'],
    levels: [300],
  },
  {
    code: 'GCE301',
    name: 'Counselling Theories',
    description: 'Major counselling approaches and their applications',
    departments: ['DEPARTMENT OF GUIDANCE AND COUNSELLING'],
    levels: [300],
  },
  {
    code: 'HKE401',
    name: 'Sports Management',
    description: 'Administration and management of sports programs',
    departments: ['DEPARTMENT OF HUMAN KINETICS AND HEALTH EDUCATION'],
    levels: [400],
  },

  // Social Sciences Courses
  {
    code: 'SOC101',
    name: 'Introduction to Sociology',
    description: 'Basic concepts and theoretical perspectives in sociology',
    departments: ['DEPARTMENT OF SOCIOLOGY'],
    levels: [100],
  },
  {
    code: 'PSY101',
    name: 'Introduction to Psychology',
    description: 'Overview of psychological theories and research methods',
    departments: ['DEPARTMENT OF PSYCHOLOGY'],
    levels: [100],
  },
  {
    code: 'ECO101',
    name: 'Principles of Economics I',
    description: 'Introduction to microeconomic theory and applications',
    departments: ['DEPARTMENT OF ECONOMICS'],
    levels: [100],
  },
  {
    code: 'GEO201',
    name: 'Physical Geography',
    description: 'Study of natural features and processes of the Earth',
    departments: ['DEPARTMENT OF GEOGRAPHY'],
    levels: [200],
  },
  {
    code: 'PSY301',
    name: 'Social Psychology',
    description: 'Behavior of individuals within social contexts',
    departments: ['DEPARTMENT OF PSYCHOLOGY'],
    levels: [300],
  },
  {
    code: 'ECO401',
    name: 'Development Economics',
    description: 'Economic growth theories and development policies',
    departments: ['DEPARTMENT OF ECONOMICS'],
    levels: [400],
  },
];
