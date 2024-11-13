import React, { useMemo } from 'react';
import { CreditCard, Clock, Users, UserPlus, History, TrendingUp, TrendingDown } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ConsultationTable from '../components/dashboard/ConsultationTable';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { patients } = useData();

  // Calculs des statistiques
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const consultationsDuJour = [];  // À remplacer par les vraies données
    
    const totalConsultations = consultationsDuJour.length;
    const nouveauxPatients = consultationsDuJour.filter(p => 
      !patients?.find(patient => 
        patient.numeroPatient === p.numeroPatient && 
        patient.derniereConsultation < today
      )
    ).length;
    
    const anciensPatients = totalConsultations - nouveauxPatients;
    const consultationsPayantes = consultationsDuJour.filter(p => 
      p.statut === 'Payé' && parseFloat(p.montant.replace(',', '.')) > 0
    ).length;
    
    const consultationsGratuites = consultationsDuJour.filter(p => 
      p.statut === 'Gratuit'
    ).length;

    const consultationsAnnulees = consultationsDuJour.filter(p => 
      p.statut === 'Annulé'
    ).length;

    const revenueJour = consultationsDuJour
      .filter(p => p.statut === 'Payé')
      .reduce((sum, p) => sum + parseFloat(p.montant.replace(',', '.')), 0);

    // Calculer le revenu d'hier pour la comparaison
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    const revenueHier = 0; // À remplacer par les vraies données

    const revenueChange = revenueHier > 0 
      ? ((revenueJour - revenueHier) / revenueHier) * 100 
      : 100;

    return {
      consultations: {
        total: totalConsultations,
        nouveauxPatients,
        anciensPatients,
        payantes: consultationsPayantes,
        gratuites: consultationsGratuites,
        annulees: consultationsAnnulees
      },
      revenue: {
        total: revenueJour.toFixed(2).replace('.', ','),
        change: revenueChange.toFixed(1),
        dernierPaiement: consultationsDuJour.length > 0 
          ? consultationsDuJour[consultationsDuJour.length - 1].montant 
          : '0,00'
      }
    };
  }, [patients]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<CreditCard className="h-6 w-6 text-white" />}
          iconBgColor="bg-green-500"
          title="Facturation du jour"
        >
          <p className="mt-1 text-xl font-semibold text-gray-900">{stats.revenue.total} Dhs</p>
          <p className="mt-1 text-sm text-gray-600">
            Dernière consultation: {stats.revenue.dernierPaiement} Dhs
          </p>
          <div className="flex items-center mt-1">
            {parseFloat(stats.revenue.change) > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <p className="text-sm text-green-600">+{stats.revenue.change}%</p>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                <p className="text-sm text-red-600">{stats.revenue.change}%</p>
              </>
            )}
          </div>
        </StatCard>

        <StatCard
          icon={<Clock className="h-6 w-6 text-white" />}
          iconBgColor="bg-blue-500"
          title="Consultations payantes"
        >
          <p className="mt-1 text-xl font-semibold text-gray-900">{stats.consultations.payantes}</p>
          <p className="mt-1 text-sm text-blue-600">
            {stats.consultations.total > 0 
              ? `${((stats.consultations.payantes / stats.consultations.total) * 100).toFixed(0)}% du total`
              : '0% du total'
            }
          </p>
        </StatCard>

        <StatCard
          icon={<Users className="h-6 w-6 text-white" />}
          iconBgColor="bg-purple-500"
          title="Statistiques de Consultation"
        >
          <p className="mt-1 text-xl font-semibold text-gray-900">
            Total: {stats.consultations.total}
          </p>
          <div className="mt-1 space-y-1">
            <div className="flex items-center text-sm text-gray-500">
              <UserPlus className="h-4 w-4 mr-1" />
              {stats.consultations.nouveauxPatients} nouveaux patients
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <History className="h-4 w-4 mr-1" />
              {stats.consultations.anciensPatients} anciens patients
            </div>
            <hr className="my-1" />
            <p className="text-sm text-gray-500">
              dont {stats.consultations.gratuites} gratuités
            </p>
            <p className="text-sm text-gray-500">
              {stats.consultations.annulees} rendez-vous annulés
            </p>
          </div>
        </StatCard>
      </div>

      <ConsultationTable visits={[]} />
    </div>
  );
}