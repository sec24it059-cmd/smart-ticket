import { dbManager, logAuditInternal } from './db.ts';
import { Order, OrderItem, PaymentTransaction, Reservation } from './types.ts';

export interface PaymentInitiateParams {
  reservationId: string;
  userId: string;
  paymentMethod?: string;
  idempotencyKey?: string;
  attendeeName?: string;
  attendeeEmail?: string;
}

export class SimulatedPaymentGateway {
  /**
   * Initiates payment for a reservation. Validates reservation validity and expiry.
   */
  public async initiatePayment(params: PaymentInitiateParams): Promise<{
    transaction: PaymentTransaction;
    reservation: Reservation;
  }> {
    return dbManager.transaction(async (data) => {
      // 1. Check idempotency if key provided
      if (params.idempotencyKey) {
        const existingTx = data.paymentTransactions.find(
          (tx) => tx.idempotencyKey === params.idempotencyKey
        );
        if (existingTx) {
          const res = data.reservations.find((r) => r.id === existingTx.reservationId);
          if (res) {
            return { transaction: existingTx, reservation: res };
          }
        }
      }

      // 2. Lookup reservation
      const reservation = data.reservations.find((r) => r.id === params.reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      // 3. Verify user matches
      if (reservation.userId !== params.userId) {
        throw new Error('Unauthorized: Reservation does not belong to the authenticated user');
      }

      // 4. Verify reservation status
      if (reservation.status !== 'PENDING') {
        throw new Error(`Reservation is not pending (current status: ${reservation.status})`);
      }

      // 5. Check if expired
      if (new Date(reservation.expiresAt).getTime() <= Date.now()) {
        reservation.status = 'EXPIRED';
        throw new Error('Reservation has expired. Tickets have been returned to available inventory.');
      }

      // 6. Create payment transaction
      const txnId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const providerRef = `SIM-TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const transaction: PaymentTransaction = {
        id: txnId,
        reservationId: reservation.id,
        providerReference: providerRef,
        amount: reservation.totalAmount,
        currency: 'INR',
        status: 'INITIATED',
        idempotencyKey: params.idempotencyKey,
        providerResponse: JSON.stringify({
          gateway: 'TicketNest Simulated Gateway v2.4',
          method: params.paymentMethod || 'UPI/Card',
          initiatedAt: new Date().toISOString(),
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.paymentTransactions.push(transaction);

      logAuditInternal(
        data,
        params.userId,
        undefined,
        'PAYMENT_INITIATED',
        'PAYMENT',
        transaction.id,
        `Payment initiated for reservation ${reservation.reservationNumber} (Amount: ₹${reservation.totalAmount})`
      );

      return { transaction, reservation };
    });
  }

  /**
   * Resolves a payment transaction (APPROVED or REJECTED)
   * On approval: converts reservation to CONFIRMED, moves reserved inventory to sold, creates Order & OrderItems
   * On rejection: marks transaction as FAILED (reservation remains PENDING until expiry or cancellation)
   */
  public async resolvePayment(
    transactionId: string,
    action: 'APPROVE' | 'REJECT',
    attendeeName?: string,
    attendeeEmail?: string
  ): Promise<{ transaction: PaymentTransaction; order?: Order }> {
    return dbManager.transaction(async (data) => {
      const txn = data.paymentTransactions.find((t) => t.id === transactionId);
      if (!txn) {
        throw new Error('Payment transaction not found');
      }

      if (txn.status === 'SUCCESS') {
        const existingOrder = data.orders.find((o) => o.id === txn.orderId);
        return { transaction: txn, order: existingOrder };
      }

      const reservation = data.reservations.find((r) => r.id === txn.reservationId);
      if (!reservation) {
        throw new Error('Associated reservation not found');
      }

      // Check if reservation expired in the meantime
      if (new Date(reservation.expiresAt).getTime() <= Date.now()) {
        txn.status = 'FAILED';
        txn.updatedAt = new Date().toISOString();
        txn.providerResponse = JSON.stringify({
          error: 'RESERVATION_EXPIRED_DURING_PAYMENT',
          message: 'Payment timed out: reservation has exceeded 10-minute hold window.',
        });

        // Release inventory if still marked pending
        if (reservation.status === 'PENDING') {
          reservation.status = 'EXPIRED';
          for (const item of reservation.items) {
            const cat = data.ticketCategories.find((c) => c.id === item.ticketCategoryId);
            if (cat) {
              cat.reservedQuantity = Math.max(0, cat.reservedQuantity - item.quantity);
            }
          }
        }
        throw new Error('Reservation expired while processing payment. Funds will not be deducted.');
      }

      if (action === 'REJECT') {
        txn.status = 'FAILED';
        txn.updatedAt = new Date().toISOString();
        txn.providerResponse = JSON.stringify({
          error: 'SIMULATED_DECLINE',
          message: 'Simulated issuer bank rejection: Insufficient test funds or customer declined.',
        });

        logAuditInternal(
          data,
          reservation.userId,
          undefined,
          'PAYMENT_REJECTED',
          'PAYMENT',
          txn.id,
          `Payment ${txn.providerReference} was rejected by simulation`
        );

        return { transaction: txn };
      }

      // Action is APPROVE
      // 1. Mark transaction SUCCESS
      txn.status = 'SUCCESS';
      txn.updatedAt = new Date().toISOString();
      txn.providerResponse = JSON.stringify({
        status: 'CAPTURED',
        authCode: `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        network: 'RUPAY_SIMULATOR',
        settledAt: new Date().toISOString(),
      });

      // 2. Mark reservation CONFIRMED
      reservation.status = 'CONFIRMED';
      reservation.updatedAt = new Date().toISOString();

      // 3. Move inventory from reserved to sold atomically
      for (const item of reservation.items) {
        const cat = data.ticketCategories.find((c) => c.id === item.ticketCategoryId);
        if (cat) {
          cat.reservedQuantity = Math.max(0, cat.reservedQuantity - item.quantity);
          cat.soldQuantity += item.quantity;
        }
      }

      // 4. Create Order & OrderItems
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderNumber = `TN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const orderItems: OrderItem[] = reservation.items.map((item, idx) => {
        const cat = data.ticketCategories.find((c) => c.id === item.ticketCategoryId);
        return {
          id: `item_${orderId}_${idx + 1}`,
          orderId,
          ticketCategoryId: item.ticketCategoryId,
          categoryName: cat?.name || item.categoryName || 'General Pass',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          attendeeName: attendeeName || 'Valued Attendee',
          attendeeEmail: attendeeEmail || 'attendee@example.com',
          qrCode: `TN-TKT-${orderNumber}-${idx + 1}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        };
      });

      const order: Order = {
        id: orderId,
        reservationId: reservation.id,
        eventId: reservation.eventId,
        userId: reservation.userId,
        orderNumber,
        totalAmount: reservation.totalAmount,
        currency: 'INR',
        status: 'PAID',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: orderItems,
      };

      data.orders.push(order);
      txn.orderId = order.id;

      // 5. Send notification to user
      data.notifications.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: reservation.userId,
        title: 'Booking Confirmed!',
        message: `Order #${order.orderNumber} for ₹${order.totalAmount} has been confirmed. Your ticket pass is ready.`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      logAuditInternal(
        data,
        reservation.userId,
        undefined,
        'ORDER_CONFIRMED',
        'ORDER',
        order.id,
        `Order #${order.orderNumber} confirmed with payment ref ${txn.providerReference}`
      );

      return { transaction: txn, order };
    });
  }

  /**
   * Webhook handler for external / simulated asynchronous callbacks.
   * Enforces strict idempotency: duplicate callbacks do not duplicate orders or double-deduct inventory.
   */
  public async handleWebhookCallback(payload: {
    providerReference: string;
    status: 'SUCCESS' | 'FAILED';
    signature?: string;
  }): Promise<{ status: string; message: string; orderId?: string }> {
    const data = dbManager.getRawData();
    const txn = data.paymentTransactions.find(
      (t) => t.providerReference === payload.providerReference
    );
    if (!txn) {
      return { status: 'ERROR', message: 'Transaction reference not found' };
    }

    // Check if already processed
    if (txn.status === 'SUCCESS') {
      return {
        status: 'IDEMPOTENT_IGNORED',
        message: 'Payment already processed and confirmed.',
        orderId: txn.orderId,
      };
    }

    if (payload.status === 'SUCCESS') {
      const resolved = await this.resolvePayment(txn.id, 'APPROVE');
      return {
        status: 'SUCCESS',
        message: 'Payment verified and order generated.',
        orderId: resolved.order?.id,
      };
    } else {
      await this.resolvePayment(txn.id, 'REJECT');
      return { status: 'FAILED', message: 'Payment marked as rejected.' };
    }
  }
}

export const paymentGateway = new SimulatedPaymentGateway();
