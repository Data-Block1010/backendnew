import { deployContract } from "./utils";

// Example deployment script for DataStorage contract
// This script deploys the DataStorage contract to the selected network.
export default async function () {
  const contractArtifactName = "DataStore";  // The contract name to deploy
  const constructorArguments: any[] = [];      // No constructor arguments for DataStorage
  
  // Deploy the DataStorage contract
  await deployContract(contractArtifactName, constructorArguments);

  console.log("✅ DataStorage contract deployed successfully!");
}
