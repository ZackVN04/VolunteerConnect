import React from 'react';

export const InfoItem: React.FC<{
  icon: string;
  iconColorClass: string;
  bgClass: string;
  label: string;
  value: React.ReactNode;
}> = ({ icon, iconColorClass, bgClass, label, value }) => (
  <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl items-center hover:shadow-sm transition-all duration-150">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass} shrink-0`}>
      <span className={`material-symbols-outlined text-lg ${iconColorClass}`}>{icon}</span>
    </div>
    <div className="space-y-0.5 text-left">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
      <span className="text-slate-800 text-sm font-semibold block">{value}</span>
    </div>
  </div>
);
