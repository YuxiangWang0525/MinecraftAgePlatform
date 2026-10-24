import { AgeRange } from '../enums/age-range.enum.js';

/**
 * 根据出生日期计算年龄和年龄段
 */
export function calculateAgeFromBirthDate(birthDate: string): { age: number; ageRange: AgeRange; isMinor: boolean } {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  let ageRange: AgeRange;
  if (age >= 18) ageRange = AgeRange.EIGHTEEN_PLUS;
  else if (age >= 16) ageRange = AgeRange.SIXTEEN_PLUS;
  else if (age >= 12) ageRange = AgeRange.TWELVE_PLUS;
  else if (age >= 8) ageRange = AgeRange.EIGHT_PLUS;
  else ageRange = AgeRange.FOUR_PLUS;

  return { age, ageRange, isMinor: age < 18 };
}
