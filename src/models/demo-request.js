"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoRequest = void 0;
const mongoose_1 = require("mongoose");
const demoRequestSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    company: {
        type: String,
        required: true,
        trim: true,
    },
    position: {
        type: String,
        trim: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    message: {
        type: String,
        trim: true,
    },
    waitlistPosition: {
        type: Number,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'completed', 'cancelled'],
        default: 'pending',
    },
    lastContactedAt: {
        type: Date,
    },
}, {
    timestamps: true,
    collection: 'demoRequests'
});
// Indexes for better query performance
demoRequestSchema.index({ email: 1 }, { unique: true });
demoRequestSchema.index({ waitlistPosition: 1 }, { unique: true });
demoRequestSchema.index({ status: 1 });
demoRequestSchema.index({ createdAt: 1 });
exports.DemoRequest = (0, mongoose_1.model)('DemoRequest', demoRequestSchema);
