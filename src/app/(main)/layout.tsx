import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/shared/sidebar";
import { NotificationBell } from "@/components/shared/notification-bell";
import { UserMenu } from "@/components/shared/user-menu";
import { MobileNav } from "@/components/shared/mobile-nav";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: {
    default: `Dashboard | ${APP_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
};

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isAdmin={isAdmin} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <MobileNav isAdmin={isAdmin} />
            <h1 className="text-sm font-medium text-gray-500">
              <span className="font-urdu">السلام علیکم</span> {session.user.name?.split(" ")[0]}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
