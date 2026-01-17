import axios from 'axios';
import prisma from '../config/prisma';

type TimeSlot = {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
};

const sentCache = new Set<string>();

const getTimeSlotKey = (date: Date, slot: TimeSlot) => {
  const day = date.toISOString().split('T')[0];
  return `${day}-${slot.hour}:${slot.minute}-${slot.period}`;
};

const matchesTimeSlot = (date: Date, slots: TimeSlot[]) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const hourStr = String(hour12).padStart(2, '0');
  const minuteStr = String(minutes).padStart(2, '0');
  return slots.some((slot) => slot.hour === hourStr && slot.minute === minuteStr && slot.period === period);
};

export const startMedAlertScheduler = () => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('N8N_WEBHOOK_URL not set. Med alert dispatch disabled.');
    return;
  }

  setInterval(async () => {
    const now = new Date();
    try {
      const reminders = await prisma.medAlertReminder.findMany({
        where: {
          isActive: true,
          isPaused: false,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }]
        },
        include: {
          user: {
            select: {
              id: true,
              phoneNumber: true,
              countryCode: true
            }
          }
        }
      });

      for (const reminder of reminders) {
        const slots = (reminder.timeSlot as TimeSlot[]) || [];
        if (!slots.length || !matchesTimeSlot(now, slots)) {
          continue;
        }

        const cacheKey = `${reminder.id}-${getTimeSlotKey(now, slots[0])}`;
        if (sentCache.has(cacheKey)) {
          continue;
        }

        sentCache.add(cacheKey);

        await axios.post(webhookUrl, {
          reminderId: reminder.id,
          userId: reminder.userId,
          phoneNumber: reminder.user?.phoneNumber,
          countryCode: reminder.user?.countryCode,
          medicineName: reminder.medicineName,
          dosage: reminder.dosage,
          frequency: reminder.frequency,
          form: reminder.form
        });
      }

      // trim cache occasionally to avoid unbounded growth
      if (sentCache.size > 5000) {
        sentCache.clear();
      }
    } catch (error) {
      console.error('Med alert dispatch failed', error);
    }
  }, 60 * 1000);
};
