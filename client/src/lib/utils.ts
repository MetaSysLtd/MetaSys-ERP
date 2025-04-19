import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  // If not 10 digits, return as-is
  return phone;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function getStatusColor(status: string): {
  bg: string; 
  text: string;
  border?: string;
} {
  switch (status.toLowerCase()) {
    case 'qualified':
      return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
    case 'unqualified':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
    case 'active':
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
    case 'follow-up':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
    case 'nurture':
      return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' };
    case 'lost':
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    case 'won':
      return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' };
    case 'booked':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' };
    case 'in_transit':
      return { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' };
    case 'delivered':
      return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' };
    case 'invoiced':
      return { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' };
    case 'paid':
      return { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' };
    case 'draft':
      return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
    case 'sent':
      return { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200' };
    case 'overdue':
      return { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
  }
}

export function getPrevMonthsData(count: number): { name: string; value: number }[] {
  const months = [];
  const currentDate = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    
    months.push({
      name: format(date, 'MMM'),
      value: 0
    });
  }
  
  return months;
}

export function getDepartmentColor(department: string): string {
  switch (department.toLowerCase()) {
    case 'sales':
      return 'text-primary-600';
    case 'dispatch':
      return 'text-secondary-600';
    case 'admin':
      return 'text-accent-600';
    default:
      return 'text-gray-600';
  }
}
