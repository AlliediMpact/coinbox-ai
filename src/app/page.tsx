
import {Sidebar, SidebarContent, SidebarTrigger} from '@/components/ui/sidebar';
import SummaryComponent from "@/components/SummaryComponent";
import MembershipManagement from "@/components/MembershipManagement";
import CoinTrading from "@/components/CoinTrading";
import WalletManagement from "@/components/WalletManagement";
import RiskAssessmentTool from "@/components/RiskAssessmentTool";
import ReferralTracking from "@/components/ReferralTracking";

export default function Home() {
  return (
    <div className="flex h-screen">
      <Sidebar>
        <SidebarTrigger />
        <SidebarContent>
          {/* Add your sidebar content here */}
          <div>Sidebar Content</div>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 p-4">
        {/* Main content area */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <MembershipManagement />
          <CoinTrading />
          <WalletManagement />
          <RiskAssessmentTool />
          <ReferralTracking />
        </div>
        <SummaryComponent />
      </main>
    </div>
  );
}

