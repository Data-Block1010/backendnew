"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const core_1 = require("@wagmi/core");
const chains_1 = require("@wagmi/core/chains");
exports.config = (0, core_1.createConfig)({
    chains: [chains_1.mainnet],
    transports: {
        [chains_1.mainnet.id]: (0, core_1.http)()
    }
});
