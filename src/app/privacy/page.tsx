import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/legal-page";
import { appConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${appConfig.name} and the ${appConfig.name} browser extension collect, use, and protect information.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`This policy covers the ${appConfig.name} website and the ${appConfig.name} browser extension.`}
      updated="13 September 2026"
    >
      <section className="flex flex-col gap-3">
        <h2>1. Who we are</h2>
        <p>
          {appConfig.name} (&ldquo;we,&rdquo; &ldquo;us&rdquo;) is a creator toolkit operated by
          Mannu Yadav. The service includes this website at{" "}
          <a href={appConfig.url}>{appConfig.url}</a> and the optional{" "}
          <Link href="/extension">{appConfig.name} browser extension</Link>.
        </p>
        <p>
          Questions about privacy: see <Link href="/support">Support</Link>.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>2. What this product does</h2>
        <p>
          {appConfig.name} helps creators pick giveaway winners from public comments, download
          thumbnails and public videos where supported, process media in the browser, and use related
          creator utilities. The extension runs those core flows on pages you already have open.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>3. Information we process</h2>
        <p>Depending on which feature you use, we may process:</p>
        <ul>
          <li>
            <strong>URLs and page context you provide</strong> — for example a YouTube, Reddit, or
            Instagram link you paste, or the URL of the tab the extension is reading so it can open
            the right tool.
          </li>
          <li>
            <strong>Public social content fetched on your behalf</strong> — such as public comments,
            titles, thumbnails, and related metadata returned by platform APIs or public endpoints.
            This can include display names / handles of comment authors when you run a giveaway draw.
          </li>
          <li>
            <strong>Draw results</strong> — eligible-entry metadata, filters you chose, winners, and
            a verifiable Draw ID / signed result token so others can check a giveaway outcome.
          </li>
          <li>
            <strong>Media files you choose to process</strong> — many image, video, and audio tools
            run entirely in your browser via Canvas / WebAssembly and do not upload the file to our
            servers. Tools that need a platform API or a download proxy send only what that feature
            requires.
          </li>
          <li>
            <strong>Technical request data</strong> — standard server logs such as IP address,
            user-agent, timestamps, and error diagnostics needed to operate and secure the service.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> sell personal information. We do not use the extension to
          inject ads or track your general browsing across unrelated sites.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>4. Browser extension specifics</h2>
        <ul>
          <li>
            The extension requests only the permissions needed for its features (
            <code>activeTab</code>, <code>scripting</code>, <code>webRequest</code>,{" "}
            <code>downloads</code>, <code>offscreen</code>, plus host access to supported platforms
            and {appConfig.name}&rsquo;s own origin).
          </li>
          <li>
            On YouTube, content scripts and request observation are used so the extension can detect
            the current video and list stream URLs that your own browser player has already
            requested while you watch.
          </li>
          <li>
            API secrets (for example Reddit or Vimeo credentials) stay on our servers. They are never
            bundled inside the extension.
          </li>
          <li>
            Local media muxing uses a bundled ffmpeg.wasm build. The extension does not execute
            remotely hosted code.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>5. How we use information</h2>
        <ul>
          <li>To provide the feature you asked for (fetch comments, run a draw, download media, etc.).</li>
          <li>To generate shareable / verifiable draw result pages.</li>
          <li>To keep the service reliable, secure, and abuse-resistant.</li>
          <li>To improve the product based on aggregate technical diagnostics — not to profile you for advertising.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>6. Third parties</h2>
        <p>
          When you use a platform-backed tool, we call that platform&rsquo;s official APIs or public
          endpoints (for example YouTube Data API, Reddit API). Those services process the request
          under their own terms and privacy policies. We only send what is needed for the feature.
        </p>
        <p>
          Hosting / infrastructure providers that run this website may process technical request
          data as part of delivering the service.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>7. Retention</h2>
        <p>
          Ephemeral processing data is kept only as long as needed to complete a request. Shareable
          draw verification tokens / result pages may remain available so winners and audiences can
          verify an outcome. Server logs are retained for a limited operational period, then deleted
          or aggregated.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>8. Your choices</h2>
        <ul>
          <li>You can stop using the website or uninstall the extension at any time.</li>
          <li>Do not submit private or sensitive personal data into tools that publish shareable results.</li>
          <li>
            For access, correction, or deletion requests related to data we control, contact us via{" "}
            <Link href="/support">Support</Link>.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>9. Children</h2>
        <p>
          {appConfig.name} is not directed at children under 13 (or the equivalent minimum age in
          your region). Do not use the service if you are under that age.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>10. Changes</h2>
        <p>
          We may update this policy as the product changes. The &ldquo;Last updated&rdquo; date at
          the top will change when we do. Continued use after an update means you accept the revised
          policy.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>11. Related</h2>
        <p>
          See also our <Link href="/terms">Terms of Use</Link> and{" "}
          <Link href="/support">Support</Link> page.
        </p>
      </section>
    </LegalPage>
  );
}
