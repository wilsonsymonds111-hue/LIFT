import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-extrabold text-foreground">Privacy Policy</h1>
      </div>

      <div className="px-5 pb-10 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p className="text-xs">Last updated: June 20, 2026</p>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">1. Introduction</h2>
          <p>
            This Privacy Policy explains how we collect, use, store, and share your personal data when you use this application. We are committed to protecting your privacy and handling your data transparently and in compliance with applicable data protection laws.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">2. Data We Collect</h2>
          <p>We collect the following categories of data:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Profile Information:</strong> Name, email address, profile photo, account credentials.</li>
            <li><strong>Fitness & Workout Data:</strong> Exercise history, weights lifted, repetitions, sets, workout templates, split configurations, progress data, and exercise preferences.</li>
            <li><strong>Device Information:</strong> Device type, operating system, browser type, screen resolution, and language settings.</li>
            <li><strong>Usage Data:</strong> Features used, pages visited, interactions with the application, session duration, and navigation patterns.</li>
            <li><strong>Authentication Data:</strong> Login credentials (securely hashed), session tokens, and authentication timestamps.</li>
            <li><strong>User-Generated Content:</strong> Profile photos you upload, messages sent to our support/feedback system, and any other content you submit.</li>
            <li><strong>Local Storage Data:</strong> Application preferences (dark mode, active tab), split cycle configurations, and cached data stored on your device.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">3. How We Use Your Data</h2>
          <p>We use your data for the following purposes:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Providing and personalizing the application's core functionality</li>
            <li>Tracking workout progress and generating performance insights</li>
            <li>Generating AI-powered exercise recommendations, progression targets, and instructional content</li>
            <li>Authenticating your account and maintaining session security</li>
            <li>Improving application features and user experience through analytics</li>
            <li>Responding to your feedback and support requests</li>
            <li>Complying with legal obligations</li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">4. AI Data Processing</h2>
          <p>
            This application uses artificial intelligence services to generate content including exercise instructions, anatomical illustrations, muscle group analysis, and progression targets. When you view an exercise, the exercise name may be sent to third-party AI providers for processing. No personal identifiers are included in these AI requests. AI-generated content is stored in our database and may be served to other users who view the same exercise.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">5. Data Storage & Security</h2>
          <p>
            Your data is stored on secure cloud infrastructure with industry-standard encryption at rest and in transit. We implement reasonable technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. Guest users' data is stored locally on their device and on our servers in temporary sessions.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">6. Third-Party Services</h2>
          <p>We use the following third-party services that may process your data:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>AI/LLM Providers:</strong> Exercise names are sent for generating instructions, muscle analysis, and images. No personal data is included.</li>
            <li><strong>Cloud Infrastructure:</strong> Application hosting, database storage, and file storage for profile photos and uploaded content.</li>
            <li><strong>Authentication Services:</strong> Secure account management and session handling.</li>
            <li><strong>Analytics:</strong> Anonymous usage data for application improvement.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">7. Cookies & Tracking</h2>
          <p>
            We use essential cookies and local storage for authentication, session management, and application preferences (such as dark mode and active tab selection). We do not use advertising cookies or third-party tracking cookies for marketing purposes. Analytics data is collected anonymously and is not linked to individual user identities.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">8. Data Sharing</h2>
          <p>We do not sell your personal data. We may share your data only:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>With service providers who process data on our behalf (hosting, AI, authentication)</li>
            <li>If required by law, court order, or government regulation</li>
            <li>To protect the rights, property, or safety of our users or the public</li>
            <li>With your explicit consent</li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">9. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to provide services. You may delete your account at any time through the Profile menu, which will permanently remove your data from our servers. Guest user data stored locally on the device can be cleared through the Profile menu. Some anonymized or aggregated data may be retained for analytical purposes.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">10. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (available via Profile → Delete Account)</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability (export your workout data)</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">11. Children's Privacy</h2>
          <p>
            This application is not intended for use by individuals under the age of 13. We do not knowingly collect personal data from children under 13. If we become aware that a child under 13 has provided personal data, we will delete it promptly.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">12. International Data Transfers</h2>
          <p>
            Your data may be stored and processed in countries other than your country of residence. We take appropriate safeguards to ensure your data remains protected in accordance with this Privacy Policy and applicable data protection laws.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of material changes through the application. Continued use after changes constitutes acceptance of the updated policy.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">14. Contact</h2>
          <p>
            For privacy-related inquiries, data requests, or concerns, please use the Feedback & Support feature within the application.
          </p>
        </div>

        {/* Privacy Nutrition Label */}
        <div className="mt-8">
          <h2 className="font-bold text-foreground text-lg mb-4 border-t border-border pt-6">App Privacy Nutrition Label</h2>
          <p className="mb-4">This label maps data types collected by this application, as required by Apple App Store and Google Play Store guidelines.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-bold text-foreground">Data Type</th>
                  <th className="py-2 px-3 font-bold text-foreground">Purpose</th>
                  <th className="py-2 px-3 font-bold text-foreground">Linked to Identity</th>
                  <th className="py-2 px-3 font-bold text-foreground">Used for Tracking</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Contact Info (Name, Email)', 'Account & Authentication', 'Yes', 'No'],
                  ['Profile Photo', 'App Functionality', 'Yes', 'No'],
                  ['Health & Fitness Data', 'App Functionality, Analytics', 'Yes', 'No'],
                  ['User Content (Photos, Messages)', 'App Functionality, Support', 'Yes', 'No'],
                  ['Identifiers (User ID, Device ID)', 'Analytics, App Functionality', 'Yes', 'No'],
                  ['Usage Data', 'Analytics, Product Improvement', 'No', 'No'],
                  ['Diagnostics (Crash Data, Performance)', 'Analytics', 'No', 'No'],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-foreground font-medium">{row[0]}</td>
                    <td className="py-2 px-3">{row[1]}</td>
                    <td className="py-2 px-3">{row[2]}</td>
                    <td className="py-2 px-3">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}