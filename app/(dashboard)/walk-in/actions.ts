'use server';

import { db } from '@/lib/db/drizzle';
import { stations, sessions, transactions, userMemberships, sessionAddons, addons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function allotSession(data: { stationId: number; durationMinutes: number; setupMinutes: number; type: 'walkin' | 'member'; userPhone?: string }) {
  const [station] = await db.select().from(stations).where(eq(stations.id, data.stationId));
  if (!station) throw new Error('Station not found');

  const totalPrice = data.type === 'walkin' ? Math.round((data.durationMinutes / 60) * station.ratePerHour) : 0;

  await db.insert(sessions).values({
    stationId: data.stationId,
    startTime: new Date(),
    endTime: new Date(Date.now() + (data.durationMinutes + data.setupMinutes) * 60000),
    durationMinutes: data.durationMinutes, // actual played time stored in db
    setupMinutes: data.setupMinutes,
    totalPrice,
    status: 'Active',
    userPhone: data.userPhone,
  });

  await db.update(stations).set({ status: 'Occupied' }).where(eq(stations.id, data.stationId));
  revalidatePath('/dashboard');
}

export async function checkoutSession(data: { stationId: number; sessionId: number; customerName: string; customerPhone: string; type: 'walkin' | 'member'; finalAmountCash: number; finalCoinsUsed: number }) {
  // Idempotency check: prevent duplicate checkouts from inserting multiple transactions
  const [session] = await db.select().from(sessions).where(eq(sessions.id, data.sessionId));
  if (!session || session.status === 'Completed') {
    return { success: false, message: 'Session already completed' };
  }

  await db.update(sessions).set({ status: 'Completed' }).where(eq(sessions.id, data.sessionId));
  await db.update(stations).set({ status: 'Active' }).where(eq(stations.id, data.stationId));

  await db.insert(transactions).values({
    sessionId: data.sessionId,
    userPhone: data.customerPhone,
    amountCash: data.finalAmountCash,
    amountCreditsUsed: data.finalCoinsUsed,
    transactionType: 'Session',
    timestamp: new Date(),
    customerName: data.customerName,
  });

  if (data.type === 'member' && data.customerPhone) {
    const [member] = await db.select().from(userMemberships).where(eq(userMemberships.phone, data.customerPhone));
    if (member) {
      await db.update(userMemberships).set({ coinsBalance: Math.max(0, member.coinsBalance - data.finalCoinsUsed) }).where(eq(userMemberships.id, member.id));
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/reports');
  return { success: true };
}

export async function add15Mins(stationId: number, sessionId: number) {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session?.endTime) return;
  await db.update(sessions).set({
    endTime: new Date(session.endTime.getTime() + 15 * 60000),
    durationMinutes: session.durationMinutes + 15,
  }).where(eq(sessions.id, sessionId));
  revalidatePath('/dashboard');
}

export async function getTransactionDetails(transactionId: number) {
  const [txn] = await db.select().from(transactions).where(eq(transactions.id, transactionId));
  if (!txn) throw new Error('Transaction not found');

  let sessionObj = null;
  let stationObj = null;
  let addonsList: any[] = [];
  
  if (txn.sessionId) {
    const [sess] = await db.select().from(sessions).where(eq(sessions.id, txn.sessionId));
    if (sess) {
      sessionObj = sess;
      const [st] = await db.select().from(stations).where(eq(stations.id, sess.stationId));
      if (st) {
        stationObj = st;
      }
      
      // Fetch session addons
      addonsList = await db
        .select({
          id: sessionAddons.id,
          addonId: sessionAddons.addonId,
          name: addons.name,
          quantity: sessionAddons.quantity,
          priceAtPurchase: sessionAddons.priceAtPurchase,
        })
        .from(sessionAddons)
        .leftJoin(addons, eq(sessionAddons.addonId, addons.id))
        .where(eq(sessionAddons.sessionId, sess.id));
    }
  }

  return {
    transaction: txn,
    session: sessionObj,
    station: stationObj,
    addons: addonsList
  };
}
