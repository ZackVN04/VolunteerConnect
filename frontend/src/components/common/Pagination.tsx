import React from 'react';

export const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-4 sm:px-6 mt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Trước
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Sau
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-grow sm:items-center sm:justify-between w-full">
        <div>
          <p className="text-xs text-slate-500 font-semibold">
            Hiển thị trang <span className="font-extrabold text-slate-800">{currentPage}</span> / <span className="font-extrabold text-slate-800">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm gap-1" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              const isCurrent = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-extrabold cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-[#006d37] text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
