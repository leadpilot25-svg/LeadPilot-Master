import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'new':
      return 'bg-blue-100 text-blue-700';
    case 'contacted':
      return 'bg-amber-100 text-amber-700';
    case 'site_visit':
      return 'bg-purple-100 text-purple-700';
    case 'meeting':
      return 'bg-orange-100 text-orange-700';
    case 'closed':
      return 'bg-emerald-100 text-emerald-700';
    case 'inactive':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-50 text-gray-400';
  }
}
