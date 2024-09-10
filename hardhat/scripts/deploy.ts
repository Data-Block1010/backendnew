import { Bytes, Contract, ContractAbi, Web3 } from "web3";
import {
  ContractFactory,
  types,
  Web3ZKsyncL2,
  ZKsyncPlugin,
  ZKsyncWallet,
} from "web3-plugin-zksync";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function main() {
  try {
    // Initialize Web3 instance with zkSync Era L2 support
    const web3: Web3 = new Web3();
    web3.registerPlugin(
      new ZKsyncPlugin(
        Web3ZKsyncL2.initWithDefaultProvider(types.Network.Sepolia)
      )
    );

    const zksync: ZKsyncPlugin = web3.ZKsync;

    // Retrieve the private key and RPC URL from environment variables
    const PRIVATE_KEY: string = process.env.ACCOUNT_PRIVATE_KEY || "";
    const ZKSYNC_RPC_URL: string = process.env.ZKSYNC_RPC_URL || "";

    if (!PRIVATE_KEY) {
      throw new Error("Private key not found in environment variables");
    }

    if (!ZKSYNC_RPC_URL) {
      throw new Error("zkSync RPC URL not found in environment variables");
    }

    console.log("✅ Private key and zkSync RPC URL loaded successfully",PRIVATE_KEY );

    // Initialize a wallet using the private key
    const wallet: ZKsyncWallet = new zksync.Wallet(PRIVATE_KEY);

    // Load ABI and Bytecode from the compiled contract
    const contractPath = "./artifacts-zk/contracts/DataStorage.sol/DataStorage.json";

    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found at ${contractPath}`);
    }

    console.log("✅ Contract file found at:", contractPath);

    const contractData = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    const contractAbi: ContractAbi = contractData.abi;
    const contractBytecode: Bytes = contractData.bytecode;

    if (!contractAbi || !contractBytecode) {
      throw new Error("ABI or bytecode missing from the contract JSON file");
    }

    console.log("✅ ABI and Bytecode loaded");

    // Create a ContractFactory using the ABI, bytecode, and wallet
    const contractFactory: ContractFactory<ContractAbi> = new ContractFactory(
      contractAbi,
      contractBytecode,
      wallet
    );

    // Deploy the contract
    const contract: Contract<ContractAbi> = await contractFactory.deploy();

    if (!contract || !contract.options || !contract.options.address) {
      throw new Error("Failed to deploy contract");
    }

    console.log("✅ Contract deployed successfully!");
    console.log("Contract address:", contract.options.address);
  } catch (error: any) {
    console.error(`❌ Error executing script: ${error.message}`);
  }
}

main()
  .then(() => console.log("✅ Script executed successfully"))
  .catch((error) => console.error(`❌ Error in main: ${error.message}`));
