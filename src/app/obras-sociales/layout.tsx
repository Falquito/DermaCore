import { Header } from "@/components/header";
import SideBar from "@/components/sideBar";
import { SidebarProvider } from "@/components/ui/sidebar-context";
import { ProtectedPage } from "@/components/auth/ProtectedPage";

export default function ObrasSocialesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedPage>
      <SidebarProvider>
        <Header />
        <SideBar>
          {children}
        </SideBar>
      </SidebarProvider>
    </ProtectedPage>
  );
}

