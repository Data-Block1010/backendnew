import { EmailService } from '../services/emailService';
import { DemoRequest, IDemoRequest } from '../models/demo-request';
import { z } from 'zod';

export const DemoRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  company: z.string().min(2, 'Company name must be at least 2 characters long'),
  position: z.string().optional(),
  phoneNumber: z.string().optional(),
  message: z.string().optional(),
});

export type DemoRequestInput = z.infer<typeof DemoRequestSchema>;

export class DemoRequestService {
  constructor(private emailService: EmailService) {}

  async createDemoRequest(data: DemoRequestInput): Promise<IDemoRequest> {
    try {
      // Validate input
      DemoRequestSchema.parse(data);

      // Check if email already exists
      const existingRequest = await DemoRequest.findOne({ email: data.email });
      if (existingRequest) {
        throw new Error('Email already registered for demo');
      }

      // Get next waitlist position
      const lastRequest = await DemoRequest.findOne({})
        .sort({ waitlistPosition: -1 })
        .select('waitlistPosition');
      const nextPosition = (lastRequest?.waitlistPosition ?? 0) + 1;

      // Create new demo request
      const demoRequest = new DemoRequest({
        ...data,
        waitlistPosition: nextPosition,
      });

      // Save to database
      await demoRequest.save();

      // Send confirmation email
      await this.emailService.sendWaitlistConfirmation(
        data.email,
        data.name,
        nextPosition
      );

      return demoRequest;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  async getWaitlistPosition(email: string): Promise<number | null> {
    const request = await DemoRequest.findOne({ email });
    return request?.waitlistPosition ?? null;
  }

  async updateStatus(
    email: string,
    status: IDemoRequest['status'],
    lastContactedAt?: Date
  ): Promise<IDemoRequest | null> {
    const updateData: Partial<IDemoRequest> = { status };
    if (lastContactedAt) {
      updateData.lastContactedAt = lastContactedAt;
    }

    return DemoRequest.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true }
    );
  }

  async listDemoRequests(
    filters: {
      status?: IDemoRequest['status'];
      startDate?: Date;
      endDate?: Date;
    } = {},
    page = 1,
    limit = 10
  ) {
    const query: any = {};

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
      DemoRequest.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      DemoRequest.countDocuments(query),
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
    const [
      total,
      pending,
      contacted,
      completed,
      cancelled,
      lastWeekRequests,
    ] = await Promise.all([
      DemoRequest.countDocuments(),
      DemoRequest.countDocuments({ status: 'pending' }),
      DemoRequest.countDocuments({ status: 'contacted' }),
      DemoRequest.countDocuments({ status: 'completed' }),
      DemoRequest.countDocuments({ status: 'cancelled' }),
      DemoRequest.countDocuments({
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