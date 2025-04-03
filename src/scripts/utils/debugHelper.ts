/**
 * Debugs the database structure to help identify issues
 */
export function debugDbObject(db: any) {
  console.log('DB Object Structure:');
  console.log('------------------');

  // Check if db has insert method
  console.log(`db.insert exists: ${typeof db.insert === 'function'}`);

  // Check schema attachment
  console.log('Schema object keys:', Object.keys(db.schema || {}));

  if (db.schema && db.schema.faculty) {
    console.log('Faculty schema exists');
  } else {
    console.log('ERROR: Faculty schema not found in db.schema');
  }

  // Check for common methods
  const methods = ['select', 'insert', 'update', 'delete'].filter(
    (method) => typeof db[method] === 'function',
  );
  console.log('Available methods:', methods);

  console.log('------------------');
}

/**
 * Helper function to test if a simple query works
 */
export async function testQuery(db: any) {
  try {
    // Try a simple select query
    console.log('Testing simple select query...');
    const result = await db.select().from(db.schema.faculty).limit(1);
    console.log('Query result:', result);
    return true;
  } catch (error) {
    console.error('Query test failed:', error.message);
    return false;
  }
}
