import React from 'react';

export const ActivitySkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-surface-variant/40 rounded-2xl overflow-hidden shadow-sm flex flex-col animate-pulse">
      <div className="relative h-[200px] bg-slate-200 shrink-0"></div>
      <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
          <div className="space-y-2 mt-4">
            <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
            <div className="h-4 bg-slate-100 rounded-md w-2/3"></div>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <div className="flex-1 h-9 bg-slate-200 rounded-xl"></div>
          <div className="flex-1 h-9 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export const PostSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-slate-200"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-32"></div>
          <div className="h-3 bg-slate-100 rounded w-20"></div>
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-4 bg-slate-200 rounded w-full"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
      </div>
      <div className="h-48 bg-slate-200 rounded-2xl w-full mt-3"></div>
    </div>
  );
};

export const PaginationSkeleton: React.FC<{ count?: number; className?: string }> = ({ count = 3, className = '' }) => {
  return (
    <div className={`flex justify-center gap-2 animate-pulse ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-8 h-8 rounded-full bg-slate-200"></div>
      ))}
    </div>
  );
};
