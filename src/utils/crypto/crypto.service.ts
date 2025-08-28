import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
} from 'crypto';
// import { ConfigService } from '@nestjs/config';
import { configService } from 'src/utils/config/config.service';
import { CryptoInterface } from './crypto.interface';
import { ENV } from 'src/utils/config/env.enum';

class CryptoService implements CryptoInterface {
  protected static readonly key: Buffer = createHash('sha256')
    .update(configService.get(ENV.CRYPTO_KEY))
    .digest()
    .slice(0, 32);
  protected static readonly iv: Buffer = createHash('sha256')
    .update(configService.get(ENV.CRYPTO_IV))
    .digest()
    .slice(0, 16);
  private readonly encryptionAlgorithm: string;
  private static instance: CryptoService;

  constructor() {
    // Set default algorithm if not provided in env
    this.encryptionAlgorithm = configService.get(
      ENV.CRYPTO_ENCRYPTION_ALGORITHM,
    );
    if (!this.encryptionAlgorithm) {
      throw new Error('Encryption algorithm not configured');
    }
  }

  encrypt(text: string) {
    const cipher = createCipheriv(
      this.encryptionAlgorithm,
      CryptoService.key,
      CryptoService.iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    return encrypted.toString('hex');
  }

  decrypt(text: string) {
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = createDecipheriv(
      this.encryptionAlgorithm,
      CryptoService.key,
      CryptoService.iv,
    );
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  random(): string {
    return randomBytes(16).toString();
  }

  randomInt(): string {
    return randomInt(100000, 1000000).toString();
  }

  generateRandomKey(bytes: number): string {
    return randomBytes(bytes).toString('hex');
  }

  static getInstance(): CryptoService {
    if (!this.instance) {
      this.instance = new CryptoService();
    }
    return this.instance;
  }
}

export const cryptoService = CryptoService.getInstance(); // To return an instance of the CryptoService class
