import { db } from '@/lib/db/drizzle';
import { sessions, transactions, stations, sessionAddons, addons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GamersClient } from './gamers-client';

export const revalidate = 0; // Dynamic on-demand loading

export default async function GamersPage() {
  // 1. Fetch completed sessions with station and checkout transaction details
  const completedSessions = await db
    .select({
      id: sessions.id,
      durationMinutes: sessions.durationMinutes,
      userPhone: sessions.userPhone,
      customerName: transactions.customerName,
      stationName: stations.name,
      stationType: stations.type,
    })
    .from(sessions)
    .leftJoin(transactions, eq(sessions.id, transactions.sessionId))
    .leftJoin(stations, eq(sessions.stationId, stations.id))
    .where(eq(sessions.status, 'Completed'));

  // 2. Fetch session addons with the product names
  const allAddons = await db
    .select({
      sessionId: sessionAddons.sessionId,
      addonName: addons.name,
      quantity: sessionAddons.quantity,
    })
    .from(sessionAddons)
    .leftJoin(addons, eq(sessionAddons.addonId, addons.id));

  return (
    <GamersClient 
      completedSessions={completedSessions} 
      sessionAddons={allAddons} 
    />
  );
}
