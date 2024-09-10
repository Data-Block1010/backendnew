"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretKeyService = void 0;
// src/services/secretKeyService.ts
const crypto_1 = require("crypto");
class SecretKeyService {
    static generateSecretKey() {
        // Generate a 256-bit key (32 bytes) and convert it to a base64 string
        return (0, crypto_1.randomBytes)(32).toString('base64');
    }
}
exports.SecretKeyService = SecretKeyService;
