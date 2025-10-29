
'use client';

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  limit,
  type Firestore,
} from 'firebase/firestore';
import { format } from 'date-fns';

export async function getUpcomingEvents(firestore: Firestore, userId: string) {
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const eventsQuery = query(
    collection(firestore, 'events'),
    where('date', '>=', Timestamp.fromDate(today)),
    where('date', '<=', Timestamp.fromDate(sevenDaysFromNow)),
    // In a real app with many users, you'd filter by user involvement
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(eventsQuery);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      title: data.title,
      date: format(data.date.toDate(), 'eeee, MMM d'),
      category: data.category,
      responsible: data.responsible,
    };
  });
}

export async function getPendingTasks(firestore: Firestore, userId: string) {
  const tasksQuery = query(
    collection(firestore, 'users', userId, 'tasks'),
    where('completed', '==', false),
    orderBy('createdAt', 'desc'),
    limit(5)
  );

  const snapshot = await getDocs(tasksQuery);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      title: data.title,
      dueDate: data.dueDate ? format(new Date(data.dueDate), 'eeee, MMM d') : undefined,
    };
  });
}
