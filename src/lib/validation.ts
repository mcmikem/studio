import { z } from 'zod';

export const ugandaPhoneRegex = /^(07\d{8}|2567\d{8}|07\d-\d{3}-\d{3}|2567\d-\d{3}-\d{3})$/;
export const ugandaPhoneSimpleRegex = /^(\+?256|0)7\d{8}$/;

export function isValidUgandaPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\.]/g, '');
  return ugandaPhoneSimpleRegex.test(cleaned);
}

export function formatUgandaPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '').replace(/^0/, '0');
  if (cleaned.startsWith('256')) return `+${cleaned}`;
  if (cleaned.startsWith('07')) return `+256${cleaned.slice(1)}`;
  return phone;
}

export const phoneSchema = z.string().refine(isValidUgandaPhone, {
  message: 'Enter a valid Uganda number (e.g., 0771234567 or +256771234567)',
});

export function isValidUgandaCoordinates(lat: number, lng: number): boolean {
  return lat >= -1.5 && lat <= 4.5 && lng >= 29.5 && lng <= 35.0;
}

export function isFutureYear(year: string): boolean {
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum)) return false;
  return yearNum > new Date().getFullYear() + 1;
}
