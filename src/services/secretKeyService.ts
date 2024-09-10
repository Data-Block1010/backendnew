// src/services/secretKeyService.ts
import { randomBytes } from 'crypto';

export class SecretKeyService {
    static generateSecretKey(): string {
        // Generate a 256-bit key (32 bytes) and convert it to a base64 string
        return randomBytes(32).toString('base64');
    }
}
