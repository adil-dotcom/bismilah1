import React, { useState } from 'react';
import { Plus, Search, Calendar } from 'lucide-react';
import AbsenceModal from '../components/AbsenceModal';
import AbsenceList from '../components/AbsenceList';

export default function Absences() {
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');

  const [absences, setAbsences] = useState([
    {
      id: '1',
      employee: 'Marie Secrétaire',
      startDate: '20/03/2024',
      endDate: '22/03/2024',
      reason: 'Congé',
      status: 'En attente'
    }
  ]);

  const handleAbsenceSubmit = (absence: any) => {
    setAbsences([...absences, absence]);
    setIsAbsenceModalOpen(false);
  };

  const handleAbsenceStatusChange = (id: string, status: string) => {
    setAbsences(absences.map(absence => 
      absence.id === id ? { ...absence, status } : absence
    ));
  };

  const filteredAbsences = absences.filter(absence => {
    const matchesSearch = 
      absence.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      absence.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const absenceStart = new Date(absence.startDate.split('/').reverse().join('-'));
    const absenceEnd = new Date(absence.endDate.split('/').reverse().join('-'));
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    const matchesDate = absenceStart >= start && absenceEnd <= end;
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Absences</h2>
        <button 
          onClick={() => setIsAbsenceModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle absence
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Rechercher une absence..."
              />
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
                <span className="text-gray-500">à</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <AbsenceList
            absences={filteredAbsences}
            onStatusChange={handleAbsenceStatusChange}
          />
        </div>
      </div>

      <AbsenceModal
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
        onSubmit={handleAbsenceSubmit}
      />
    </div>
  );
}