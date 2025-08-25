import { Transform } from 'class-transformer';

export function TransformStringToArray() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map((item) => item.trim());
      }
    }
    return value;
  });
}
