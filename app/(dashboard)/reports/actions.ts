'use server';

import { db } from '@/lib/db/drizzle';
import { transactions, sessionAddons } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';

export async function createCustomTransaction(data: {
  type: 'Snack' | 'Income' | 'Expense';
  amount: number;
  comment?: string;
  customerName?: string;
  customerPhone?: string;
  addonsList?: { id: number; quantity: number; price: number }[];
}) {
  // 1. Create the transaction record
  const [txn] = await db.insert(transactions).values({
    transactionType: data.type,
    amountCash: data.amount,
    amountCreditsUsed: 0,
    customerName: data.customerName || (data.type === 'Snack' ? 'Standalone Snack Customer' : null),
    userPhone: data.customerPhone || null,
    comment: data.comment || null,
    timestamp: new Date(),
  }).returning();

  // 2. If Standalone Snack ('Snack') with items, link them in sessionAddons referencing transactionId
  if (data.type === 'Snack' && data.addonsList && data.addonsList.length > 0) {
    await db.insert(sessionAddons).values(
      data.addonsList.map(item => ({
        transactionId: txn.id,
        addonId: item.id,
        quantity: item.quantity,
        priceAtPurchase: item.price,
      }))
    );
  }

  revalidatePath('/reports');
  revalidatePath('/dashboard');
  return { success: true, txnId: txn.id };
}
