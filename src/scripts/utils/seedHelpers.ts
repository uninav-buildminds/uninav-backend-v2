import { inArray } from 'drizzle-orm';
import { CourseData } from '../data/courses.data';
import * as schema from 'src/modules/drizzle/schema/schema';

/**
 * Seeds faculties and their departments into the database
 */
export async function seedFacultiesAndDepartments(
  db,
  universityData,
  facultyDescriptions,
  departmentDescriptions,
) {
  for (const facultyData of universityData) {
    console.log(`Creating faculty: ${facultyData.name}`);

    const [createdFaculty] = await db
      .insert(schema.faculty) // Direct reference to schema.faculty
      .values({
        name: facultyData.name,
        description:
          facultyDescriptions[facultyData.name] ||
          `Faculty of ${facultyData.name}`,
      })
      .returning()
      .catch((error) => {
        console.error(
          `Error creating faculty ${facultyData.name}:`,
          error.message,
        );
        return [{ id: null }];
      });

    if (!createdFaculty?.id) {
      console.warn(
        `Skipping departments for ${facultyData.name} as faculty creation failed`,
      );
      continue;
    }

    // Insert departments for this faculty
    for (const deptName of facultyData.departments) {
      console.log(`Creating department: ${deptName} under ${facultyData.name}`);

      const deptDescription =
        departmentDescriptions[deptName] ||
        `This is the ${deptName} under ${facultyData.name}`;

      await db
        .insert(schema.department) // Direct reference to schema.department
        .values({
          name: deptName,
          description: deptDescription,
          facultyId: createdFaculty.id,
        })
        .catch((error) => {
          console.error(
            `Error creating department ${deptName}:`,
            error.message,
          );
        });
    }
  }
}

/**
 * Seeds courses and their department relationships
 */
export async function seedCourses(db, courseData) {
  console.log('Seeding courses and department relationships...');

  const allDepartments = await db.select().from(schema.department); // Direct reference
  const departmentMap = new Map(
    allDepartments.map((dept) => [dept.name, dept]),
  );

  for (const course of courseData) {
    console.log(`Creating course: ${course.code} - ${course.name}`);

    const [createdCourse] = await db
      .insert(schema.courses) // Direct reference to schema.courses
      .values({
        courseCode: course.code,
        courseName: course.name,
        description: course.description,
      })
      .returning()
      .catch((error) => {
        console.error(`Error creating course ${course.code}:`, error.message);
        return [{ id: null }];
      });

    if (!createdCourse?.id) continue;

    if (course.departments.includes('ALL_DEPARTMENTS')) {
      // Add this course to all departments
      for (const dept of allDepartments) {
        for (const level of course.levels) {
          await createDeptCourseRelationship(
            db,
            dept.id,
            createdCourse.id,
            level,
            dept.name,
            course.code,
          );
        }
      }
    } else {
      // Add this course to specified departments
      for (const deptName of course.departments) {
        const dept = departmentMap.get(deptName);
        if (!dept) {
          console.warn(
            `Department not found: ${deptName} for course ${course.code}`,
          );
          continue;
        }

        for (const level of course.levels) {
          await createDeptCourseRelationship(
            db,
            (dept as any).id,
            createdCourse.id,
            level,
            deptName,
            course.code,
          );
        }
      }
    }
  }
}

/**
 * Helper to create department-course relationship
 */
async function createDeptCourseRelationship(
  db,
  departmentId,
  courseId,
  level,
  deptName,
  courseCode,
) {
  await db
    .insert(schema.departmentLevelCourses) // Direct reference
    .values({
      departmentId,
      courseId,
      level,
    })
    .catch((error) => {
      console.error(
        `Error creating department-course relationship for ${deptName} - ${courseCode}:`,
        error.message,
      );
    });
}
