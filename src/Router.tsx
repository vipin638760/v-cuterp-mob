import React from 'react';
import { Text, View } from 'react-native';
import { useApp, currentScreen, Screen } from './store';
import { AppShell } from './components/AppShell';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { OrgPulseScreen } from './screens/OrgPulseScreen';
import { BranchDetailScreen } from './screens/BranchDetailScreen';
import { StaffDetailScreen } from './screens/StaffDetailScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { StaffPerformanceScreen } from './screens/StaffPerformanceScreen';
import { PosScreen } from './screens/PosScreen';
import { EntryScreen } from './screens/EntryScreen';
import { PLScreen } from './screens/PLScreen';
import { BranchesScreen } from './screens/BranchesScreen';
import { CustomersScreen } from './screens/CustomersScreen';
import { StaffScreen } from './screens/StaffScreen';
import { MaterialsScreen } from './screens/MaterialsScreen';
import { MaterialMasterScreen } from './screens/MaterialMasterScreen';
import { CashCollectionScreen } from './screens/CashCollectionScreen';
import { OpExpensesScreen } from './screens/OpExpensesScreen';
import { DailyExpensesScreen } from './screens/DailyExpensesScreen';
import { IncentiveScreen } from './screens/IncentiveScreen';
import { MenuConfigScreen } from './screens/MenuConfigScreen';
import { TaskpediaScreen } from './screens/TaskpediaScreen';
import { LeavesScreen } from './screens/LeavesScreen';
import { PayrollScreen } from './screens/PayrollScreen';
import { MasterSetupScreen } from './screens/MasterSetupScreen';
import { DayWorkingScreen } from './screens/DayWorkingScreen';
import { MyTargetScreen } from './screens/MyTargetScreen';
import { MyPayrollScreen } from './screens/MyPayrollScreen';
import { ApplyLeaveScreen } from './screens/ApplyLeaveScreen';
import { colors, fonts } from './theme';

const screenComponent = (s: Screen): React.ReactNode => {
  switch (s) {
    case 'dashboard': return <DashboardScreen />;
    case 'pulse': return <OrgPulseScreen />;
    case 'branch-detail': return <BranchDetailScreen />;
    case 'staff-detail': return <StaffDetailScreen />;
    case 'leaderboard': return <LeaderboardScreen />;
    case 'staff-performance': return <StaffPerformanceScreen />;
    case 'pos': return <PosScreen />;
    case 'entry': return <EntryScreen />;
    case 'pl': return <PLScreen />;
    case 'branches': return <BranchesScreen />;
    case 'customers': return <CustomersScreen />;
    case 'staff': return <StaffScreen />;
    case 'materials': return <MaterialsScreen />;
    case 'material-master': return <MaterialMasterScreen />;
    case 'cash-collection': return <CashCollectionScreen />;
    case 'op-expenses': return <OpExpensesScreen />;
    case 'daily-expenses': return <DailyExpensesScreen />;
    case 'incentive': return <IncentiveScreen />;
    case 'menu-config': return <MenuConfigScreen />;
    case 'taskpedia': return <TaskpediaScreen />;
    case 'leaves': return <LeavesScreen />;
    case 'payroll': return <PayrollScreen />;
    case 'master-setup': return <MasterSetupScreen />;
    case 'day-working': return <DayWorkingScreen />;
    case 'my-target': return <MyTargetScreen />;
    case 'my-payroll': return <MyPayrollScreen />;
    case 'apply-leave': return <ApplyLeaveScreen />;
    default:
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 18 }}>Screen not found</Text>
        </View>
      );
  }
};

export const Router: React.FC = () => {
  const user = useApp(s => s.user);
  const screen = useApp(currentScreen);
  if (!user) return <LoginScreen />;
  return <AppShell>{screenComponent(screen)}</AppShell>;
};
