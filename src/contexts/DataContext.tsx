import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { saveToLocalStorage, loadFromLocalStorage, exportData } from '../utils/storage';

// Types for all data
interface Patient {
  id: string;
  numeroPatient: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  ville: string;
  cin: string;
  dateNaissance: string;
  age: string;
  mutuelle: {
    active: boolean;
    nom: string;
  };
  antecedents: string[];
  derniereConsultation: string;
  prochainRendezVous: string;
  nombreConsultations: number;
}

interface Appointment {
  id: string;
  patientId: string;
  patient: string;
  time: string;
  duration: string;
  type: string;
  source: string;
  status: string;
  contact?: string;
  location?: string;
  videoLink?: string;
}

interface DataContextType {
  patients: Patient[];
  appointments: Appointment[];
  addPatient: (patient: Omit<Patient, 'id' | 'numeroPatient'>) => string;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => string;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
  getAppointmentById: (id: string) => Appointment | undefined;
  exporterDonnees: () => void;
  importerDonnees: (file: File) => Promise<void>;
  reinitialiserDonnees: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Chargement initial des données
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      setPatients(savedData.patients || []);
      setAppointments(savedData.appointments || []);
    }
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    const data = { patients, appointments };
    saveToLocalStorage(data);
  }, [patients, appointments]);

  const addPatient = (patientData: Omit<Patient, 'id' | 'numeroPatient'>) => {
    const id = crypto.randomUUID();
    const numeroPatient = `P${(patients.length + 1).toString().padStart(3, '0')}`;
    
    const newPatient: Patient = {
      ...patientData,
      id,
      numeroPatient,
      derniereConsultation: format(new Date(), 'dd/MM/yyyy'),
      prochainRendezVous: '-',
      nombreConsultations: 0
    };

    setPatients(prev => [...prev, newPatient]);
    return id;
  };

  const updatePatient = (id: string, patientData: Partial<Patient>) => {
    setPatients(prev => prev.map(patient => 
      patient.id === id ? { ...patient, ...patientData } : patient
    ));

    // Mettre à jour les rendez-vous associés si nécessaire
    if (patientData.nom || patientData.prenom || patientData.telephone) {
      setAppointments(prev => prev.map(apt => {
        if (apt.patientId === id) {
          const updatedApt: Partial<Appointment> = {};
          if (patientData.nom || patientData.prenom) {
            const patient = patients.find(p => p.id === id);
            updatedApt.patient = `${patientData.nom || patient?.nom} ${patientData.prenom || patient?.prenom}`;
          }
          if (patientData.telephone) {
            updatedApt.contact = patientData.telephone;
          }
          return { ...apt, ...updatedApt };
        }
        return apt;
      }));
    }
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(patient => patient.id !== id));
    setAppointments(prev => prev.filter(apt => apt.patientId !== id));
  };

  const addAppointment = (appointmentData: Omit<Appointment, 'id'>) => {
    const id = crypto.randomUUID();
    const newAppointment: Appointment = {
      ...appointmentData,
      id
    };

    setAppointments(prev => [...prev, newAppointment]);

    // Mettre à jour les informations du patient
    if (appointmentData.patientId) {
      setPatients(prev => prev.map(patient => {
        if (patient.id === appointmentData.patientId) {
          return {
            ...patient,
            nombreConsultations: patient.nombreConsultations + 1,
            derniereConsultation: format(new Date(appointmentData.time), 'dd/MM/yyyy'),
            prochainRendezVous: format(new Date(appointmentData.time), 'dd/MM/yyyy HH:mm')
          };
        }
        return patient;
      }));
    }

    return id;
  };

  const updateAppointment = (id: string, appointmentData: Partial<Appointment>) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, ...appointmentData } : apt
    ));

    // Mettre à jour les informations du patient si nécessaire
    const appointment = appointments.find(apt => apt.id === id);
    if (appointment && appointmentData.time) {
      setPatients(prev => prev.map(patient => {
        if (patient.id === appointment.patientId) {
          return {
            ...patient,
            prochainRendezVous: format(new Date(appointmentData.time), 'dd/MM/yyyy HH:mm')
          };
        }
        return patient;
      }));
    }
  };

  const deleteAppointment = (id: string) => {
    const appointment = appointments.find(apt => apt.id === id);
    setAppointments(prev => prev.filter(apt => apt.id !== id));

    // Mettre à jour les informations du patient
    if (appointment?.patientId) {
      setPatients(prev => prev.map(patient => {
        if (patient.id === appointment.patientId) {
          return {
            ...patient,
            nombreConsultations: Math.max(0, patient.nombreConsultations - 1)
          };
        }
        return patient;
      }));
    }
  };

  const getPatientById = (id: string) => {
    return patients.find(patient => patient.id === id);
  };

  const getAppointmentById = (id: string) => {
    return appointments.find(apt => apt.id === id);
  };

  const exporterDonnees = () => {
    const data = {
      patients,
      appointments,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    exportData(data);
  };

  const importerDonnees = async (file: File) => {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      if (!importedData.version || !importedData.exportDate) {
        throw new Error('Format de fichier invalide');
      }

      setPatients(importedData.patients || []);
      setAppointments(importedData.appointments || []);

      alert('Données importées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import des données');
    }
  };

  const reinitialiserDonnees = () => {
    setPatients([]);
    setAppointments([]);
    localStorage.removeItem('cabinet_medical_data');
    alert('Les données ont été réinitialisées');
  };

  return (
    <DataContext.Provider value={{
      patients,
      appointments,
      addPatient,
      updatePatient,
      deletePatient,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      getPatientById,
      getAppointmentById,
      exporterDonnees,
      importerDonnees,
      reinitialiserDonnees
    }}>
      {children}
    </DataContext.Provider>
  );
}