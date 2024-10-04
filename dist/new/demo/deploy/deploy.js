"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const utils_1 = require("./utils");
// Example deployment script for DataStorage contract
// This script deploys the DataStorage contract to the selected network.
async function default_1() {
    const contractArtifactName = "DataStore"; // The contract name to deploy
    const constructorArguments = []; // No constructor arguments for DataStorage
    // Deploy the DataStorage contract
    await (0, utils_1.deployContract)(contractArtifactName, constructorArguments);
    console.log("✅ DataStorage contract deployed successfully!");
}
