export class DataFormatter {
  static formatObject<T = any>(
    data: { [key: string]: any },
    exclude: (keyof T)[] = [],
    defaultsExclude = ['id', 'createdAt', 'updatedAt', 'deletedAt'],
  ): void {
    const toExclude = [...new Set([...defaultsExclude, ...exclude])];
    // Delete other fields if specified
    if (toExclude) {
      toExclude.forEach((field) => {
        delete data[field as string];
      });
    }
    // Recursively format nested objects and arrays
    for (let key in data) {
      if (Array.isArray(data[key]) && data[key].length) {
        data[key] = data[key].map((item: any) => {
          if (typeof item === 'object') {
            this.formatObject(item);
          }
          return item;
        });
      } else if (
        typeof data[key] === 'object' &&
        data[key] !== null &&
        Object.keys(data[key]).length > 0
      ) {
        this.formatObject(data[key]);
      }
    }
  }
}
