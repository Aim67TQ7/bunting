import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <PageLayout title="Privacy Policy">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: January 28, 2026
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bunting Magnetics Co. ("Bunting," "we," "us," or "our") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use BuntingGPT and related services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may collect the following types of information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Account Information:</strong> Name, email address, employee ID, department, and job title when you create an account or are provisioned access.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with BuntingGPT, including queries, conversation history, and feature usage.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers.</li>
              <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to enhance your experience and gather usage analytics.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. How We Use Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide, maintain, and improve BuntingGPT services</li>
              <li>Personalize your experience and deliver relevant content</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Monitor and analyze usage patterns to enhance functionality</li>
              <li>Ensure security and prevent unauthorized access</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption in transit and at rest, access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed">
              BuntingGPT uses cookies and similar tracking technologies to remember your preferences, analyze site traffic, and improve our services. You can control cookie settings through your browser, but disabling cookies may affect functionality.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may integrate with third-party services (such as AI providers, analytics tools, and authentication services) to deliver our services. These third parties have their own privacy policies governing the use of your information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may have rights regarding your personal data, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access to your personal data</li>
              <li>Correction of inaccurate data</li>
              <li>Deletion of your data (subject to legal requirements)</li>
              <li>Data portability</li>
              <li>Opt-out of certain data processing</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or your personal data, please contact us:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mt-2">
              <p className="text-foreground font-medium">Bunting Magnetics Co.</p>
              <p className="text-muted-foreground">500 S. Spencer Road</p>
              <p className="text-muted-foreground">Newton, KS 67114</p>
              <p className="text-muted-foreground mt-2">Email: privacy@bfrp.com</p>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
