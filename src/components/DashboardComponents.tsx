import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export function StatsCard({ label, value, icon: Icon, color, delay = 0 }: StatsCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3"
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </motion.div>
  );
}

interface QuickStatProps {
  label: string;
  value: string | number;
  status: 'warning' | 'error' | 'success' | 'info';
}

export function QuickStat({ label, value, status }: QuickStatProps) {
  const statusColors = {
    warning: 'text-amber-600 bg-amber-50 border-amber-100',
    error: 'text-red-600 bg-red-50 border-red-100',
    success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    info: 'text-blue-600 bg-blue-50 border-blue-100'
  };

  return (
    <div className={cn("px-4 py-3 rounded-xl border flex flex-col gap-0.5", statusColors[status])}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}
