import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  universityData,
  facultyDescriptions,
  departmentDescriptions,
  courseData,
} from './data';
import { seedFacultiesAndDepartments, seedCourses } from './utils/seedHelpers';

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

    const db = drizzle(pool);

    console.log('Seeding faculties and departments...');
    await seedFacultiesAndDepartments(
      db,
      universityData,
      facultyDescriptions,
      departmentDescriptions,
    );

    console.log('Seeding courses and relationships...');
    await seedCourses(db, courseData);

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
