"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils_1 = require("../../deploy/utils");
describe("MyNFT", function () {
    let nftContract;
    let ownerWallet;
    let recipientWallet;
    before(async function () {
        ownerWallet = (0, utils_1.getWallet)(utils_1.LOCAL_RICH_WALLETS[0].privateKey);
        recipientWallet = (0, utils_1.getWallet)(utils_1.LOCAL_RICH_WALLETS[1].privateKey);
        nftContract = await (0, utils_1.deployContract)("MyNFT", ["MyNFTName", "MNFT", "https://mybaseuri.com/token/"], { wallet: ownerWallet, silent: true });
    });
    it("Should mint a new NFT to the recipient", async function () {
        const tx = await nftContract.mint(recipientWallet.address);
        await tx.wait();
        const balance = await nftContract.balanceOf(recipientWallet.address);
        (0, chai_1.expect)(balance).to.equal(BigInt("1"));
    });
    it("Should have correct token URI after minting", async function () {
        const tokenId = 1; // Assuming the first token minted has ID 1
        const tokenURI = await nftContract.tokenURI(tokenId);
        (0, chai_1.expect)(tokenURI).to.equal("https://mybaseuri.com/token/1");
    });
    it("Should allow owner to mint multiple NFTs", async function () {
        const tx1 = await nftContract.mint(recipientWallet.address);
        await tx1.wait();
        const tx2 = await nftContract.mint(recipientWallet.address);
        await tx2.wait();
        const balance = await nftContract.balanceOf(recipientWallet.address);
        (0, chai_1.expect)(balance).to.equal(BigInt("3")); // 1 initial nft + 2 minted
    });
    it("Should not allow non-owner to mint NFTs", async function () {
        try {
            const tx3 = await nftContract.connect(recipientWallet).mint(recipientWallet.address);
            await tx3.wait();
            chai_1.expect.fail("Expected mint to revert, but it didn't");
        }
        catch (error) {
            (0, chai_1.expect)(error.message).to.include("Ownable: caller is not the owner");
        }
    });
});
