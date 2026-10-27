// TicketNest Background Expiration Worker
// BullMQ & In-Memory Job Scheduler for 10-Minute Ticket Reservation Expiration
import { dbManager, logAudit } from './db.ts';

class ReservationWorker {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private stats = {
    totalCleaned: 0,
    lastRunAt: new Date().toISOString(),
  };

  public start(intervalMs = 5000): void {
    if (this.timer) return;
    console.log(`[Worker] Reservation expiration cleaner started (interval: ${intervalMs}ms)`);
    this.timer = setInterval(() => {
      this.processExpiredReservations();
    }, intervalMs);

    // Initial run immediately
    this.processExpiredReservations();
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Worker] Reservation expiration cleaner stopped');
    }
  }

  /**
   * Identifies expired pending reservations, releases held ticket inventory exactly once,
   * updates status to EXPIRED, and records audit trail.
   */
  public async processExpiredReservations(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    try {
      const now = Date.now();
      const expiredCount = await dbManager.transaction((data) => {
        let expired = 0;
        for (const res of data.reservations) {
          if (res.status === 'PENDING') {
            const expTime = new Date(res.expiresAt).getTime();
            if (expTime <= now) {
              // 1. Mark reservation as EXPIRED
              res.status = 'EXPIRED';
              res.updatedAt = new Date().toISOString();
              expired++;

              // 2. Atomically release held ticket inventory
              for (const item of res.items) {
                const category = data.ticketCategories.find((c) => c.id === item.ticketCategoryId);
                if (category) {
                  const prevReserved = category.reservedQuantity;
                  category.reservedQuantity = Math.max(0, category.reservedQuantity - item.quantity);
                  console.log(
                    `[Worker] Expired reservation ${res.reservationNumber}: released ${item.quantity} tickets for category "${category.name}" (reserved was ${prevReserved}, now ${category.reservedQuantity})`
                  );
                }
              }

              // 3. Create user notification
              data.notifications.unshift({
                id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                userId: res.userId,
                title: 'Ticket Reservation Expired',
                message: `Your 10-minute hold for reservation ${res.reservationNumber} has expired and the tickets have been returned to inventory.`,
                read: false,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
        return expired;
      });

      if (expiredCount > 0) {
        this.stats.totalCleaned += expiredCount;
        this.stats.lastRunAt = new Date().toISOString();
        await logAudit(
          undefined,
          'system_worker@ticketnest.io',
          'RESERVATIONS_EXPIRED_CLEANUP',
          'RESERVATION',
          'batch',
          `Automated worker released inventory for ${expiredCount} expired reservations.`
        );
      }

      return expiredCount;
    } catch (err) {
      console.error('[Worker] Error processing expired reservations:', err);
      return 0;
    } finally {
      this.isProcessing = false;
    }
  }

  public getWorkerStats() {
    return {
      ...this.stats,
      isRunning: this.timer !== null,
    };
  }
}

export const reservationWorker = new ReservationWorker();
