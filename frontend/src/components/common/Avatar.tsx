import React from 'react';

const DEFAULT_COLORS = ['#006d37', '#0d6efd', '#6f42c1', '#fd7e14', '#20c997'];
const PROFILE_COLORS = [...DEFAULT_COLORS, '#e83e8c'];

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(word => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const getColor = (name: string, colors: string[]) => colors[name.charCodeAt(0) % colors.length];

export const AdminAvatar: React.FC<{ name: string; src?: string | null }> = ({ name, src }) => {
  if (src) {
    return <img alt="Avatar" className="w-full h-full object-cover" src={src} />;
  }

  return (
    <div style={{ background: getColor(name, DEFAULT_COLORS), width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>{getInitials(name)}</span>
    </div>
  );
};

export const PostAvatar: React.FC<{ name: string; src?: string | null; size?: number }> = ({ name, src, size = 44 }) => {
  if (src) {
    return (
      <div style={{ width: size, height: size }} className="rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
        <img alt="Avatar" className="w-full h-full object-cover" src={src} />
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, background: getColor(name, DEFAULT_COLORS), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} className="border border-white shadow-sm">
      <span style={{ color: '#fff', fontWeight: 700, fontSize: size * 0.35 }}>{getInitials(name)}</span>
    </div>
  );
};

export const AvatarPlaceholder: React.FC<{ name: string; size?: number }> = ({ name, size = 128 }) => (
  <div
    style={{ width: size, height: size, background: getColor(name, PROFILE_COLORS), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    aria-label={`Avatar cua ${name}`}
  >
    <span style={{ color: '#fff', fontWeight: 700, fontSize: size * 0.35, fontFamily: 'inherit' }}>{getInitials(name)}</span>
  </div>
);
