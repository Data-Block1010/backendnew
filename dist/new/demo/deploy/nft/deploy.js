"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const utils_1 = require("../utils");
// This script is used to deploy an NFT contract
// as well as verify it on Block Explorer if possible for the network
async function default_1() {
    const name = "My new NFT";
    const symbol = "MYNFT";
    const baseTokenURI = "https://mybaseuri.com/token/";
    await (0, utils_1.deployContract)("MyNFT", [name, symbol, baseTokenURI]);
}
