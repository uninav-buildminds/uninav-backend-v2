import { SetMetadata } from '@nestjs/common';
import { SKIP_RATE_LIMIT_KEY } from '../middleware/rate-limit.constants';

/**
 * Marks a controller or handler as exempt from rate limiting.
 * To exclude specific paths, also add them to consumer.exclude() in AppModule.configure().
 */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);
