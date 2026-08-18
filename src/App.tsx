import React, { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useTripStore } from './store/useTripStore';
import { useExpenseStore } from './store/useExpenseStore';
import { useSettlementStore } from './store/useSettlementStore';
import { useUiStore } from './store/useUiStore';
import { IosFrame } from './components/ios/IosFrame';
import { TripListView } from './components/trips/TripListView';
import { ExpenseListView } from './components/expenses/ExpenseListView';
import { MySpendView } from './components/myspend/MySpendView';
import { SettleUpView } from './components/settle/SettleUpView';
import { AddExpenseModal } from './components/expenses/modals/AddExpenseModal';
import { CreateTripModal } from './components/trips/CreateTripModal';
import { MemberManagerModal } from './components/trips/MemberManagerModal';
import { AuthPersonaModal } from './components/auth/AuthPersonaModal';
import { ExportReportModal } from './components/export/ExportReportModal';
import { AuditLogModal } from './components/audit/AuditLogModal';
import { Toaster } from 'sonner';

export const App: React.FC = () => {
  const { initializeAuth } = useAuthStore();
  const { initializeTrips, activeTrip, isLoading } = useTripStore();
  const { loadExpenses } = useExpenseStore();
  const { loadSettlements } = useSettlementStore();
  const { activeTab } = useUiStore();

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      await initializeTrips();
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTrip) {
      loadExpenses(activeTrip.id);
      loadSettlements(activeTrip.id);
    }
  }, [activeTrip]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-3 font-sans">
        <div className="w-10 h-10 border-3 border-ios-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-zinc-400">Loading TravelSplit iOS...</p>
      </div>
    );
  }

  return (
    <>
      <IosFrame>
        {activeTab === 'trips' && <TripListView />}
        {activeTab === 'expenses' && <ExpenseListView />}
        {activeTab === 'myspend' && <MySpendView />}
        {activeTab === 'settle' && <SettleUpView />}
      </IosFrame>

      {/* Modals & Drawers */}
      <AddExpenseModal />
      <CreateTripModal />
      <MemberManagerModal />
      <AuthPersonaModal />
      <ExportReportModal />
      <AuditLogModal />

      {/* iOS styled Toaster */}
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'rounded-ios font-sans text-xs shadow-ios-float',
          style: {
            background: 'rgba(28, 28, 30, 0.95)',
            color: '#ffffff',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }}
      />
    </>
  );
};

export default App;
