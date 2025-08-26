import { Injectable, ConflictException, Logger } from '@nestjs/common';

@Injectable()
export class UsernameGeneratorHelper {
  private readonly logger = new Logger(UsernameGeneratorHelper.name);

  // Word lists for generating unique usernames
  private readonly adjectives = [
    'swift',
    'bright',
    'clever',
    'bold',
    'calm',
    'brave',
    'keen',
    'wise',
    'cool',
    'nice',
    'smart',
    'quick',
    'fast',
    'sharp',
    'fresh',
    'young',
    'wild',
    'free',
    'kind',
    'good',
    'great',
    'prime',
    'super',
    'mega',
    'ultra',
    'epic',
    'star',
    'pure',
    'true',
    'real',
    'lucky',
    'happy',
    'sunny',
    'golden',
    'silver',
    'royal',
    'noble',
    'grand',
    'elite',
    'pro',
    'ace',
    'top',
    'best',
    'max',
    'plus',
    'new',
    'next',
    'blue',
    'red',
    'green',
  ];

  private readonly nouns = [
    'tiger',
    'eagle',
    'wolf',
    'lion',
    'bear',
    'hawk',
    'fox',
    'cat',
    'dog',
    'bird',
    'fish',
    'star',
    'moon',
    'sun',
    'fire',
    'water',
    'earth',
    'wind',
    'storm',
    'wave',
    'rock',
    'tree',
    'leaf',
    'flower',
    'river',
    'ocean',
    'mountain',
    'valley',
    'hill',
    'peak',
    'knight',
    'warrior',
    'hunter',
    'scout',
    'ranger',
    'sage',
    'mage',
    'hero',
    'king',
    'queen',
    'wizard',
    'ninja',
    'pirate',
    'rebel',
    'ghost',
    'shadow',
    'light',
    'dream',
    'quest',
    'journey',
  ];

  /**
   * Generates a unique username with random word combinations and numbers
   * Format: [adjective][noun][randomNumber]
   */
  generateRandomUsername(): string {
    const adjective =
      this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)];
    const randomNumber = Math.floor(Math.random() * 9999) + 1; // 1-9999

    return `${adjective}${noun}${randomNumber}`;
  }

  /**
   * Generates multiple unique username suggestions
   * @param count Number of suggestions to generate
   * @returns Array of unique username suggestions
   */
  generateUsernameSuggestions(count: number = 5): string[] {
    const suggestions = new Set<string>();

    while (suggestions.size < count) {
      suggestions.add(this.generateRandomUsername());
    }

    return Array.from(suggestions);
  }

  /**
   * Generates a username with fallback to simple base + number format
   * @param baseUsername Optional base username (usually from email or name)
   * @returns Generated username
   */
  generateUsernameWithFallback(baseUsername?: string): string {
    // If no base username provided, use random generation
    if (!baseUsername) {
      return this.generateRandomUsername();
    }

    // Clean base username (remove special chars, spaces, etc.)
    const cleanBase = baseUsername
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15); // Limit length

    // If cleaned base is empty or too short, use random generation
    if (cleanBase.length < 3) {
      return this.generateRandomUsername();
    }

    // Add random number to base
    const randomNumber = Math.floor(Math.random() * 9999) + 1;
    return `${cleanBase}${randomNumber}`;
  }

  /**
   * Ensures username meets requirements (length, format, etc.)
   * @param username Username to validate
   * @returns Boolean indicating if username is valid
   */
  isValidUsername(username: string): boolean {
    // Username requirements:
    // - 3-30 characters
    // - Only alphanumeric characters and underscores
    // - Must start with letter or number
    const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_]{2,29}$/;
    return usernameRegex.test(username);
  }

  /**
   * Cleans and formats a username to meet requirements
   * @param username Raw username to clean
   * @returns Cleaned username
   */
  cleanUsername(username: string): string {
    return username
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '') // Remove invalid characters
      .replace(/^[^a-z0-9]+/, '') // Remove leading invalid characters
      .substring(0, 30); // Limit length
  }
}
