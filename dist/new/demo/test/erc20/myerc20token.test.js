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
const chai_1 = require("chai");
const zksync_ethers_1 = require("zksync-ethers");
const utils_1 = require("../../deploy/utils");
const ethers = __importStar(require("ethers"));
describe("MyERC20Token", function () {
    let tokenContract;
    let ownerWallet;
    let userWallet;
    before(async function () {
        ownerWallet = (0, utils_1.getWallet)(utils_1.LOCAL_RICH_WALLETS[0].privateKey);
        userWallet = (0, utils_1.getWallet)(utils_1.LOCAL_RICH_WALLETS[1].privateKey);
        tokenContract = await (0, utils_1.deployContract)("MyERC20Token", [], { wallet: ownerWallet, silent: true });
    });
    it("Should have correct initial supply", async function () {
        const initialSupply = await tokenContract.totalSupply();
        (0, chai_1.expect)(initialSupply).to.equal(BigInt("1000000000000000000000000")); // 1 million tokens with 18 decimals
    });
    it("Should allow owner to burn tokens", async function () {
        const burnAmount = ethers.parseEther("10"); // Burn 10 tokens
        const tx = await tokenContract.burn(burnAmount);
        await tx.wait();
        const afterBurnSupply = await tokenContract.totalSupply();
        (0, chai_1.expect)(afterBurnSupply).to.equal(BigInt("999990000000000000000000")); // 999,990 tokens remaining
    });
    it("Should allow user to transfer tokens", async function () {
        const transferAmount = ethers.parseEther("50"); // Transfer 50 tokens
        const tx = await tokenContract.transfer(userWallet.address, transferAmount);
        await tx.wait();
        const userBalance = await tokenContract.balanceOf(userWallet.address);
        (0, chai_1.expect)(userBalance).to.equal(transferAmount);
    });
    it("Should fail when user tries to burn more tokens than they have", async function () {
        const userTokenContract = new zksync_ethers_1.Contract(await tokenContract.getAddress(), tokenContract.interface, userWallet);
        const burnAmount = ethers.parseEther("100"); // Try to burn 100 tokens
        try {
            await userTokenContract.burn(burnAmount);
            chai_1.expect.fail("Expected burn to revert, but it didn't");
        }
        catch (error) {
            (0, chai_1.expect)(error.message).to.include("burn amount exceeds balance");
        }
    });
});
