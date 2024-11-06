"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitlistController = void 0;
const waitListEntry_1 = require("../models/waitListEntry");
const validators_1 = require("../utils/validators");
const emailService_1 = require("../services/emailService");
class WaitlistController {
    static async join(req, res) {
        try {
            const { email, name } = req.body;
            // Validate input
            if (!email || !name) {
                res.status(400).json({ error: 'Email and name are required' });
                return;
            }
            if (!(0, validators_1.validateEmail)(email)) {
                res.status(400).json({ error: 'Invalid email format' });
                return;
            }
            // Check for existing entry
            const existingEntry = await waitListEntry_1.WaitlistEntry.findOne({ email });
            if (existingEntry) {
                res.status(400).json({ error: 'Email already in waitlist' });
                return;
            }
            // Get next position
            const lastEntry = await waitListEntry_1.WaitlistEntry.findOne().sort({ position: -1 });
            const position = lastEntry ? lastEntry.position + 1 : 1;
            // Create new entry
            const waitlistEntry = new waitListEntry_1.WaitlistEntry({
                email,
                name,
                position,
            });
            await waitlistEntry.save();
            // Send confirmation email
            const emailService = new emailService_1.EmailService();
            await emailService.sendWaitlistConfirmation(waitlistEntry.email, waitlistEntry.name, waitlistEntry.position);
            res.status(201).json({
                message: 'Added to waitlist successfully',
                position,
            });
        }
        catch (error) {
            console.error('Error in join waitlist:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getPosition(req, res) {
        try {
            const { email } = req.params;
            const entry = await waitListEntry_1.WaitlistEntry.findOne({ email });
            if (!entry) {
                res.status(404).json({ error: 'Email not found in waitlist' });
                return;
            }
            res.json({ position: entry.position });
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getAll(req, res) {
        try {
            const entries = await waitListEntry_1.WaitlistEntry.find()
                .sort({ position: 1 })
                .select('-__v');
            res.json(entries);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async inviteUsers(req, res) {
        try {
            const { count = 10 } = req.body;
            const result = await waitListEntry_1.WaitlistEntry.updateMany({ status: 'waiting' }, { status: 'invited' }, { limit: count });
            res.json({
                message: `Invited ${result.modifiedCount} users`,
                invitedCount: result.modifiedCount,
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async remove(req, res) {
        try {
            const { email } = req.params;
            const entry = await waitListEntry_1.WaitlistEntry.findOneAndDelete({ email });
            if (!entry) {
                res.status(404).json({ error: 'Email not found in waitlist' });
                return;
            }
            // Update positions for remaining entries
            await waitListEntry_1.WaitlistEntry.updateMany({ position: { $gt: entry.position } }, { $inc: { position: -1 } });
            res.json({ message: 'Removed from waitlist successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.WaitlistController = WaitlistController;
