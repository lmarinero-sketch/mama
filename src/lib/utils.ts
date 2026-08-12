import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsappLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function getFallbackImage(categoryName?: string): string {
  if (categoryName?.toLowerCase().includes('queso')) {
    return 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80';
  }
  if (categoryName?.toLowerCase().includes('combo') || categoryName?.toLowerCase().includes('picada')) {
    return 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1524182576066-1d96117a7616?w=600&q=80';
}
