'use server';

import { db } from '@/lib/db/drizzle';
import { stations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createStation(data: { name: string, type: string, ratePerHour: number, coinsPerHour: number }) {
  await db.insert(stations).values({
    name: data.name,
    type: data.type,
    ratePerHour: data.ratePerHour,
    coinsPerHour: data.coinsPerHour,
    status: 'Active'
  });
  revalidatePath('/stations');
  revalidatePath('/walk-in');
}

export async function updateStation(id: number, data: { name: string, type: string, ratePerHour: number, coinsPerHour: number }) {
  await db.update(stations)
    .set({
      name: data.name,
      type: data.type,
      ratePerHour: data.ratePerHour,
      coinsPerHour: data.coinsPerHour
    })
    .where(eq(stations.id, id));
  revalidatePath('/stations');
  revalidatePath('/walk-in');
}

export async function toggleStationStatus(id: number, currentStatus: string) {
  const newStatus = currentStatus === 'Active' ? 'Maintenance' : 'Active';
  await db.update(stations)
    .set({ status: newStatus })
    .where(eq(stations.id, id));
  revalidatePath('/stations');
  revalidatePath('/walk-in');
}

export async function deleteStation(id: number) {
  await db.delete(stations).where(eq(stations.id, id));
  revalidatePath('/stations');
  revalidatePath('/walk-in');
}
