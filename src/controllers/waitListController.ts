import { Request, Response } from 'express';
import { WaitlistEntry, IWaitlistEntry } from '../models/waitListEntry';
import { validateEmail } from '../utils/validators';
import { EmailService } from '../services/emailService';

export class WaitlistController {
    static async join(req: Request, res: Response): Promise<void> {
      try {
        const { email, name } = req.body;
  
        // Validate input
        if (!email || !name) {
          res.status(400).json({ error: 'Email and name are required' });
          return;
        }
  
        if (!validateEmail(email)) {
          res.status(400).json({ error: 'Invalid email format' });
          return;
        }
  
        // Check for existing entry
        const existingEntry = await WaitlistEntry.findOne({ email });
        if (existingEntry) {
          res.status(400).json({ error: 'Email already in waitlist' });
          return;
        }
  
        // Get next position
        const lastEntry = await WaitlistEntry.findOne().sort({ position: -1 });
        const position = lastEntry ? lastEntry.position + 1 : 1;
  
        // Create new entry
        const waitlistEntry = new WaitlistEntry({
          email,
          name,
          position,
        });
  
        await waitlistEntry.save();
  
        // Send confirmation email
        const emailService = new EmailService();
        await emailService.sendWaitlistConfirmation(waitlistEntry.email, waitlistEntry.name, waitlistEntry.position);
  
        res.status(201).json({
          message: 'Added to waitlist successfully',
          position,
        });
      } catch (error) {
        console.error('Error in join waitlist:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  
    static async getPosition(req: Request, res: Response): Promise<void> {
      try {
        const { email } = req.params;
        const entry = await WaitlistEntry.findOne({ email });
  
        if (!entry) {
          res.status(404).json({ error: 'Email not found in waitlist' });
          return;
        }
  
        res.json({ position: entry.position });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  
    static async getAll(req: Request, res: Response): Promise<void> {
      try {
        const entries = await WaitlistEntry.find()
          .sort({ position: 1 })
          .select('-__v');
        res.json(entries);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  
    static async inviteUsers(req: Request, res: Response): Promise<void> {
      try {
        const { count = 10 } = req.body;
        const result = await WaitlistEntry.updateMany(
          { status: 'waiting' },
          { status: 'invited' },
          { limit: count }
        );
  
        res.json({
          message: `Invited ${result.modifiedCount} users`,
          invitedCount: result.modifiedCount,
        });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  
    static async remove(req: Request, res: Response): Promise<void> {
      try {
        const { email } = req.params;
        const entry = await WaitlistEntry.findOneAndDelete({ email });
  
        if (!entry) {
          res.status(404).json({ error: 'Email not found in waitlist' });
          return;
        }
  
        // Update positions for remaining entries
        await WaitlistEntry.updateMany(
          { position: { $gt: entry.position } },
          { $inc: { position: -1 } }
        );
  
        res.json({ message: 'Removed from waitlist successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }