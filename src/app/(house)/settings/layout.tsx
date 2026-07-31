import { getCurrentProfile } from "@/lib/data/dal";
import { SettingsNav, type SettingsLink } from "./SettingsNav";

const memberLinks: SettingsLink[] = [{ href: "/settings/profile", label: "Profile", icon: "user" }];
const adminLinks: SettingsLink[] = [
  { href: "/settings/rent", label: "Default Cost", icon: "banknote" },
  { href: "/settings/cottage", label: "Cottage Profile", icon: "home" },
];
const trailingLinks: SettingsLink[] = [{ href: "/settings/security", label: "Security", icon: "shield-check" }];

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
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
      <SettingsNav links={links} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
