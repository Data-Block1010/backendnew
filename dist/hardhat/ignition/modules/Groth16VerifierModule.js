"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modules_1 = require("@nomicfoundation/hardhat-ignition/modules");
const Groth16VerifierModule = (0, modules_1.buildModule)("Groth16VerifierModule", (m) => {
    // Deploy the Groth16Verifier contract
    const groth16Verifier = m.contract("Groth16Verifier", []);
    return { groth16Verifier };
});
exports.default = Groth16VerifierModule;
