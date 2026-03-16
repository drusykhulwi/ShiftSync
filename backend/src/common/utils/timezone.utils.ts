// backend/src/common/utils/timezone.utils.ts
export class TimezoneUtils {
  static toLocationTime(date: Date, timezone: string): Date {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  }

  static toUTC(date: Date, timezone: string): Date {
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const utcDate = new Date(date);
    const offset = localDate.getTime() - utcDate.getTime();
    return new Date(date.getTime() - offset);
  }

  static isOvernightShift(start: Date, end: Date): boolean {
    return end.getHours() < start.getHours() || 
           (end.getHours() === start.getHours() && end.getMinutes() < start.getMinutes());
  }

  static formatForLocation(date: Date, timezone: string): string {
    return date.toLocaleString('en-US', { 
      timeZone: timezone,
      hour12: true,
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}