import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const DemoController: React.FC = () => {
  const { currentUser, users, activities, registrations, organizerRequests, posts, loginAs, resetDatabase } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'activities' | 'registrations' | 'requests' | 'posts'>('users');
  const [showInspector, setShowInspector] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[999] bg-inverse-surface text-inverse-on-surface p-4 rounded-xl shadow-2xl border border-outline/30 max-w-lg w-full max-h-[85vh] flex flex-col font-sans text-sm">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-outline/30 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-fixed">construction</span>
          <span className="font-bold font-display tracking-tight text-white">Demo Control Panel</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowInspector(!showInspector)} 
            className="text-xs px-2.5 py-1 bg-on-secondary-fixed-variant/50 text-white rounded hover:bg-on-secondary-fixed-variant/80 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">database</span>
            {showInspector ? 'Ẩn Data' : 'Xem Data'}
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-1 hover:bg-on-secondary-fixed-variant/30 rounded"
          >
            <span className="material-symbols-outlined text-white">
              {isOpen ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
      </div>

      {/* Profile Details & Quick Switcher */}
      {(!isOpen || showInspector) && (
        <div className="mb-2 bg-on-secondary-fixed-variant/20 p-2.5 rounded-lg border border-outline/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-outline-variant text-xs">Đang giả lập tài khoản:</span>
            <span className="bg-primary text-on-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              {currentUser.role}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
              {currentUser.profile.full_name.split(' ').map(n => n[0]).join('').substring(0,2)}
            </div>
            <div>
              <p className="font-bold text-white leading-tight">{currentUser.profile.full_name}</p>
              <p className="text-xs text-outline-variant mt-0.5">
                {currentUser.phone && !currentUser.phone.startsWith('+84') 
                  ? `SĐT: ${currentUser.phone}${currentUser.email ? ` • ${currentUser.email}` : ''}`
                  : `Email: ${currentUser.email || 'Không có email'}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="flex-grow overflow-y-auto space-y-4 pr-1">
          {/* Quick Switching Buttons */}
          <div>
            <h4 className="text-xs font-bold text-outline-variant mb-2 uppercase tracking-wide">Chọn vai trò Test:</h4>
            <div className="grid grid-cols-2 gap-2">
              {users.map(u => {
                const isActive = u._id === currentUser._id;
                let badgeColor = 'bg-surface-variant text-on-surface-variant';
                if (u.role === 'Admin') badgeColor = 'bg-red-500/20 text-red-300';
                if (u.role === 'Organizer') badgeColor = 'bg-emerald-500/20 text-emerald-300';
                if (u.role === 'Volunteer') badgeColor = 'bg-blue-500/20 text-blue-300';

                return (
                  <button
                    key={u._id}
                    onClick={() => loginAs(u._id)}
                    className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between h-16 border ${
                      isActive 
                        ? 'border-primary-fixed bg-on-secondary-fixed-variant/40 ring-1 ring-primary-fixed' 
                        : 'border-outline/20 hover:bg-on-secondary-fixed-variant/20 bg-inverse-surface'
                    }`}
                  >
                    <span className="font-medium text-white truncate w-full text-xs">{u.profile.full_name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold self-start mt-1 uppercase ${badgeColor}`}>
                      {u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Database Control Actions */}
          <div className="flex gap-2">
            <button
              onClick={resetDatabase}
              className="flex-1 bg-red-600/80 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Reset Database về gốc
            </button>
          </div>
        </div>
      )}

      {/* Database Live Inspector Panel */}
      {showInspector && (
        <div className="mt-3 border-t border-outline/30 pt-3 flex flex-col flex-grow min-h-[220px] max-h-[350px]">
          {/* Tabs */}
          <div className="flex border-b border-outline/20 mb-2 overflow-x-auto gap-1">
            {(['users', 'activities', 'registrations', 'requests', 'posts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-1 px-2.5 text-xs rounded-t font-semibold ${
                  activeTab === tab 
                    ? 'bg-on-secondary-fixed-variant/40 text-primary-fixed border-b-2 border-primary-fixed' 
                    : 'text-outline-variant hover:text-white'
                }`}
              >
                {tab === 'users' && `Users (${users.length})`}
                {tab === 'activities' && `Activities (${activities.length})`}
                {tab === 'registrations' && `Registrations (${registrations.length})`}
                {tab === 'requests' && `Requests (${organizerRequests.length})`}
                {tab === 'posts' && `Posts (${posts.length})`}
              </button>
            ))}
          </div>

          {/* JSON Console View */}
          <div className="bg-black/40 p-2.5 rounded-lg font-mono text-[10px] text-green-400 overflow-y-auto flex-grow h-40 max-w-full">
            {activeTab === 'users' && <pre>{JSON.stringify(users.map(u => ({ id: u._id, name: u.profile.full_name, role: u.role, joinedCount: u.profile.joined_activity_count })), null, 2)}</pre>}
            {activeTab === 'activities' && <pre>{JSON.stringify(activities.map(a => ({ id: a._id, title: a.title, status: a.status, approvedVolunteers: a.approved_volunteers_count })), null, 2)}</pre>}
            {activeTab === 'registrations' && <pre>{JSON.stringify(registrations.map(r => ({ id: r._id, volunteer: r.denormalized_volunteer.name, activity: r.denormalized_activity.title, status: r.status })), null, 2)}</pre>}
            {activeTab === 'requests' && <pre>{JSON.stringify(organizerRequests.map(rq => ({ id: rq._id, volunteer: rq.denormalized_volunteer.name, status: rq.status })), null, 2)}</pre>}
            {activeTab === 'posts' && <pre>{JSON.stringify(posts.map(p => ({ id: p._id, author: p.denormalized_author?.name, likes: p.like_count })), null, 2)}</pre>}
          </div>
        </div>
      )}
    </div>
  );
};
