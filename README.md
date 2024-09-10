# README: zkSync-based Data Storage on Lisk using Zero-Knowledge Proofs

## Overview

This project provides a decentralized data storage solution deployed on Lisk, utilizing zkSync for efficient L2 scaling, and incorporating zero-knowledge proofs for enhanced data privacy. Users can store, update, and manage access to their data on-chain, while proofs ensure that sensitive information is handled securely.

### Key Technologies

- **zkSync**: A Layer 2 scaling solution built on Ethereum, providing faster and cheaper transactions.
- **Lisk Blockchain**: A decentralized application platform with SDKs for developers, used for deploying this smart contract.
- **Zero-Knowledge Proofs**: A cryptographic method that allows secure verification of data without revealing the data itself.
- **Web3**: A collection of libraries for interacting with Ethereum-like blockchains (including zkSync and Lisk).
- **Pinata (IPFS)**: Used for decentralized file storage, where data is stored, encrypted, and retrieved.

---

## Project Structure

### Smart Contracts

- **DataStorage.sol**: A Solidity contract that enables users to:
  - Store data hashes.
  - Update stored data.
  - Transfer data ownership.
  - Grant or revoke access rights to specific addresses.

### Backend

- **ZkSyncService.ts**: Handles the interaction between the smart contract on zkSync and the backend server.
- **DataController.ts**: Manages the data operations (storing, updating, reading data) and zero-knowledge proof generation.
- **Pinata Service**: Encrypts data using user-provided secret keys, uploads encrypted data to IPFS, and retrieves data as needed.
- **Authentication**: Uses JWT tokens to manage user access and authentication.

### Smart Contract Features

- **Data Hash Storage**: Users can store and manage data hashes on-chain.
- **Grant/Revoke Access**: Users can grant or revoke access to specific addresses, allowing them to view or modify the data.
- **Zero-Knowledge Proof Generation**: Users can generate cryptographic proofs without revealing the underlying data.

---

## Setup Guide

### Prerequisites

1. **Node.js** and **npm**: Ensure you have Node.js (v14+) installed.
2. **Hardhat**: For compiling and deploying the smart contract.
3. **IPFS Account**: For decentralized file storage (Pinata used for this example).
4. **zkSync and Lisk Wallet**: For managing accounts and transactions.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Blockchain configuration
SEPOLIA_RPC_URL=<Your-Sepolia-Node-RPC-URL>
ZKSYNC_RPC_URL=<Your-zkSync-Node-RPC-URL>

# zkSync and Contract keys
YOUR_CONTRACT_ADDRESS=<Your-Contract-Address>
ACCOUNT_PRIVATE_KEY=<Your-Private-Key>

# Lisk account for contract ownership
HARDCODED_FROM_ADDRESS=<Your-Lisk-Address>

# Pinata API Keys
PINATA_API_KEY=<Your-Pinata-API-Key>
PINATA_SECRET_API_KEY=<Your-Pinata-Secret-API-Key>
```

---

### Steps to Run the Backend

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/project-name.git
    cd project-name
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Compile the Contract**:
    Compile the Solidity smart contracts using Hardhat:
    ```bash
    npx hardhat compile
    ```

4. **Deploy the Contract**:
    Deploy the contract on zkSync (Lisk backend):
    ```bash
    npx hardhat run scripts/deploy.ts --network zkSync
    ```

5. **Run the Server**:
    Start the Express backend server:
    ```bash
    npm start
    ```

---

## API Endpoints

### User Registration and Authentication

- **POST /register**: Register a new user with a username and password.
- **POST /login**: Log in and retrieve a JWT token for authentication.

### Data Management

- **POST /store-data**: Store encrypted data with IPFS. Requires a file upload and secret key.
- **POST /update-data**: Update previously stored data. Requires new file upload and secret key.
- **POST /delete-data**: Delete data for a specific CID.

### Access Management

- **POST /grant-access**: Grant access to another user to view your data.
- **POST /revoke-access**: Revoke access from a previously granted user.

### Zero-Knowledge Proofs

- **POST /generate-proof**: Generate a zero-knowledge proof for a data entry.
- **POST /verify-proof**: Verify the validity of a zero-knowledge proof (on-chain and off-chain).

---

## Challenges and Solutions

### 1. **Bytes32 Compatibility**:
   - Initially, storing data hashes as `string` caused issues with data size and ABI compatibility. Switching to `bytes32` solved this problem by ensuring consistent data sizes.

### 2. **Zero-Knowledge Proof Integration**:
   - Zero-knowledge proof generation was complex and required careful integration with cryptographic libraries. We successfully integrated proof generation using trusted circuits and cryptographic libraries, allowing users to securely verify data without revealing sensitive information.

### 3. **Gas Optimization**:
   - Handling large datasets and access control for multiple users can lead to high gas costs. By implementing batch access control methods (`batchGrantAccess` and `batchRevokeAccess`), gas costs were minimized.

### 4. **Lisk and zkSync Integration**:
   - Deploying the smart contract on zkSync was smooth, but connecting zkSync with Lisk for more advanced logic required custom plugin integration. The `web3-plugin-zksync` was used to bridge zkSync functionality with Lisk backend requirements.

### 5. **Error Handling and Contract Interactions**:
   - Encountering various ABI decoding errors and gas issues while reading data from the contract highlighted the need to carefully manage blockchain interaction. We improved error handling and optimized ABI usage for contract calls.

---

## Next Steps and Future Work

- **Improved File Encryption**: Enhance the encryption mechanism to support multi-layered encryption algorithms.
- **Decentralized Identity**: Integrate decentralized identity systems to further enhance user privacy and data ownership.
- **Advanced Zero-Knowledge Proofs**: Extend the zero-knowledge proof feature to include more complex operations like multi-party computation.

---

## Conclusion

This project leverages zkSync's scalability and Lisk's dApp capabilities to build a decentralized, privacy-preserving data storage system. By combining zero-knowledge proofs and encrypted data storage on IPFS, users can securely manage their data without compromising privacy.
