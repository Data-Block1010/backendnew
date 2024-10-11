pragma circom 2.1.6;

include "node_modules/circomlib/circuits/comparators.circom";

template KYCVerification() {
    signal input dateOfBirth; // User's date of birth as a timestamp
    signal input currentDate; // Current date as a timestamp
    signal input name; // User's name
    signal input idNumber; // User's ID number
    signal input nationality; // User's nationality
    signal input expectedName; // Expected name
    signal input expectedIDNumber; // Expected ID number
    signal input expectedNationality; // Expected nationality
    signal input kycVerified; // KYC verification status

    signal output isOfLegalAge; // Output: Is the user of legal age?
    signal output isNameValid; // Output: Is the name valid?
    signal output isIDValid; // Output: Is the ID valid?
    signal output isNationalityValid; // Output: Is the nationality valid?
    signal output isKYCVerified; // Output: Is KYC verified?

    // Constants
    signal LEGAL_AGE_YEARS; // Legal age in years
    LEGAL_AGE_YEARS <== 18; // Set legal age to 18 years

    signal SECONDS_IN_A_YEAR; // Seconds in a year
    SECONDS_IN_A_YEAR <== 365 * 24 * 60 * 60; // Calculate seconds in a year

    signal LEGAL_AGE; // Legal age in seconds
    LEGAL_AGE <== LEGAL_AGE_YEARS * SECONDS_IN_A_YEAR; // Calculate legal age in seconds

    // Calculate age
    signal age; // Age in seconds
    age <== currentDate - dateOfBirth; // Calculate age

    // Check if the user is of legal age
    component ageCheck = GreaterEqThan(252);
    ageCheck.in[0] <== age;
    ageCheck.in[1] <== LEGAL_AGE;
    isOfLegalAge <== ageCheck.out;

    // Check if the name matches
    component nameCheck = IsEqual();
    nameCheck.in[0] <== name;
    nameCheck.in[1] <== expectedName;
    isNameValid <== nameCheck.out;

    // Check if the ID number matches
    component idCheck = IsEqual();
    idCheck.in[0] <== idNumber;
    idCheck.in[1] <== expectedIDNumber;
    isIDValid <== idCheck.out;

    // Check if the nationality matches
    component nationalityCheck = IsEqual();
    nationalityCheck.in[0] <== nationality;
    nationalityCheck.in[1] <== expectedNationality;
    isNationalityValid <== nationalityCheck.out;

    // KYC verification check
    isKYCVerified <== kycVerified; // This remains a direct assignment
}

// Main component
component main = KYCVerification();