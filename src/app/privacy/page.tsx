import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy - Cottage",
  description: "How Cottage collects, uses, and protects your information.",
};

const LAST_UPDATED = "July 28, 2026";
const CONTACT_EMAIL = "rehan.moinul.10@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <Logo size={30} />
            Cottage
          </Link>
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
            Back to home
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16 sm:py-20">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          </div>

          <Section title="Overview">
            <p>
              Cottage is a shared-house expense manager built for roommates to track meals, utilities, and
              deposits together. This policy explains what information we collect when you use Cottage, how
              it&apos;s used, and who can see it. We don&apos;t sell your data, and we don&apos;t run
              advertising or analytics trackers of any kind - Cottage only collects what it needs to function.
            </p>
          </Section>

          <Section title="Information we collect">
            <p>
              <strong className="text-foreground">Account information.</strong> When you sign up or a Cottage
              admin invites you, we store your name, email address, and role. You can optionally add a phone
              number, address, hometown, gender, and profile photo from your Settings page.
            </p>
            <p>
              <strong className="text-foreground">Household records.</strong> Anything you or another member
              of your cottage enters - meals, bazaar (grocery) costs, utility expenses, deposits, notices,
              rent assignments, and settlements - is stored so the app can calculate balances and statements
              for everyone in that cottage.
            </p>
            <p>
              <strong className="text-foreground">Authentication data.</strong> We use session cookies to keep
              you signed in. If you sign up with Google, we receive your name, email, and profile photo from
              Google&apos;s sign-in flow.
            </p>
            <p>
              <strong className="text-foreground">What we don&apos;t collect.</strong> Cottage has no
              third-party analytics, advertising trackers, or push-notification services. We don&apos;t collect
              your location, browsing history outside the app, or contacts.
            </p>
          </Section>

          <Section title="How we use your information">
            <p>
              We use your information solely to operate Cottage: calculating meal rates and balances, showing
              utility statements, sending in-app notifications to members of your cottage, and letting your
              cottage&apos;s admin manage membership and permissions. We do not use your data for advertising,
              and we do not share it with data brokers or marketers.
            </p>
          </Section>

          <Section title="Who can see your information">
            <p>
              Your name, financial records, and household activity are visible only to the other members of
              your own cottage - never to members of a different cottage. Your cottage&apos;s super admin can
              see everyone&apos;s records within that cottage in order to manage settlements and permissions.
              Optional profile fields like phone number and address are visible to your cottage members so
              roommates can reach each other.
            </p>
          </Section>

          <Section title="Data storage and security">
            <p>
              Cottage data is stored with Supabase, a hosted PostgreSQL provider, with row-level security
              policies that restrict every record to members of the cottage it belongs to. Data is encrypted
              in transit (HTTPS) and at rest by our hosting providers. Profile photos are stored in Supabase
              Storage. No system is perfectly secure, but we take reasonable technical measures to protect
              your information from unauthorized access.
            </p>
          </Section>

          <Section title="Data retention and deletion">
            <p>
              Financial and household records (meals, expenses, deposits, statements) are kept indefinitely
              once created, even if a member is later removed from a cottage - this preserves an accurate
              shared history for the household. Removing a member locks their login and hides their profile
              from new activity, but does not delete their past records. If you&apos;d like your personal
              account information deleted entirely, contact us using the details below.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Cottage uses only the cookies necessary to keep you signed in and remember your session. We
              don&apos;t use cookies for advertising or cross-site tracking.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              Cottage is intended for adults managing a shared household and is not directed at children under
              13. We do not knowingly collect information from children under 13.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If we make material changes to this policy, we&apos;ll update the &quot;Last updated&quot; date
              above. Continued use of Cottage after a change means you accept the updated policy.
            </p>
          </Section>

          <Section title="Contact us">
            <p>
              Questions about this policy, or a request to access or delete your data? Email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Logo size={22} />
            Cottage
          </div>
          <p>Shared-house expense manager for every Cottage.</p>
        </div>
      </footer>
    </div>
  );
}
