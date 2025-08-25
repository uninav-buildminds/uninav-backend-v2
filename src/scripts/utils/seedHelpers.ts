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
