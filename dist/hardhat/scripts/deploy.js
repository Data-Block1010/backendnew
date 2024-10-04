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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = require("web3");
const web3_plugin_zksync_1 = require("web3-plugin-zksync");
const dotenv = __importStar(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
dotenv.config();
async function main() {
    try {
        // Initialize Web3 instance with zkSync Era L2 support
        const web3 = new web3_1.Web3(process.env.SEPOLIA_RPC_URL || "https://rpc2.sepolia.org");
        web3.registerPlugin(new web3_plugin_zksync_1.ZKsyncPlugin(web3_plugin_zksync_1.Web3ZKsyncL2.initWithDefaultProvider(web3_plugin_zksync_1.types.Network.Sepolia)));
        const zksync = web3.ZKsync;
        // Retrieve the private key and RPC URL from environment variables
        const PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY || "";
        const ZKSYNC_RPC_URL = process.env.ZKSYNC_RPC_URL || "";
        if (!PRIVATE_KEY) {
            throw new Error("Private key not found in environment variables");
        }
        if (!ZKSYNC_RPC_URL) {
            throw new Error("zkSync RPC URL not found in environment variables");
        }
        console.log("✅ Private key and zkSync RPC URL loaded successfully", PRIVATE_KEY);
        // Initialize a wallet using the private key
        const wallet = new zksync.Wallet("cd1e3ad2e67471d576b5fdca01b715a1f2149d41516e3524fc51589aa44cb9a7");
        // Load ABI and Bytecode from the compiled contract
        const contractPath = "./artifacts-zk/contracts/DataStorage.sol/DataStorage.json";
        if (!fs_1.default.existsSync(contractPath)) {
            throw new Error(`Contract file not found at ${contractPath}`);
        }
        console.log("✅ Contract file found at:", contractPath);
        const contractData = JSON.parse(fs_1.default.readFileSync(contractPath, "utf8"));
        const contractAbi = contractData.abi;
        const contractBytecode = contractData.bytecode;
        if (!contractAbi || !contractBytecode) {
            throw new Error("ABI or bytecode missing from the contract JSON file");
        }
        console.log("✅ ABI and Bytecode loaded");
        // Create a ContractFactory using the ABI, bytecode, and wallet
        const contractFactory = new web3_plugin_zksync_1.ContractFactory(contractAbi, contractBytecode, wallet);
        // Deploy the contract
        const contract = await contractFactory.deploy();
        if (!contract || !contract.options || !contract.options.address) {
            throw new Error("Failed to deploy contract");
        }
        console.log("✅ Contract deployed successfully!");
        console.log("Contract address:", contract.options.address);
    }
    catch (error) {
        console.error(`❌ Error executing script: ${error.message}`);
    }
}
main()
    .then(() => console.log("✅ Script executed successfully"))
    .catch((error) => console.error(`❌ Error in main: ${error.message}`));
