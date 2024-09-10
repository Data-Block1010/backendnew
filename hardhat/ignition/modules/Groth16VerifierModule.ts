import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Groth16VerifierModule = buildModule("Groth16VerifierModule", (m) => {
  // Deploy the Groth16Verifier contract
  const groth16Verifier = m.contract("Groth16Verifier", []);

  return { groth16Verifier };
});

export default Groth16VerifierModule;
