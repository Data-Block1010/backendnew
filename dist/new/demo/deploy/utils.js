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
exports.LOCAL_RICH_WALLETS = exports.deployContract = exports.verifyContract = exports.verifyEnoughBalance = exports.getWallet = exports.getProvider = void 0;
const zksync_ethers_1 = require("zksync-ethers");
const hre = __importStar(require("hardhat"));
const hardhat_zksync_1 = require("@matterlabs/hardhat-zksync");
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
require("@matterlabs/hardhat-zksync-node/dist/type-extensions");
require("@matterlabs/hardhat-zksync-verify/dist/src/type-extensions");
// Load env file
dotenv_1.default.config();
const getProvider = () => {
    const rpcUrl = hre.network.config.url;
    if (!rpcUrl)
        throw `⛔️ RPC URL wasn't found in "${hre.network.name}"! Please add a "url" field to the network config in hardhat.config.ts`;
    // Initialize ZKsync Provider
    const provider = new zksync_ethers_1.Provider(rpcUrl);
    return provider;
};
exports.getProvider = getProvider;
const getWallet = (privateKey) => {
    if (!privateKey) {
        // Get wallet private key from .env file
        if (!process.env.WALLET_PRIVATE_KEY)
            throw "⛔️ Wallet private key wasn't found in .env file!";
    }
    const provider = (0, exports.getProvider)();
    // Initialize ZKsync Wallet
    const wallet = new zksync_ethers_1.Wallet(privateKey !== null && privateKey !== void 0 ? privateKey : process.env.WALLET_PRIVATE_KEY, provider);
    return wallet;
};
exports.getWallet = getWallet;
const verifyEnoughBalance = async (wallet, amount) => {
    // Check if the wallet has enough balance
    const balance = await wallet.getBalance();
    if (balance < amount)
        throw `⛔️ Wallet balance is too low! Required ${ethers_1.ethers.formatEther(amount)} ETH, but current ${wallet.address} balance is ${ethers_1.ethers.formatEther(balance)} ETH`;
};
exports.verifyEnoughBalance = verifyEnoughBalance;
/**
 * @param {string} data.contract The contract's path and name. E.g., "contracts/Greeter.sol:Greeter"
 */
const verifyContract = async (data) => {
    const verificationRequestId = await hre.run("verify:verify", Object.assign(Object.assign({}, data), { noCompile: true }));
    return verificationRequestId;
};
exports.verifyContract = verifyContract;
const deployContract = async (contractArtifactName, constructorArguments, options) => {
    var _a;
    const log = (message) => {
        if (!(options === null || options === void 0 ? void 0 : options.silent))
            console.log(message);
    };
    log(`\nStarting deployment process of "${contractArtifactName}"...`);
    const wallet = (_a = options === null || options === void 0 ? void 0 : options.wallet) !== null && _a !== void 0 ? _a : (0, exports.getWallet)();
    const deployer = new hardhat_zksync_1.Deployer(hre, wallet);
    const artifact = await deployer
        .loadArtifact(contractArtifactName)
        .catch((error) => {
        var _a;
        if ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes(`Artifact for contract "${contractArtifactName}" not found.`)) {
            console.error(error.message);
            throw `⛔️ Please make sure you have compiled your contracts or specified the correct contract name!`;
        }
        else {
            throw error;
        }
    });
    // Estimate contract deployment fee
    const deploymentFee = await deployer.estimateDeployFee(artifact, constructorArguments || []);
    log(`Estimated deployment cost: ${ethers_1.ethers.formatEther(deploymentFee)} ETH`);
    // Check if the wallet has enough balance
    await (0, exports.verifyEnoughBalance)(wallet, deploymentFee);
    // Deploy the contract to ZKsync
    const contract = await deployer.deploy(artifact, constructorArguments);
    const address = await contract.getAddress();
    const constructorArgs = contract.interface.encodeDeploy(constructorArguments);
    const fullContractSource = `${artifact.sourceName}:${artifact.contractName}`;
    // Display contract deployment info
    log(`\n"${artifact.contractName}" was successfully deployed:`);
    log(` - Contract address: ${address}`);
    log(` - Contract source: ${fullContractSource}`);
    log(` - Encoded constructor arguments: ${constructorArgs}\n`);
    if (!(options === null || options === void 0 ? void 0 : options.noVerify) && hre.network.config.verifyURL) {
        log(`Requesting contract verification...`);
        await (0, exports.verifyContract)({
            address,
            contract: fullContractSource,
            constructorArguments: constructorArgs,
            bytecode: artifact.bytecode,
        });
    }
    return contract;
};
exports.deployContract = deployContract;
/**
 * Rich wallets can be used for testing purposes.
 * Available on ZKsync In-memory node and Dockerized node.
 */
exports.LOCAL_RICH_WALLETS = [
    {
        address: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
        privateKey: "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110"
    },
    {
        address: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
        privateKey: "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3"
    },
    {
        address: "0x0D43eB5B8a47bA8900d84AA36656c92024e9772e",
        privateKey: "0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e"
    },
    {
        address: "0xA13c10C0D5bd6f79041B9835c63f91de35A15883",
        privateKey: "0x850683b40d4a740aa6e745f889a6fdc8327be76e122f5aba645a5b02d0248db8"
    },
    {
        address: "0x8002cD98Cfb563492A6fB3E7C8243b7B9Ad4cc92",
        privateKey: "0xf12e28c0eb1ef4ff90478f6805b68d63737b7f33abfa091601140805da450d93"
    },
    {
        address: "0x4F9133D1d3F50011A6859807C837bdCB31Aaab13",
        privateKey: "0xe667e57a9b8aaa6709e51ff7d093f1c5b73b63f9987e4ab4aa9a5c699e024ee8"
    },
    {
        address: "0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA",
        privateKey: "0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959"
    },
    {
        address: "0xedB6F5B4aab3dD95C7806Af42881FF12BE7e9daa",
        privateKey: "0x74d8b3a188f7260f67698eb44da07397a298df5427df681ef68c45b34b61f998"
    },
    {
        address: "0xe706e60ab5Dc512C36A4646D719b889F398cbBcB",
        privateKey: "0xbe79721778b48bcc679b78edac0ce48306a8578186ffcb9f2ee455ae6efeace1"
    },
    {
        address: "0xE90E12261CCb0F3F7976Ae611A29e84a6A85f424",
        privateKey: "0x3eb15da85647edd9a1159a4a13b9e7c56877c4eb33f614546d4db06a51868b1c"
    }
];
