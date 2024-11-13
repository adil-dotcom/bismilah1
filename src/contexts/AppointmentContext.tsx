import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Appointment } from '../components/calendar/types';

interface AppointmentContextType {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  getAppointmentsByDate: (date: Date) => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
  isTimeSlotAvailable: (date: Date, time: string, excludeId?: string) => boolean;
}

const AppointmentContext = createContext<AppointmentContextType | null>(null);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

interface AppointmentProviderProps {
  children: React.ReactNode;
}

export const AppointmentProvider = ({ children }: AppointmentProviderProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Charger les rendez-vous depuis le localStorage
  useEffect(() => {
    const savedAppointments = localStorage.getItem('appointments');
    if (savedAppointments) {
      try {
        const parsed = JSON.parse(savedAppointments);
        // Convertir les dates string en objets Date
        const validAppointments = parsed.map((apt: any) => ({
          ...apt,
          time: new Date(apt.time).toISOString()
        }));
        setAppointments(validAppointments);
      } catch (error) {
        console.error('Erreur lors du chargement des rendez-vous:', error);
        setAppointments([]);
      }
    }
  }, []);

  // Sauvegarder les rendez-vous dans le localStorage
  useEffect(() => {
    try {
      localStorage.setItem('appointments', JSON.stringify(appointments));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des rendez-vous:', error);
    }
  }, [appointments]);

  const addAppointment = (appointment: Appointment) => {
    setAppointments(prev => {
      // S'assurer que la date est au bon format
      const formattedAppointment = {
        ...appointment,
        time: new Date(appointment.time).toISOString()
      };
      return [...prev, formattedAppointment];
    });
  };

  const updateAppointment = (id: string, updatedData: Partial<Appointment>) => {
    setAppointments(prev => {
      return prev.map(apt => {
        if (apt.id === id) {
          const updated = {
            ...apt,
            ...updatedData,
            // S'assurer que la date est au bon format si elle est mise à jour
            time: updatedData.time ? new Date(updatedData.time).toISOString() : apt.time
          };
          return updated;
        }
        return apt;
      });
    });
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id));
  };

  const getAppointmentsByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.time);
      return format(aptDate, 'yyyy-MM-dd') === dateStr;
    });
  };

  const getAppointmentById = (id: string) => {
    return appointments.find(apt => apt.id === id);
  };

  const isTimeSlotAvailable = (date: Date, time: string, excludeId?: string) => {
    const dateTimeToCheck = format(date, "yyyy-MM-dd HH:mm");
    
    return !appointments.some(apt => {
      if (excludeId && apt.id === excludeId) return false;
      
      const aptDate = parseISO(apt.time);
      const aptDateTime = format(aptDate, "yyyy-MM-dd HH:mm");
      
      return aptDateTime === dateTimeToCheck;
    });
  };

  return (
    <AppointmentContext.Provider value={{
      appointments,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      getAppointmentsByDate,
      getAppointmentById,
      isTimeSlotAvailable
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};