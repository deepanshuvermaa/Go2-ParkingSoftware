import { format, parseISO } from 'date-fns';

export const formatDateTime = (iso: string, pattern = 'MMM d, yyyy • h:mm a') => {
  try {
    return format(parseISO(iso), pattern);
  } catch (error) {
    return iso;
  }
};

export const isoNow = () => new Date().toISOString();

export const durationMinutes = (start: string, end?: string) => {
  const finish = end ? new Date(end) : new Date();
  return Math.max(0, Math.round((finish.getTime() - new Date(start).getTime()) / 60000));
};
