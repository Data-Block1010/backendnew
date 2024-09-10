pragma circom 2.0.0;

template IsEqual() {
    signal input in[2];
    signal output out;

    out <== in[0] === in[1] ? 1 : 0;
}

template LessThan() {
    signal input in[2];
    signal output out;

    signal diff;
    diff <== in[1] - in[0];
    out <== diff > 0 ? 1 : 0;
}

template GreaterThan() {
    signal input in[2];
    signal output out;

    component lt = LessThan();
    lt.in[0] <== in[1];
    lt.in[1] <== in[0];
    lt.out ==> out;
}

template LessEqThan() {
    signal input in[2];
    signal output out;

    signal diff;
    diff <== in[1] - in[0];
    out <== diff >= 0 ? 1 : 0;
}

template GreaterEqThan() {
    signal input in[2];
    signal output out;

    component leq = LessEqThan();
    leq.in[0] <== in[1];
    leq.in[1] <== in[0];
    leq.out ==> out;
}
