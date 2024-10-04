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
exports.ZkSyncService = void 0;
const web3_1 = __importDefault(require("web3"));
const web3_plugin_zksync_1 = require("web3-plugin-zksync");
const dotenv = __importStar(require("dotenv"));
const DataStore_json_1 = __importDefault(require("./DataStore.json"));
// Load environment variables from .env file
dotenv.config();
const web3 = new web3_1.default(process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia-api.lisk.com");
const zksyncRpcUrl = process.env.ZKSYNC_RPC_URL || "https://sepolia.era.zksync.dev";
console.log(`📞 Connecting to zkSync Era [${zksyncRpcUrl}]`);
// Register zkSync plugin
web3.registerPlugin(new web3_plugin_zksync_1.ZKsyncPlugin(zksyncRpcUrl));
class ZkSyncService {
    constructor() {
        this.web3 = web3;
        this.contractAddress = process.env.YOUR_CONTRACT_ADDRESS || "";
        this.contractAbi = DataStore_json_1.default.abi;
        this.privateKey = process.env.ACCOUNT_PRIVATE_KEY || "";
        this.hardcodedFromAddress = process.env.HARDCODED_FROM_ADDRESS || "0xYourHardcodedAddress";
    }
    // Method for getting user balance
    async getBalance(address) {
        const balance = await this.web3.eth.getBalance(address);
        return this.web3.utils.fromWei(balance, "ether");
    }
    // Method for backend to send transactions with the hardcoded from address
    async sendTransaction(to, value) {
        const tx = {
            from: this.hardcodedFromAddress,
            to,
            value: this.web3.utils.toWei(value, "ether"),
            gas: 21000,
        };
        const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt.transactionHash;
    }
    // Method for backend to interact with contracts
    async callContractMethod(contractAddress, abi, method, args) {
        const contract = new this.web3.eth.Contract(abi, contractAddress);
        return contract.methods[method](...args).call();
    }
    // Method for backend to send contract transaction with hardcoded from address
    async sendContractTransaction(contractAddress, abi, method, args) {
        const contract = new this.web3.eth.Contract(abi, contractAddress);
        const data = contract.methods[method](...args).encodeABI();
        // Estimate gas for the transaction
        const gasLimit = await this.web3.eth.estimateGas({
            from: this.hardcodedFromAddress,
            to: contractAddress,
            data: data,
        });
        // Get the latest block to determine the transaction type
        const latestBlock = await this.web3.eth.getBlock('latest');
        const tx = {
            from: this.hardcodedFromAddress,
            to: contractAddress,
            data,
            gas: gasLimit,
        };
        if (latestBlock.baseFeePerGas) {
            // EIP-1559 Transaction (type 0x2)
            const maxPriorityFeePerGas = this.web3.utils.toWei('2', 'gwei'); // Example: 2 gwei
            const maxFeePerGas = this.web3.utils.toWei('50', 'gwei'); // Example: 50 gwei
            tx.maxPriorityFeePerGas = maxPriorityFeePerGas;
            tx.maxFeePerGas = maxFeePerGas;
        }
        else {
            // Legacy transaction (type 0)
            const gasPrice = await this.web3.eth.getGasPrice();
            tx.gasPrice = gasPrice;
        }
        const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt.transactionHash;
    }
    // Method for user-signed transaction submission
    async submitSignedTransaction(signedTx) {
        try {
            // Send the signed transaction to the network
            const receipt = await this.web3.eth.sendSignedTransaction(signedTx);
            console.log("Transaction receipt:", receipt);
            return receipt.transactionHash;
        }
        catch (error) {
            console.error("Error submitting signed transaction:", error);
            throw error;
        }
    }
    // Contract interaction methods for backend
    // Store data on the blockchain
    async storeData(dataHash) {
        return this.sendContractTransaction(this.contractAddress, this.contractAbi, "storeData", [dataHash]);
    }
    // Update existing data on the blockchain
    async updateData(index, newDataHash) {
        return this.sendContractTransaction(this.contractAddress, this.contractAbi, "updateData", [index, newDataHash]);
    }
    // Delete data on the blockchain
    async deleteData(nullHash) {
        return this.sendContractTransaction(this.contractAddress, this.contractAbi, "deleteData", [nullHash]);
    }
    // Grant access to another user
    async grantAccess(userAddress) {
        return this.sendContractTransaction(this.contractAddress, this.contractAbi, "grantAccess", [userAddress]);
    }
    // Revoke access from a user
    async revokeAccess(userAddress) {
        return this.sendContractTransaction(this.contractAddress, this.contractAbi, "revokeAccess", [userAddress]);
    }
    // Get all data records for an owner
    async getAllData(ownerAddress) {
        const contract = new this.web3.eth.Contract(this.contractAbi, this.contractAddress);
        try {
            // Call the 'getData' method to retrieve all data records for a user
            const dataRecords = await contract.methods.getData(ownerAddress).call();
            console.log("Data retrieved from blockchain:", dataRecords);
            return dataRecords;
        }
        catch (error) {
            console.error("Error retrieving data:", error);
            throw new Error("Failed to retrieve data from blockchain.");
        }
    }
    // Get specific data by data hash for an owner
    async getDataByHash(ownerAddress, dataHash) {
        const contract = new this.web3.eth.Contract(this.contractAbi, this.contractAddress);
        try {
            // Call the 'getDataByHash' method
            const dataRecord = await contract.methods.getDataByHash(ownerAddress, dataHash).call();
            console.log("Data record retrieved:", dataRecord);
            return dataRecord;
        }
        catch (error) {
            console.error("Error retrieving data by hash:", error);
            throw new Error("Failed to retrieve data by hash.");
        }
    }
}
exports.ZkSyncService = ZkSyncService;
