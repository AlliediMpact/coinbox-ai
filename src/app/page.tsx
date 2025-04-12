import {Sidebar, SidebarContent, SidebarTrigger} from '@/components/ui/sidebar';
import SummaryComponent from "@/components/SummaryComponent";

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
        <div>Main Content</div>
        <SummaryComponent />
      </main>
    </div>
  );
}
