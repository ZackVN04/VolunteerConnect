import React from 'react';

export const ActivityStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    'Draft': { label: 'Bản nháp', cls: 'bg-slate-100 text-slate-600 border border-slate-200/50' },
    'Pending Review': { label: 'Chờ duyệt', cls: 'bg-[#fef7e0] text-[#b06000] border border-[#b06000]/10' },
    'Open': { label: 'Đang tuyển', cls: 'bg-emerald-50 text-[#006d37] border border-emerald-100/50' },
    'Full': { label: 'Đã đầy', cls: 'bg-teal-50 text-teal-800 border border-teal-100/50' },
    'Ongoing': { label: 'Đang diễn ra', cls: 'bg-blue-50 text-blue-800 border border-blue-100/50' },
    'Completed': { label: 'Đã kết thúc', cls: 'bg-slate-100 text-slate-600 border border-slate-200/50' },
    'Rejected': { label: 'Bị từ chối', cls: 'bg-red-50 text-red-700 border border-red-200/50' },
    'Cancelled': { label: 'Đã hủy', cls: 'bg-slate-50 text-slate-500 border border-slate-100/50' },
  };
  const statusConfig = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${statusConfig.cls}`}>{statusConfig.label}</span>;
};
