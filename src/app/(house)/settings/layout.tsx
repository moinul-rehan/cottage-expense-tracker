import { User, Banknote, Home, ShieldCheck } from "lucide-react";
import { getCurrentProfile } from "@/lib/data/dal";
import { SettingsNav, type SettingsLink } from "./SettingsNav";

const memberLinks: SettingsLink[] = [{ href: "/settings/profile", label: "Profile", icon: User }];
const adminLinks: SettingsLink[] = [
  { href: "/settings/rent", label: "Default Cost", icon: Banknote },
  { href: "/settings/cottage", label: "Cottage Profile", icon: Home },
];
const trailingLinks: SettingsLink[] = [{ href: "/settings/security", label: "Security", icon: ShieldCheck }];

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const links = [
    ...memberLinks,
    ...(profile.role === "super_admin" ? adminLinks : []),
    ...trailingLinks,
  ];

  return (
    <div className="flex flex-col gap-8 sm:flex-row">
      <SettingsNav links={links} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
