"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const hre = __importStar(require("hardhat"));
const utils_1 = require("./utils");
const ethers_1 = require("ethers");
// Address of the contract to interact with
const CONTRACT_ADDRESS = "";
if (!CONTRACT_ADDRESS)
    throw "⛔️ Provide address of the contract to interact with!";
// An example of a script to interact with the contract
async function default_1() {
    console.log(`Running script to interact with contract ${CONTRACT_ADDRESS}`);
    // Load compiled contract info
    const contractArtifact = await hre.artifacts.readArtifact("Greeter");
    // Initialize contract instance for interaction
    const contract = new ethers_1.ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, (0, utils_1.getWallet)() // Interact with the contract on behalf of this wallet
    );
    // Run contract read function
    const response = await contract.greet();
    console.log(`Current message is: ${response}`);
    // Run contract write function
    const transaction = await contract.setGreeting("Hello people!");
    console.log(`Transaction hash of setting new message: ${transaction.hash}`);
    // Wait until transaction is processed
    await transaction.wait();
    // Read message after transaction
    console.log(`The message now is: ${await contract.greet()}`);
}
