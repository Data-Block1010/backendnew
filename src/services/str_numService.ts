import { Buffer } from 'buffer';

class StringNumberService {
    /**
     * Converts a string to a number using Base64 encoding.
     * @param str - The input string to convert.
     * @returns The number representation of the encoded string.
     */
    public static stringToNumber(str: string): number {
        // Encode the string to Base64
        const base64Encoded = Buffer.from(str, 'utf-8').toString('base64');

        // Convert Base64 to a number
        let numberRepresentation = 0;
        for (let i = 0; i < base64Encoded.length; i++) {
            numberRepresentation += base64Encoded.charCodeAt(i);
        }

        return numberRepresentation;
    }

    /**
     * Converts a number back to the original string.
     * @param num - The number representation to convert.
     * @returns The original string.
     */
    public static numberToString(num: number): string {
        // Create a Base64 string from the number
        let base64String = '';
        while (num > 0) {
            base64String += String.fromCharCode(num % 256); // Use modulo to wrap around character codes
            num = Math.floor(num / 256); // Reduce the number
        }
        base64String = base64String.split('').reverse().join(''); // Reverse to get correct order

        // Decode the Base64 string back to the original string
        return Buffer.from(base64String, 'base64').toString('utf-8');
    }
}

// Example usage
const originalString = "Hello, World!";
const numberRepresentation = StringNumberService.stringToNumber(originalString);
console.log("Number Representation:", numberRepresentation);

const restoredString = StringNumberService.numberToString(numberRepresentation);
console.log("Restored String:", restoredString);

export default StringNumberService;
