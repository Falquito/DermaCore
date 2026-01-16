import { Header } from "@/components/header";
import SideBar from "@/components/sideBar";
import { Footer } from "@/components/footer";
import { SidebarProvider } from "@/components/ui/sidebar-context";

export default function PacientesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Header />
      <SideBar>
        {children}
      </SideBar>
      <Footer />
    </SidebarProvider>
  );
}
