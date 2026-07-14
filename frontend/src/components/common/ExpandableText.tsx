import React, { useState } from 'react';

export const ExpandableText: React.FC<{ text: string; limit?: number }> = ({ text, limit = 50 }) => {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= limit) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {expanded ? text : `${text.slice(0, limit)}...`}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[#006d37] hover:underline font-bold ml-1.5 focus:outline-none inline-block text-[11px] cursor-pointer"
      >
        {expanded ? 'Thu gọn' : 'Xem thêm'}
      </button>
    </span>
  );
};
