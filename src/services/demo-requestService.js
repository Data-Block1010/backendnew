"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoRequestService = exports.DemoRequestSchema = void 0;
const demo_request_1 = require("../models/demo-request");
const zod_1 = require("zod");
exports.DemoRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
    email: zod_1.z.string().email('Invalid email address'),
    company: zod_1.z.string().min(2, 'Company name must be at least 2 characters long'),
    position: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
});
class DemoRequestService {
    constructor(emailService) {
        this.emailService = emailService;
    }
    async createDemoRequest(data) {
        var _a;
        try {
            // Validate input
            exports.DemoRequestSchema.parse(data);
            // Check if email already exists
            // const existingRequest = await DemoRequest.findOne({ email: data.email });
            // if (existingRequest) {
            //   throw new Error('Email already registered for demo');
            // }
            // Get next waitlist position
            const lastRequest = await demo_request_1.DemoRequest.findOne({})
                .sort({ waitlistPosition: -1 })
                .select('waitlistPosition');
            const nextPosition = ((_a = lastRequest === null || lastRequest === void 0 ? void 0 : lastRequest.waitlistPosition) !== null && _a !== void 0 ? _a : 0) + 1;
            // Create new demo request
            const demoRequest = new demo_request_1.DemoRequest(Object.assign(Object.assign({}, data), { waitlistPosition: nextPosition }));
            // Save to database
            await demoRequest.save();
            // Send demo request confirmation email instead of waitlist confirmation
            await this.emailService.sendDemoRequestConfirmation(data.email, data.name, data.company, data.message);
            return demoRequest;
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
            }
            throw error;
        }
    }
    async getWaitlistPosition(email) {
        var _a;
        const request = await demo_request_1.DemoRequest.findOne({ email });
        return (_a = request === null || request === void 0 ? void 0 : request.waitlistPosition) !== null && _a !== void 0 ? _a : null;
    }
    async updateStatus(email, status, lastContactedAt) {
        const updateData = { status };
        if (lastContactedAt) {
            updateData.lastContactedAt = lastContactedAt;
        }
        return demo_request_1.DemoRequest.findOneAndUpdate({ email }, { $set: updateData }, { new: true });
    }
    async listDemoRequests(filters = {}, page = 1, limit = 10) {
        const query = {};
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate) {
                query.createdAt.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.createdAt.$lte = filters.endDate;
            }
        }
        const [requests, total] = await Promise.all([
            demo_request_1.DemoRequest.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            demo_request_1.DemoRequest.countDocuments(query),
        ]);
        return {
            requests,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
        };
    }
    async getStats() {
        const [total, pending, contacted, completed, cancelled, lastWeekRequests,] = await Promise.all([
            demo_request_1.DemoRequest.countDocuments(),
            demo_request_1.DemoRequest.countDocuments({ status: 'pending' }),
            demo_request_1.DemoRequest.countDocuments({ status: 'contacted' }),
            demo_request_1.DemoRequest.countDocuments({ status: 'completed' }),
            demo_request_1.DemoRequest.countDocuments({ status: 'cancelled' }),
            demo_request_1.DemoRequest.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            }),
        ]);
        return {
            total,
            pending,
            contacted,
            completed,
            cancelled,
            lastWeekRequests,
            conversionRate: total > 0 ? (completed / total) * 100 : 0,
        };
    }
}
exports.DemoRequestService = DemoRequestService;
