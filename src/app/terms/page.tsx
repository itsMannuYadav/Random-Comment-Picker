import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/legal-page";
import { appConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms for using the ${appConfig.name} website and browser extension.`,
};

export default function TermsOfUsePage() {
  return (
    <LegalPage
      title="Terms of Use"
      description={`These terms apply to the ${appConfig.name} website and the ${appConfig.name} browser extension.`}
      updated="13 September 2026"
    >
      <section className="flex flex-col gap-3">
        <h2>1. Agreement</h2>
        <p>
          By using {appConfig.name} (the website at <a href={appConfig.url}>{appConfig.url}</a>{" "}
          and/or the browser extension), you agree to these Terms of Use and our{" "}
          <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the service.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>2. What {appConfig.name} provides</h2>
        <p>
          {appConfig.name} is a creator toolkit: comment giveaway picking, thumbnail and video
          utilities, browser-side media tools, and related helpers. Features may change, be limited
          by platform APIs, or be marked &ldquo;coming soon.&rdquo;
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>3. Your responsibilities</h2>
        <ul>
          <li>Use the service only for lawful purposes.</li>
          <li>
            Respect each platform&rsquo;s terms of service (YouTube, Reddit, Instagram, Vimeo, and
            others). You are responsible for how you use content you access or download.
          </li>
          <li>
            Only download or redistribute media you have the right to use. Do not use {appConfig.name}{" "}
            to infringe copyrights or bypass access controls you are not authorized to bypass.
          </li>
          <li>
            Do not abuse APIs, attempt to disrupt the service, reverse-engineer secrets, or use the
            product to harass others.
          </li>
          <li>
            Giveaway operators are responsible for their own contest rules, eligibility, and local
            laws. Verifiable draws help transparency; they do not replace your legal obligations.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>4. Third-party platforms</h2>
        <p>
          {appConfig.name} relies on third-party platforms and APIs. We do not control those
          services. Outages, rate limits, policy changes, or API responses can affect features
          without notice.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>5. No warranty</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; We make no
          warranties that it will be uninterrupted, error-free, or fit for a particular purpose.
          Draw verification helps detect tampering with signed results; it does not guarantee
          contest legality or platform compliance.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>6. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Mannu Yadav and {appConfig.name} are not liable
          for indirect, incidental, special, consequential, or punitive damages, or for lost
          profits, data, or goodwill, arising from your use of the service.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>7. Intellectual property</h2>
        <p>
          {appConfig.name} branding, UI, and original code are owned by their respective owners.
          Platform content remains owned by its rightsholders. These terms do not grant you rights
          to that third-party content.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>8. Changes and termination</h2>
        <p>
          We may update these terms or discontinue features at any time. Continued use after changes
          means you accept the updated terms. We may suspend access for abuse or legal risk.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>9. Contact</h2>
        <p>
          Questions about these terms: <Link href="/support">Support</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
