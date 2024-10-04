"use strict";
require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");
module.exports = {
    zksolc: {
        version: "1.5.3", // Choose the latest version of zksolc
        compilerSource: "binary",
        settings: {},
    },
    defaultNetwork: "zkSyncTestnet",
    networks: {
        zkSyncTestnet: {
            url: "https://testnet.era.zksync.dev", // zkSync testnet endpoint
            ethNetwork: "sepolia", // or sepolia if you're using Sepolia testnet
            zksync: true,
        },
    },
    solidity: {
        version: "0.8.20", // Solidity version you're using
    },
};
