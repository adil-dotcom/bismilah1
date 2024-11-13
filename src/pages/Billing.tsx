import React, { useState } from 'react';
import { Search, Download, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel } from '../utils/excelExport';

interface Invoice {
  id: string;
  patientNumber: string;
  patient: string;
  date: string;
  amount: string;
  status: string;
  statusColor: string;
  paymentType: string;
  mutuelle: {
    active: boolean;
    nom: string;
  };
  lastConsultation: string;
}

export default function Billing() {
  const { hasPermission } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editMutuelle, setEditMutuelle] = useState('');
  const [searchPatient, setSearchPatient] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({
    patientNumber: true,
    patient: true,
    amount: true,
    status: true,
    paymentType: true,
    mutuelle: true,
    lastConsultation: true
  });

  const [savedMutuelles, setSavedMutuelles] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedMutuelles');
    return saved ? JSON.parse(saved) : [
      'CNOPS',
      'CNSS',
      'RMA',
      'SAHAM',
      'AXA'
    ];
  });

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      patientNumber: 'P001',
      patient: 'Marie Durant',
      date: new Date().toLocaleDateString('fr-FR'),
      amount: '850,00',
      status: 'Payée',
      statusColor: 'bg-green-100 text-green-800',
      paymentType: 'Carte Bancaire',
      mutuelle: {
        active: true,
        nom: 'CNOPS'
      },
      lastConsultation: '10/03/2024'
    },
    {
      id: '2',
      patientNumber: 'P002',
      patient: 'Pierre Martin',
      date: '15/03/2024',
      amount: '0',
      status: 'Gratuité',
      statusColor: 'bg-blue-100 text-blue-800',
      paymentType: '-',
      mutuelle: {
        active: false,
        nom: ''
      },
      lastConsultation: '05/03/2024'
    }
  ]);

  const handleAmountChange = (id: string, value: string) => {
    setInvoices(invoices.map(invoice => {
      if (invoice.id === id) {
        const amount = value.trim();
        let status = 'Payée';
        let statusColor = 'bg-green-100 text-green-800';
        let paymentType = invoice.paymentType;
        
        if (amount === '0') {
          status = 'Gratuité';
          statusColor = 'bg-blue-100 text-blue-800';
          paymentType = '-';
        }

        return {
          ...invoice,
          amount,
          status,
          statusColor,
          paymentType
        };
      }
      return invoice;
    }));
    setEditingId(null);
    setEditAmount('');
  };

  const handleMutuelleChange = (id: string, mutuelle: { active: boolean; nom: string }) => {
    setInvoices(invoices.map(invoice => 
      invoice.id === id ? { ...invoice, mutuelle } : invoice
    ));

    // Save new mutuelle if it doesn't exist
    if (mutuelle.active && mutuelle.nom && !savedMutuelles.includes(mutuelle.nom)) {
      const newMutuelles = [...savedMutuelles, mutuelle.nom];
      setSavedMutuelles(newMutuelles);
      localStorage.setItem('savedMutuelles', JSON.stringify(newMutuelles));
    }
  };

  const isDateInRange = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    return date >= start && date <= end;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.patient.toLowerCase().includes(searchPatient.toLowerCase());
    const matchesDate = isDateInRange(invoice.date);
    return matchesSearch && matchesDate;
  });

  const handleExport = () => {
    const columns = [
      { id: 'patientNumber', label: 'N° Patient' },
      { id: 'patient', label: 'Patient' },
      { id: 'amount', label: 'Montant (Dhs)' },
      { id: 'status', label: 'Statut' },
      { id: 'paymentType', label: 'Type de paiement' },
      { id: 'mutuelle', label: 'Mutuelle' },
      { id: 'lastConsultation', label: 'Dernière consultation' }
    ].filter(col => selectedColumns[col.id as keyof typeof selectedColumns]);

    exportToExcel(
      filteredInvoices.map(invoice => ({
        ...invoice,
        mutuelle: invoice.mutuelle.active ? `Oui - ${invoice.mutuelle.nom}` : 'Non'
      })),
      `paiements_${dateRange.startDate}_${dateRange.endDate}`,
      columns
    );
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestion des paiements du {new Date(dateRange.startDate).toLocaleDateString('fr-FR')} au {new Date(dateRange.endDate).toLocaleDateString('fr-FR')}
        </h2>
        {hasPermission('export_data') && (
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download className="h-5 w-5 mr-2" />
            Exporter
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Rechercher un patient..."
              />
            </div>
            <div className="flex items-center space-x-2">
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant (Dhs)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mutuelle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière consultation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.patientNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.patient}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === invoice.id ? (
                      <input
                        type="text"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAmountChange(invoice.id, editAmount);
                          }
                        }}
                        className="block w-24 px-3 py-1 border border-gray-300 rounded-md text-sm"
                        placeholder="0,00"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-sm text-gray-900 cursor-pointer"
                        onClick={() => {
                          setEditingId(invoice.id);
                          setEditAmount(invoice.amount);
                        }}
                      >
                        {invoice.amount}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.statusColor}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.amount === '0' ? '-' : (
                      <select
                        className="block w-full pl-3 pr-10 py-1 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={invoice.paymentType}
                        onChange={(e) => {
                          setInvoices(invoices.map(inv => 
                            inv.id === invoice.id ? { ...inv, paymentType: e.target.value } : inv
                          ));
                        }}
                      >
                        <option value="Carte Bancaire">Carte Bancaire</option>
                        <option value="Espèces">Espèces</option>
                        <option value="Virement">Virement</option>
                        <option value="Chèque">Chèque</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={invoice.mutuelle.active}
                        onChange={(e) => handleMutuelleChange(invoice.id, {
                          active: e.target.checked,
                          nom: invoice.mutuelle.nom
                        })}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {invoice.mutuelle.active && (
                        <select
                          value={invoice.mutuelle.nom}
                          onChange={(e) => handleMutuelleChange(invoice.id, {
                            active: true,
                            nom: e.target.value
                          })}
                          className="block w-full pl-3 pr-10 py-1 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="">Sélectionner une mutuelle</option>
                          {savedMutuelles.map((mutuelle) => (
                            <option key={mutuelle} value={mutuelle}>{mutuelle}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.lastConsultation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Options d'exportation</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Sélectionnez les colonnes à exporter :</p>
                <div className="space-y-2">
                  {Object.entries(selectedColumns).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setSelectedColumns({
                          ...selectedColumns,
                          [key]: e.target.checked
                        })}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {key === 'patientNumber' ? 'N° Patient' :
                         key === 'patient' ? 'Patient' :
                         key === 'amount' ? 'Montant' :
                         key === 'status' ? 'Statut' :
                         key === 'paymentType' ? 'Type de paiement' :
                         key === 'mutuelle' ? 'Mutuelle' :
                         'Dernière consultation'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Exporter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}