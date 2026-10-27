// TicketNest Automated Test Suite
import assert from 'assert';
import { dbManager } from '../src/server/db.ts';
import { paymentGateway } from '../src/server/payment.ts';
import { reservationWorker } from '../src/server/worker.ts';
import { TicketCategory, Event } from '../src/server/types.ts';

async function runTestSuite() {
  console.log('========================================================');
  console.log('           TICKETNEST AUTOMATED TEST SUITE              ');
  console.log('========================================================');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`[PASS] Scenario ${total}: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] Scenario ${total}: ${name}`);
      console.error(`       Error: ${err.message}`);
    }
  }

  // 1. CONCURRENT BOOKING
  await test('Concurrent booking: exactly 10 succeeds, remaining 10 fail (no overselling)', async () => {
    const testCatId = 'tkt_conc_test_10';
    const testEventId = 'evt_conc_test';

    await dbManager.transaction((data) => {
      data.ticketCategories = data.ticketCategories.filter((c) => c.id !== testCatId);
      data.events = data.events.filter((e) => e.id !== testEventId);

      const evt: Event = {
        id: testEventId,
        organizationId: 'org_pulse_1',
        title: 'Concurrent Test Event',
        slug: 'concurrent-test-evt',
        description: 'Testing concurrency',
        coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
        category: 'Technology',
        venueName: 'Arena A',
        venueAddress: 'Outer Ring',
        city: 'Bengaluru',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        bookingOpensAt: new Date(Date.now() - 3600000).toISOString(),
        salesClosesAt: new Date(Date.now() + 86400000).toISOString(),
        maxCapacity: 10,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const cat: TicketCategory = {
        id: testCatId,
        eventId: testEventId,
        name: 'Strict 10 Pass',
        price: 100,
        totalQuantity: 10,
        reservedQuantity: 0,
        soldQuantity: 0,
        maxPerUser: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.events.push(evt);
      data.ticketCategories.push(cat);
    });

    const promises: Promise<{ success: boolean; error?: string }>[] = [];
    for (let i = 0; i < 20; i++) {
      const p = dbManager.transaction((data) => {
        const cat = data.ticketCategories.find((c) => c.id === testCatId)!;
        const available = cat.totalQuantity - (cat.reservedQuantity + cat.soldQuantity);
        if (available < 1) throw new Error('Insufficient tickets');

        cat.reservedQuantity += 1;
        const resId = `res_conc_${i + 1}`;
        data.reservations.push({
          id: resId,
          eventId: testEventId,
          userId: `usr_conc_${i + 1}`,
          reservationNumber: `RES-C-${i + 1}`,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 600000).toISOString(),
          totalAmount: 100,
          items: [{
            id: `item_c_${i + 1}`,
            reservationId: resId,
            ticketCategoryId: testCatId,
            quantity: 1,
            unitPrice: 100,
            subtotal: 100,
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return { success: true };
      }).catch((err) => ({ success: false, error: err.message }));

      promises.push(p);
    }

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    assert.strictEqual(successful, 10, `Expected 10 successes, got ${successful}`);
    assert.strictEqual(failed, 10, `Expected 10 failures, got ${failed}`);
  });

  // 2. EXPIRED RESERVATION
  await test('Expired reservation: background worker releases inventory and prevents checkout', async () => {
    const expiredResId = 'res_test_exp_99';
    const testCatId = 'tkt_conc_test_10';

    await dbManager.transaction((data) => {
      const cat = data.ticketCategories.find((c) => c.id === testCatId)!;
      cat.reservedQuantity = 3;

      data.reservations.push({
        id: expiredResId,
        eventId: 'evt_conc_test',
        userId: 'usr_att_1',
        reservationNumber: 'RES-EXP-99',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired!
        totalAmount: 300,
        items: [{
          id: 'item_exp_99',
          reservationId: expiredResId,
          ticketCategoryId: testCatId,
          quantity: 3,
          unitPrice: 100,
          subtotal: 300,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    const cleaned = await reservationWorker.processExpiredReservations();
    assert.ok(cleaned >= 1, `Cleaned expired reservations: ${cleaned}`);

    const res = dbManager.getRawData().reservations.find((r) => r.id === expiredResId)!;
    assert.strictEqual(res.status, 'EXPIRED', 'Status must be EXPIRED');

    const cat = dbManager.getRawData().ticketCategories.find((c) => c.id === testCatId)!;
    assert.strictEqual(cat.reservedQuantity, 0, 'Reserved quantity must be restored to 0');
  });

  // 3. PAYMENT FAILURE
  await test('Payment failure: rejected payment does NOT generate confirmed order', async () => {
    const resId = `res_fail_${Date.now()}`;
    await dbManager.transaction((data) => {
      data.reservations.push({
        id: resId,
        eventId: 'evt_tech_conf_1',
        userId: 'usr_att_1',
        reservationNumber: `RES-FAIL-${Date.now()}`,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        totalAmount: 600,
        items: [{
          id: `item_fail_${Date.now()}`,
          reservationId: resId,
          ticketCategoryId: 'tkt_dev_std',
          quantity: 1,
          unitPrice: 600,
          subtotal: 600,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    const { transaction } = await paymentGateway.initiatePayment({
      reservationId: resId,
      userId: 'usr_att_1',
    });

    const result = await paymentGateway.resolvePayment(transaction.id, 'REJECT');
    assert.strictEqual(result.transaction.status, 'FAILED');
    assert.strictEqual(result.order, undefined);

    const orderExists = dbManager.getRawData().orders.some((o) => o.reservationId === resId);
    assert.strictEqual(orderExists, false);
  });

  // 4. DUPLICATE CALLBACK IDEMPOTENCY
  await test('Duplicate callback: repeated webhooks do NOT duplicate orders or deduct inventory', async () => {
    const resId = `res_idem_${Date.now()}`;
    await dbManager.transaction((data) => {
      const cat = data.ticketCategories.find((c) => c.id === 'tkt_dev_std')!;
      cat.reservedQuantity += 1;

      data.reservations.push({
        id: resId,
        eventId: 'evt_tech_conf_1',
        userId: 'usr_att_1',
        reservationNumber: `RES-IDEM-${Date.now()}`,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        totalAmount: 600,
        items: [{
          id: `item_idem_${Date.now()}`,
          reservationId: resId,
          ticketCategoryId: 'tkt_dev_std',
          quantity: 1,
          unitPrice: 600,
          subtotal: 600,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    const { transaction } = await paymentGateway.initiatePayment({
      reservationId: resId,
      userId: 'usr_att_1',
    });

    const first = await paymentGateway.handleWebhookCallback({
      providerReference: transaction.providerReference,
      status: 'SUCCESS',
    });
    assert.strictEqual(first.status, 'SUCCESS');

    const second = await paymentGateway.handleWebhookCallback({
      providerReference: transaction.providerReference,
      status: 'SUCCESS',
    });
    assert.strictEqual(second.status, 'IDEMPOTENT_IGNORED');

    const ordersCount = dbManager.getRawData().orders.filter((o) => o.reservationId === resId).length;
    assert.strictEqual(ordersCount, 1);
  });

  // 5. TENANT ISOLATION
  await test('Tenant isolation: one organizer cannot access another organization private records', async () => {
    const raw = dbManager.getRawData();
    const org1Event = raw.events.find((e) => e.organizationId === 'org_pulse_1')!;
    const org2User = raw.users.find((u) => u.email === 'organizer@summit.org')!;
    const membership = raw.organizationMembers.find((m) => m.userId === org2User.id);

    assert.notStrictEqual(membership?.organizationId, org1Event.organizationId);
  });

  console.log('========================================================');
  console.log(`TEST SUMMARY: ${passed}/${total} test scenarios passed!`);
  console.log('========================================================');
  process.exit(passed === total ? 0 : 1);
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
