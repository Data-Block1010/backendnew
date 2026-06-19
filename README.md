# README: Stellar/Soroban-based Data Storage with Zero-Knowledge Proofs

## Overview

This project provides a decentralized data storage solution deployed on Stellar via Soroban smart contracts, incorporating zero-knowledge proofs for enhanced data privacy. Users can store, update, and manage access to their data on-chain, while proofs ensure that sensitive information is handled securely.

### Key Technologies

- **Stellar**: A fast, low-cost blockchain network used to settle on-chain data and access-control operations.
- **Soroban**: Stellar's smart contract platform (Rust/WASM), used for the on-chain `data-storage` contract — see [soroban-contract](https://github.com/Data-Block1010/soroban-contract).
- **Zero-Knowledge Proofs**: A cryptographic method that allows secure verification of data without revealing the data itself.
- **Stellar SDK**: Libraries for interacting with the Stellar network and invoking Soroban contracts.
- **Pinata (IPFS)**: Used for decentralized file storage, where data is stored, encrypted, and retrieved.

---

## Project Structure

### Smart Contracts

- **data-storage** (Soroban, Rust): A contract that enables users to:
  - Store data hashes.
  - Update stored data.
  - Transfer data ownership.
  - Grant or revoke access rights to specific accounts.

  See [soroban-contract](https://github.com/Data-Block1010/soroban-contract) for the contract source and tests.

### Backend

- **StellarService.ts**: Handles the interaction between the Soroban contract and the backend server.
- **DataController.ts**: Manages the data operations (storing, updating, reading data) and zero-knowledge proof generation.
- **Pinata Service**: Encrypts data using user-provided secret keys, uploads encrypted data to IPFS, and retrieves data as needed.
- **Authentication**: Uses JWT tokens to manage user access and authentication.

### Smart Contract Features

- **Data Hash Storage**: Users can store and manage data hashes on-chain.
- **Grant/Revoke Access**: Users can grant or revoke access to specific accounts, allowing them to view or modify the data.
- **Zero-Knowledge Proof Generation**: Users can generate cryptographic proofs without revealing the underlying data.

---

## Setup Guide

### Prerequisites

1. **Node.js** and **npm**: Ensure you have Node.js (v14+) installed.
2. **Rust + Soroban CLI**: For building and deploying the Soroban smart contract.
3. **IPFS Account**: For decentralized file storage (Pinata used for this example).
4. **Stellar Account**: For managing accounts and transactions (testnet or mainnet).

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Stellar / Soroban configuration
STELLAR_NETWORK=<testnet-or-mainnet>
STELLAR_RPC_URL=<Your-Soroban-RPC-URL>

# Contract and account keys
CONTRACT_ID=<Your-Soroban-Contract-Id>
ACCOUNT_SECRET_KEY=<Your-Stellar-Secret-Key>

# Stellar account for contract ownership
CONTRACT_OWNER_ADDRESS=<Your-Stellar-Address>

# Pinata API Keys
PINATA_API_KEY=<Your-Pinata-API-Key>
PINATA_SECRET_API_KEY=<Your-Pinata-Secret-API-Key>
```

---

### Steps to Run the Backend

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/Data-Block1010/backendnew.git
    cd backendnew
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Build the Contract**:
    Build the Soroban smart contract (from the [soroban-contract](https://github.com/Data-Block1010/soroban-contract) repo):
    ```bash
    cargo build --target wasm32v1-none --release -p data-storage
    ```

4. **Deploy the Contract**:
    Deploy the contract to Stellar:
    ```bash
    stellar contract deploy \
      --wasm target/wasm32v1-none/release/data_storage.wasm \
      --source <account> \
      --network testnet
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

### 1. **String Compatibility**:
   - Initially, storing data hashes required careful handling of size and contract type compatibility. Standardizing on Soroban's `String` type for hashes solved this by ensuring consistent data sizes.

### 2. **Zero-Knowledge Proof Integration**:
   - Zero-knowledge proof generation was complex and required careful integration with cryptographic libraries. We successfully integrated proof generation using trusted circuits and cryptographic libraries, allowing users to securely verify data without revealing sensitive information.

### 3. **Fee and Resource Optimization**:
   - Handling large datasets and access control for multiple users can lead to higher transaction resource costs. By keeping access-control records minimal and using Soroban's persistent storage efficiently, resource costs were minimized.

### 4. **Stellar/Soroban Integration**:
   - Wiring the backend's chain-interaction layer to the Stellar SDK and invoking the Soroban contract's access-control functions (`Address::require_auth()`) required careful handling of account authorization and transaction submission.

### 5. **Error Handling and Contract Interactions**:
   - Encountering various decoding errors and resource-fee issues while reading data from the contract highlighted the need to carefully manage blockchain interaction. We improved error handling and optimized contract-invocation usage for backend calls.

---

## Next Steps and Future Work

- **Improved File Encryption**: Enhance the encryption mechanism to support multi-layered encryption algorithms.
- **Decentralized Identity**: Integrate decentralized identity systems to further enhance user privacy and data ownership.
- **Advanced Zero-Knowledge Proofs**: Extend the zero-knowledge proof feature to include more complex operations like multi-party computation.

---

## Conclusion

This project leverages Stellar's speed and low fees, together with Soroban's smart contract platform, to build a decentralized, privacy-preserving data storage system. By combining zero-knowledge proofs and encrypted data storage on IPFS, users can securely manage their data without compromising privacy.
