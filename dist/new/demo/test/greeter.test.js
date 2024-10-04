"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils_1 = require("../deploy/utils");
describe('Greeter', function () {
    it("Should return the new greeting once it's changed", async function () {
        const wallet = (0, utils_1.getWallet)(utils_1.LOCAL_RICH_WALLETS[0].privateKey);
        const greeting = "Hello world!";
        const greeter = await (0, utils_1.deployContract)("Greeter", [greeting], { wallet, silent: true });
        (0, chai_1.expect)(await greeter.greet()).to.eq(greeting);
        const newGreeting = "Hola, mundo!";
        const setGreetingTx = await greeter.setGreeting(newGreeting);
        // wait until the transaction is processed
        await setGreetingTx.wait();
        (0, chai_1.expect)(await greeter.greet()).to.equal(newGreeting);
    });
});
