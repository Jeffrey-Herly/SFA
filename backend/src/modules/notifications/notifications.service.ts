import prisma from '../../config/db';

export class NotificationsService {
  /**
   * Create an in-app notification and trigger mock/real Email and WA alerts.
   */
  async createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: string;
    email?: string;
    phone?: string;
  }) {
    const { userId, title, message, type, email, phone } = params;

    let sentEmail = false;
    let sentWa = false;

    // 1. Dispatch out-of-band alerts (Mock or configured)
    if (email) {
      sentEmail = await this.sendEmail(email, title, message);
    }
    if (phone) {
      sentWa = await this.sendWA(phone, message);
    }

    // 2. Save in-app notification in DB
    return prisma.notification.create({
      data: {
        user_id: userId,
        title,
        message,
        type,
        sent_email: sentEmail,
        sent_wa: sentWa,
      },
    });
  }

  /**
   * Fetch all notifications for a user.
   */
  async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Mark a specific notification as read.
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true },
    });
  }

  /**
   * Mark all notifications of a user as read.
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }

  // -----------------------------------------------------------------
  // Private Out-of-band dispatch implementations (configured vs mock logs)
  // -----------------------------------------------------------------
  private async sendEmail(to: string, subject: string, text: string): Promise<boolean> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (apiKey && fromEmail) {
      try {
        // Real SendGrid REST dispatch
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: fromEmail, name: 'SFA Notification System' },
            subject: subject,
            content: [{ type: 'text/plain', value: text }],
          }),
        });
        return response.ok;
      } catch (err) {
        console.error('Failed to send SendGrid email:', err);
        return false;
      }
    } else {
      // Mock log to console
      console.log(`[MOCK EMAIL DISPATCH] To: ${to} | Subject: "${subject}" | Content: "${text}"`);
      return true;
    }
  }

  private async sendWA(phone: string, text: string): Promise<boolean> {
    const fonnteToken = process.env.FONNTE_TOKEN;

    if (fonnteToken) {
      try {
        // Real Fonnte WA dispatch
        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': fonnteToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: phone,
            message: text,
          }),
        });
        return response.ok;
      } catch (err) {
        console.error('Failed to send Fonnte WA message:', err);
        return false;
      }
    } else {
      // Mock log to console
      console.log(`[MOCK WA DISPATCH] Phone: ${phone} | Content: "${text}"`);
      return true;
    }
  }
}
