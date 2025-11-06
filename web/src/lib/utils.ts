import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date, format = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return d.toLocaleDateString('es-CO');
  }
  
  return d.toLocaleString('es-CO');
}

export function getEstadoColor(estado: string): string {
  const colors: Record<string, string> = {
    recibida: 'bg-blue-100 text-blue-800',
    en_proceso: 'bg-yellow-100 text-yellow-800',
    enviada: 'bg-purple-100 text-purple-800',
    finalizada: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800',
    preparando: 'bg-blue-100 text-blue-800',
    en_transito: 'bg-yellow-100 text-yellow-800',
    retenido: 'bg-orange-100 text-orange-800',
    entregado: 'bg-green-100 text-green-800',
    devuelto: 'bg-red-100 text-red-800',
  };
  
  return colors[estado] || 'bg-gray-100 text-gray-800';
}

export function getEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    recibida: 'Recibida',
    en_proceso: 'En Proceso',
    enviada: 'Enviada',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada',
    preparando: 'Preparando',
    en_transito: 'En Tránsito',
    retenido: 'Retenido',
    entregado: 'Entregado',
    devuelto: 'Devuelto',
  };
  
  return labels[estado] || estado;
}
