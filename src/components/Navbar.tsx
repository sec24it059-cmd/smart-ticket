import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Clock,
  User as UserIcon,
  LogOut,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useReservation } from '../context/ReservationContext.tsx';
import { ERDiagramModal } from './ERDiagramModal.tsx';

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoUser } = useAuth();
  const { activeHold, secondsRemaining, formatTime } = useReservation();
  const navigate = useNavigate();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showERModal, setShowERModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#1c0f2b]/95 backdrop-blur-md border-b border-white/10 text-white transition-all shadow-md">
        {/* Active Hold Countdown Banner (when user has active 10-min reservation) */}
        {activeHold && secondsRemaining > 0 && (
          <div className="bg-gradient-to-r from-[#ff5c5c] to-[#ff3b3b] text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2 mx-auto sm:mx-0">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>
                <strong>10-Min Hold Active:</strong> Tickets for{' '}
                <span className="underline font-semibold">{activeHold.eventTitle}</span> held exclusively for you.
              </span>
              <span className="bg-black/30 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                {formatTime(secondsRemaining)}
              </span>
            </div>
            <Link
              to={`/checkout/${activeHold.reservationId}`}
              className="hidden sm:inline-flex items-center gap-1 bg-white text-[#1c0f2b] px-3 py-1 rounded-full text-xs font-bold hover:bg-white/90 shadow transition-colors"
            >
              Complete Checkout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff5c5c] via-[#ff7373] to-[#ff8f70] flex items-center justify-center text-white shadow-md shadow-[#ff5c5c]/30 group-hover:scale-105 transition-transform">
                  <Ticket className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-white/95 to-white/70 bg-clip-text text-transparent">
                    Ticket<span className="text-[#ff5c5c]">Nest</span>
                  </span>
                  <span className="text-[10px] text-white/50 -mt-1 font-mono tracking-wider">
                    SMART TICKETING
                  </span>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-white/80">
                <Link
                  to="/events"
                  className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
                >
                  Explore Events
                </Link>

                {user?.role === 'ORGANIZER' && (
                  <Link
                    to="/organizer"
                    className="px-3 py-2 rounded-lg text-[#ff8f70] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Organizer Studio
                  </Link>
                )}

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 rounded-lg text-[#ff5c5c] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Admin Command
                  </Link>
                )}

                <button
                  onClick={() => setShowERModal(true)}
                  className="px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-mono"
                  title="View PostgreSQL Database ER Diagram"
                >
                  <Layers className="w-3.5 h-3.5 text-[#ff5c5c]" />
                  ER Schema
                </button>
              </nav>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Quick 1-Click Role Switcher for rapid demo evaluation */}
              <div className="relative">
                <button
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#ff8f70]" />
                  <span className="hidden sm:inline">Role: </span>
                  <span className="font-bold text-[#ff5c5c]">{user?.role || 'Guest'}</span>
                  <ChevronDown className="w-3 h-3 text-white/50" />
                </button>

                {showDemoMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#231238] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                      1-Click Instant Demo Login
                    </div>
                    <button
                      onClick={() => {
                        switchDemoUser('ATTENDEE');
                        setShowDemoMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 hover:text-white flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">Attendee (Aarav)</div>
                        <div className="text-[10px] text-white/50">Book tickets, simulated payment</div>
                      </div>
                      {user?.role === 'ATTENDEE' && <span className="text-[#ff5c5c] text-xs">●</span>}
                    </button>
                    <button
                      onClick={() => {
                        switchDemoUser('ORGANIZER');
                        setShowDemoMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 hover:text-white flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">Organizer (PulseLive)</div>
                        <div className="text-[10px] text-white/50">Manage tiers, track revenue</div>
                      </div>
                      {user?.role === 'ORGANIZER' && <span className="text-[#ff5c5c] text-xs">●</span>}
                    </button>
                    <button
                      onClick={() => {
                        switchDemoUser('ADMIN');
                        setShowDemoMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 hover:text-white flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">Platform Administrator</div>
                        <div className="text-[10px] text-white/50">Moderate events, audit logs</div>
                      </div>
                      {user?.role === 'ADMIN' && <span className="text-[#ff5c5c] text-xs">●</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* User Account / Login */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ff5c5c] to-[#9b4dff] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden sm:inline text-xs font-medium text-white/90 max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#231238] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                      <div className="px-3 py-1.5 border-b border-white/10 mb-1">
                        <div className="text-xs font-bold text-white">{user.name}</div>
                        <div className="text-[10px] text-white/50 truncate">{user.email}</div>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="px-3 py-2 text-xs text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#ff8f70]" />
                        My Tickets & Orders
                      </Link>

                      {user.role === 'ORGANIZER' && (
                        <Link
                          to="/organizer"
                          onClick={() => setShowUserMenu(false)}
                          className="px-3 py-2 text-xs text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#ff5c5c]" />
                          Organizer Dashboard
                        </Link>
                      )}

                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="px-3 py-2 text-xs text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-[#ff5c5c]" />
                          Admin Console
                        </Link>
                      )}

                      <div className="border-t border-white/10 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                            navigate('/');
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10 hover:text-red-200 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/auth?mode=login"
                    className="text-xs font-medium text-white/80 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    className="text-xs font-semibold bg-gradient-to-r from-[#ff5c5c] to-[#ff4545] text-white px-3.5 py-1.5 rounded-lg shadow-md shadow-[#ff5c5c]/20 hover:brightness-110 transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ER Diagram Modal */}
      <ERDiagramModal isOpen={showERModal} onClose={() => setShowERModal(false)} />
    </>
  );
};
