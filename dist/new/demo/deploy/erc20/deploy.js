"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const utils_1 = require("../utils");
// This script is used to deploy an ERC20 token contract
// as well as verify it on Block Explorer if possible for the network
// Important: make sure to change contract name and symbol in contract source
// at contracts/erc20/MyERC20Token.sol
async function default_1() {
    await (0, utils_1.deployContract)("MyERC20Token");
}
