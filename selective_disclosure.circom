pragma circom 2.1.6;

include "node_modules/circomlib/circuits/comparators.circom";

template ComparisonCheck() {
    signal input value;        // The value to check
    signal input threshold1;   // First threshold (e.g., lower bound or comparison value)
    signal input threshold2;   // Second threshold (optional, e.g., upper bound)
    signal input operation;    // Operation type: 0=greater than, 1=less than, 2=equal, 3=range check

    signal output isValid;

    // Greater than check
    component gt = GreaterThan(252);
    gt.in[0] <== value;
    gt.in[1] <== threshold1;

    // Less than check
    component lt = LessThan(252);
    lt.in[0] <== value;
    lt.in[1] <== threshold1;

    // Equal check
    component eq = IsEqual();
    eq.in[0] <== value;
    eq.in[1] <== threshold1;

    // Range check
    component gtLower = GreaterEqThan(252);
    gtLower.in[0] <== value;
    gtLower.in[1] <== threshold1;

    component ltUpper = LessEqThan(252);
    ltUpper.in[0] <== value;
    ltUpper.in[1] <== threshold2;

    signal isInRange;
    isInRange <== gtLower.out * ltUpper.out;

    // Binary selector signals
    signal isGtOpTemp, isLtOpTemp, isEqOpTemp, isRangeOpTemp;
    signal isGtOp, isLtOp, isEqOp, isRangeOp;

    // Operation checks
    isGtOpTemp <== operation - 0;
    component isGtOpZero = IsZero();
    isGtOpZero.in <== isGtOpTemp;
    isGtOp <== 1 - isGtOpZero.out;

    isLtOpTemp <== operation - 1;
    component isLtOpZero = IsZero();
    isLtOpZero.in <== isLtOpTemp;
    isLtOp <== 1 - isLtOpZero.out;

    isEqOpTemp <== operation - 2;
    component isEqOpZero = IsZero();
    isEqOpZero.in <== isEqOpTemp;
    isEqOp <== 1 - isEqOpZero.out;

    isRangeOpTemp <== operation - 3;
    component isRangeOpZero = IsZero();
    isRangeOpZero.in <== isRangeOpTemp;
    isRangeOp <== 1 - isRangeOpZero.out;

    // Intermediate results
    signal resultGtPart, resultLtPart, resultEqPart, resultRangePart;

    resultGtPart <== gt.out * isGtOp;
    resultLtPart <== lt.out * isLtOp;
    resultEqPart <== eq.out * isEqOp;
    resultRangePart <== isInRange * isRangeOp;

    // Sum the results in steps
    signal sum1, sum2, sum3;

    sum1 <== resultGtPart + resultLtPart;
    sum2 <== sum1 + resultEqPart;
    sum3 <== sum2 + resultRangePart;

    isValid <== sum3;
}

component main = ComparisonCheck();
