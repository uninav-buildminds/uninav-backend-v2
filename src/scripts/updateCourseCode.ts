import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { courses } from '../../libs/common/src/modules/database/schema/course.schema';
import { eq } from 'drizzle-orm';

const updateCourseCodes = async () => {
  console.log('Starting course code update...');

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

    // Get all courses
    const allCourses = await db.select().from(courses);
    console.log(`Found ${allCourses.length} courses to process`);

    let updatedCount = 0;
    let errorCount = 0;

    // Process each course
    for (const course of allCourses) {
      try {
        // Remove spaces from course code
        const newCourseCode = course.courseCode.replace(/\s+/g, '');

        // Only update if the course code actually contains spaces
        if (newCourseCode !== course.courseCode) {
          await db
            .update(courses)
            .set({ courseCode: newCourseCode })
            .where(eq(courses.id, course.id));

          updatedCount++;
          console.log(
            `Updated course code: ${course.courseCode} -> ${newCourseCode}`,
          );
        }
      } catch (error) {
        errorCount++;
        console.error(`Error updating course ${course.courseCode}:`, error);
      }
    }

    console.log('\nUpdate Summary:');
    console.log(`Total courses processed: ${allCourses.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
  } catch (error) {
    console.error('Error during course code update:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
};

// Run the update function
updateCourseCodes()
  .then(() => {
    console.log('Course code update process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Course code update process failed:', error);
    process.exit(1);
  });
