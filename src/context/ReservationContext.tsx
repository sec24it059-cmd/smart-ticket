import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api.ts';

export interface ActiveHold {
  reservationId: string;
  reservationNumber: string;
  eventTitle: string;
  totalAmount: number;
  expiresAt: string;
}

interface ReservationContextType {
  activeHold: ActiveHold | null;
  secondsRemaining: number;
  setActiveHold: (hold: ActiveHold | null) => void;
  clearHold: () => void;
  formatTime: (seconds: number) => string;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeHold, setActiveHoldState] = useState<ActiveHold | null>(() => {
    try {
      const stored = localStorage.getItem('ticketnest_active_hold');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (new Date(parsed.expiresAt).getTime() > Date.now()) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const setActiveHold = (hold: ActiveHold | null) => {
    setActiveHoldState(hold);
    if (hold) {
      localStorage.setItem('ticketnest_active_hold', JSON.stringify(hold));
    } else {
      localStorage.removeItem('ticketnest_active_hold');
    }
  };

  const clearHold = () => {
    setActiveHold(null);
    setSecondsRemaining(0);
  };

  useEffect(() => {
    if (!activeHold) {
      setSecondsRemaining(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.floor((new Date(activeHold.expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        clearHold();
      } else {
        setSecondsRemaining(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeHold]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ReservationContext.Provider
      value={{
        activeHold,
        secondsRemaining,
        setActiveHold,
        clearHold,
        formatTime,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};
