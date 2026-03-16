// backend/src/common/utils/validation.utils.ts
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  }

  static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  static isOverlapping(
    start1: Date, 
    end1: Date, 
    start2: Date, 
    end2: Date,
    exclusive: boolean = true
  ): boolean {
    if (exclusive) {
      return start1 < end2 && end1 > start2;
    }
    return start1 <= end2 && end1 >= start2;
  }

  static hasMinimumGap(
    end1: Date, 
    start2: Date, 
    minimumHours: number = 10
  ): boolean {
    const gapMs = start2.getTime() - end1.getTime();
    const gapHours = gapMs / (1000 * 60 * 60);
    return gapHours >= minimumHours;
  }

  static calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}