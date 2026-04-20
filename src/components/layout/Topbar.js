import React from 'react';
import { Bell } from 'lucide-react';
import { Avatar } from '../ui/UI';

const Topbar = ({ title, user }) => (
  <header className="topbar">
    <h1 className="topbar-title">{title}</h1>
    <div className="topbar-right">
      <button className="topbar-notif">
        <Bell size={18} />
        <span className="notif-badge" />
      </button>
      <div className="topbar-user">
        <Avatar name={user?.name || 'User'} size="sm" />
        <div className="topbar-user-info">
          <span className="topbar-user-name">{user?.name || 'User'}</span>
          <span className="topbar-user-role">{user?.role || ''}</span>
        </div>
      </div>
    </div>
  </header>
);

export default Topbar;
