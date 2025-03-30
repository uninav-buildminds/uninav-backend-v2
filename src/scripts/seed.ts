import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle/schema/schema';
import { faculty } from '../drizzle/schema/faculty.schema';
import { department } from '../drizzle/schema/department.schema';
import { DepartmentEntity, FacultyEntity } from 'src/utils/types/db.types';

// Map of departments to their descriptions
const departmentDescriptions = {
  // Agriculture and Forestry
  'DEPARTMENT OF ANIMAL SCIENCE':
    'Studies the biology, care, and management of domesticated animals with a focus on livestock production, animal breeding, and nutrition.',
  'DEPARTMENT OF AGRICULTURAL ECONOMICS':
    'Applies economic principles to agriculture, analyzing farming operations, food production, and agricultural markets and policies.',
  'DEPARTMENT OF AGRONOMY':
    'Focuses on soil and crop management, plant breeding, and sustainable farming practices to improve crop production and soil health.',
  'DEPARTMENT OF FOREST RESOURCES MANAGEMENT':
    'Deals with the sustainable management of forests, conservation of biodiversity, and utilization of forest resources.',

  // Arts
  'DEPARTMENT OF MUSIC':
    'Explores music theory, composition, performance, and history across various cultures and genres.',
  'DEPARTMENT OF RELIGIOUS STUDIES':
    'Examines religious traditions, texts, practices, and their cultural and historical contexts from an academic perspective.',
  'DEPARTMENT OF ARABIC AND ISLAMIC STUDIES':
    'Studies Arabic language, literature, Islamic history, theology, and cultural traditions of the Arab and Islamic worlds.',
  'DEPARTMENT OF COMMUNICATION AND LANGUAGE ARTS':
    'Focuses on verbal and non-verbal communication, media studies, linguistics, and rhetorical theories.',
  'DEPARTMENT OF EUROPEAN STUDIES':
    'Examines European languages, literature, politics, history, and cultural traditions across different European nations.',
  'DEPARTMENT OF HISTORY':
    'Studies past events, societies, and civilizations to understand human development and historical patterns.',
  'DEPARTMENT OF THEATRE ARTS':
    'Covers dramatic theory, acting, directing, stagecraft, and performance studies for theatrical productions.',
  'DEPARTMENT OF PHILOSOPHY':
    'Examines fundamental questions about existence, knowledge, values, reason, mind, and language through critical reasoning.',

  // Medicine
  'DEPARTMENT OF HUMAN NUTRITION':
    'Studies how nutrients in food affect human health, metabolism, and the relationship between diet and disease prevention.',
  'DEPARTMENT OF OBSTETRICS AND GYNAECOLOGY':
    "Specializes in women's reproductive health, pregnancy care, childbirth, and gynecological conditions.",
  'DEPARTMENT OF OPHTHALMOLOGY':
    'Focuses on the diagnosis, treatment, and prevention of disorders and diseases of the eye and visual system.',
  'DEPARTMENT OF PAEDIATRICS':
    'Specializes in the medical care of infants, children, and adolescents, focusing on their development and diseases.',
  'DEPARTMENT OF PHYSIOTHERAPY':
    'Provides treatment to restore movement and function affected by injury, illness, or disability through physical methods.',
  'DEPARTMENT OF RADIOTHERAPY':
    'Specializes in the use of radiation for cancer treatment, managing radiation protocols and patient care.',
  'DEPARTMENT OF SURGERY':
    'Focuses on operative procedures for treating injuries, diseases, and deformities through invasive and minimally invasive techniques.',
  'DEPARTMENT OF BIOCHEMISTRY':
    'Studies chemical processes and substances in living organisms, focusing on molecular mechanisms of cellular activities.',
  'DEPARTMENT OF EPIDEMIOLOGY, MEDICAL STATISTICS AND ENVIRONMENTAL HEALTH (EMSEH)':
    'Investigates patterns, causes, and effects of health and disease conditions in defined populations using statistical methods.',
  'DEPARTMENT OF HEALTH POLICY AND MANAGEMENT':
    'Studies healthcare systems, policy development, and efficient management of healthcare organizations.',
  'DEPARTMENT OF HEALTH PROMOTION AND EDUCATION':
    'Focuses on empowering individuals and communities to increase control over and improve their health through education.',
  'INSTITUTE OF ADVANCED MEDICAL RESEARCH AND TRAINING':
    'Conducts high-level medical research and provides specialized training for medical practitioners and researchers.',
  'DEPARTMENT OF MEDICINE':
    'Focuses on the diagnosis, treatment, and prevention of adult diseases through non-surgical means.',
  'DEPARTMENT OF PHYSIOLOGY':
    'Studies how living organisms and their parts function, examining bodily systems and their mechanisms.',
  'DEPARTMENT OF PREVENTIVE MEDICINE AND PRIMARY CARE':
    'Focuses on disease prevention, health promotion, and primary healthcare delivery at community levels.',
  'DEPARTMENT OF PSYCHIATRY':
    'Specializes in the diagnosis, treatment, and prevention of mental, emotional, and behavioral disorders.',

  // Education
  'DEPARTMENT OF TEACHER EDUCATION':
    'Prepares students to become effective teachers through pedagogical theories, teaching methodologies, and classroom management.',
  'DEPARTMENT OF ADULT EDUCATION':
    'Focuses on educational programs for adult learners, lifelong learning, and continuing professional development.',
  'DEPARTMENT OF GUIDANCE AND COUNSELLING':
    'Trains professionals to provide psychological support, career guidance, and personal development counseling.',
  'DEPARTMENT OF HUMAN KINETICS AND HEALTH EDUCATION':
    'Studies physical education, sports science, and health promotion for individual and community wellbeing.',

  // Pharmacy
  'DEPARTMENT OF PHARMACEUTICS AND INDUSTRIAL PHARMACY':
    'Focuses on drug formulation, manufacture, quality control, and pharmaceutical technology in industrial settings.',

  // Science
  'DEPARTMENT OF MATHEMATICS':
    'Studies numbers, quantity, structure, space, patterns, and change through abstract concepts and their applications.',
  'DEPARTMENT OF PHYSICS':
    'Explores matter, energy, force, motion, and the fundamental laws that govern the natural world and universe.',
  'DEPARTMENT OF STATISTICS':
    'Studies the collection, analysis, interpretation, and presentation of data for decision making and research.',
  'DEPARTMENT OF BOTANY':
    'Studies plants, their structure, growth, reproduction, metabolism, diseases, and relation to the environment.',
  'DEPARTMENT OF GEOLOGY':
    "Examines Earth's materials, processes, history, and evolution through the study of rocks, minerals, and landforms.",
  'DEPARTMENT OF MICROBIOLOGY':
    'Studies microscopic organisms like bacteria, viruses, fungi, and protozoa, and their effects on other living organisms.',
  'DEPARTMENT OF ZOOLOGY':
    'Focuses on the study of animals, their structure, embryology, evolution, classification, habits, and distribution.',

  // Social Sciences
  'DEPARTMENT OF PSYCHOLOGY':
    'Studies human behavior, mental processes, and their relationship to brain functions and social environments.',
  'DEPARTMENT OF ECONOMICS':
    'Analyzes production, distribution, and consumption of goods and services through economic theories and modeling.',
  'DEPARTMENT OF GEOGRAPHY':
    "Studies Earth's landscapes, environments, and human interactions with geographic spaces and places.",
  'DEPARTMENT OF SOCIOLOGY':
    'Examines human society, social relationships, interactions, cultures, and institutions through empirical investigation.',

  // Technology
  'DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING':
    'Focuses on designing, developing, and maintaining electrical systems, electronic devices, and communication technologies.',
  'DEPARTMENT OF MECHANICAL ENGINEERING':
    'Studies design, production, and operation of machinery, focusing on mechanics, thermodynamics, and materials.',
  'DEPARTMENT OF INDUSTRIAL AND PRODUCTION ENGINEERING':
    'Optimizes complex systems and processes in manufacturing and service industries for efficiency and productivity.',

  // Veterinary Medicine
  'DEPARTMENT OF VETERINARY PHYSIOLOGY, BIOCHEMISTRY AND PHARMACOLOGY':
    'Studies animal body functions, biochemical processes, and the effects of drugs on animal systems for veterinary applications.',
};

// Define the university structure
const universityData = [
  {
    name: 'FACULTY OF AGRICULTURE AND FORESTRY',
    departments: [
      'DEPARTMENT OF ANIMAL SCIENCE',
      'DEPARTMENT OF AGRICULTURAL ECONOMICS',
      'DEPARTMENT OF AGRONOMY',
      'DEPARTMENT OF FOREST RESOURCES MANAGEMENT',
    ],
  },
  {
    name: 'FACULTY OF ARTS',
    departments: [
      'DEPARTMENT OF MUSIC',
      'DEPARTMENT OF RELIGIOUS STUDIES',
      'DEPARTMENT OF ARABIC AND ISLAMIC STUDIES',
      'DEPARTMENT OF COMMUNICATION AND LANGUAGE ARTS',
      'DEPARTMENT OF EUROPEAN STUDIES',
      'DEPARTMENT OF HISTORY',
      'DEPARTMENT OF THEATRE ARTS',
      'DEPARTMENT OF PHILOSOPHY',
    ],
  },
  {
    name: 'COLLEGE OF MEDICINE',
    departments: [
      'DEPARTMENT OF HUMAN NUTRITION',
      'DEPARTMENT OF OBSTETRICS AND GYNAECOLOGY',
      'DEPARTMENT OF OPHTHALMOLOGY',
      'DEPARTMENT OF PAEDIATRICS',
      'DEPARTMENT OF PHYSIOTHERAPY',
      'DEPARTMENT OF RADIOTHERAPY',
      'DEPARTMENT OF SURGERY',
      'DEPARTMENT OF BIOCHEMISTRY',
      'DEPARTMENT OF EPIDEMIOLOGY, MEDICAL STATISTICS AND ENVIRONMENTAL HEALTH (EMSEH)',
      'DEPARTMENT OF HEALTH POLICY AND MANAGEMENT',
      'DEPARTMENT OF HEALTH PROMOTION AND EDUCATION',
      'INSTITUTE OF ADVANCED MEDICAL RESEARCH AND TRAINING',
      'DEPARTMENT OF MEDICINE',
      'DEPARTMENT OF PHYSIOLOGY',
      'DEPARTMENT OF PREVENTIVE MEDICINE AND PRIMARY CARE',
      'DEPARTMENT OF PSYCHIATRY',
    ],
  },
  {
    name: 'FACULTY OF EDUCATION',
    departments: [
      'DEPARTMENT OF TEACHER EDUCATION',
      'DEPARTMENT OF ADULT EDUCATION',
      'DEPARTMENT OF GUIDANCE AND COUNSELLING',
      'DEPARTMENT OF HUMAN KINETICS AND HEALTH EDUCATION',
    ],
  },
  {
    name: 'FACULTY OF PHARMACY',
    departments: ['DEPARTMENT OF PHARMACEUTICS AND INDUSTRIAL PHARMACY'],
  },
  {
    name: 'FACULTY OF SCIENCE',
    departments: [
      'DEPARTMENT OF MATHEMATICS',
      'DEPARTMENT OF PHYSICS',
      'DEPARTMENT OF STATISTICS',
      'DEPARTMENT OF BOTANY',
      'DEPARTMENT OF GEOLOGY',
      'DEPARTMENT OF MICROBIOLOGY',
      'DEPARTMENT OF ZOOLOGY',
    ],
  },
  {
    name: 'FACULTY OF THE SOCIAL SCIENCES',
    departments: [
      'DEPARTMENT OF PSYCHOLOGY',
      'DEPARTMENT OF ECONOMICS',
      'DEPARTMENT OF GEOGRAPHY',
      'DEPARTMENT OF SOCIOLOGY',
    ],
  },
  {
    name: 'FACULTY OF TECHNOLOGY',
    departments: [
      'DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING',
      'DEPARTMENT OF MECHANICAL ENGINEERING',
      'DEPARTMENT OF INDUSTRIAL AND PRODUCTION ENGINEERING',
    ],
  },
  {
    name: 'FACULTY OF VETERINARY MEDICINE',
    departments: [
      'DEPARTMENT OF VETERINARY PHYSIOLOGY, BIOCHEMISTRY AND PHARMACOLOGY',
    ],
  },
  {
    name: 'AFRICA REGIONAL CENTRE FOR INFORMATION SCIENCE',
    departments: [],
  },
];

const seedDatabase = async () => {
  console.log('Starting database seeding...');

  // Set up the database connection
  const isDevEnv = process.env.NODE_ENV === 'development';
  const DB_URL = isDevEnv
    ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL;

  if (!DB_URL) {
    console.error('Database URL not found in environment variables');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DB_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await pool.connect();
    console.log('Connected to database successfully 😃');

    const db = drizzle(pool, { schema });

    // Seed faculties and departments
    for (const facultyData of universityData) {
      console.log(`Creating faculty: ${facultyData.name}`);

      // Insert faculty
      const [createdFaculty] = await db
        .insert(faculty)
        .values({
          name: facultyData.name,
          description: `This is the ${facultyData.name}`,
        } as FacultyEntity)
        .returning()
        .catch((error) => {
          console.error(
            `Error creating faculty ${facultyData.name}`,
            error.message,
          );
          return [{ id: null }];
        });

      if (!createdFaculty.id) {
        console.warn(
          `Skipping departments for ${facultyData.name} as faculty creation failed`,
        );
        continue;
      }

      // Insert departments for this faculty
      for (const deptName of facultyData.departments) {
        console.log(
          `Creating department: ${deptName} under ${facultyData.name}`,
        );

        // Get a meaningful description from our map, or use a default one
        const deptDescription =
          departmentDescriptions[deptName] ||
          `This is the ${deptName} under ${facultyData.name}`;

        await db
          .insert(department)
          .values({
            name: deptName,
            description: deptDescription,
            facultyId: createdFaculty.id,
          } as DepartmentEntity)
          .catch((error) => {
            console.error(
              `Error creating department ${deptName}:`,
              error.message,
            );
          });
      }
    }

    console.log('Database seeding completed successfully! 🎉');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
};

// Run the seeder function
seedDatabase()
  .then(() => {
    console.log('Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding process failed:', error);
    process.exit(1);
  });
