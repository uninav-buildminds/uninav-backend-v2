export function extractCourseCode(query: string) {
  const courseCodeRegex = /(?:^|\s+)([A-Z]{3}\s*\d{3})(?:\s+|$)/g;
  const match = query.match(courseCodeRegex);
  return match ? match[1].replace(/\s+/g, '') : null;
}

