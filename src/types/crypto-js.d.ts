// src/types/crypto-js.d.ts
declare module 'crypto-js' {
    // Define the types you need or use `any` if unsure
    import * as crypto from 'crypto';

    export const AES: any;
    export const enc: {
        Utf8: any;
    };
    export const SHA256: any;
}
