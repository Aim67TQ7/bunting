import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <PageLayout title="Terms of Use">
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
            <h1 className="text-3xl font-bold text-foreground">Terms of Use</h1>
            <p className="text-muted-foreground">
              Last updated: January 28, 2026
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using BuntingGPT (the "Service"), you agree to be bound by these Terms of Use. If you do not agree to these terms, you may not use the Service. Bunting Magnetics Co. ("Bunting," "we," "us," or "our") reserves the right to modify these terms at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Use of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              BuntingGPT is provided as an internal tool to assist Bunting employees and authorized users. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Use the Service only for lawful, authorized business purposes</li>
              <li>Not share your account credentials with unauthorized individuals</li>
              <li>Not attempt to circumvent security measures or access restrictions</li>
              <li>Report any security vulnerabilities or suspicious activity</li>
              <li>Comply with all applicable company policies and procedures</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              Access to BuntingGPT requires an authorized account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify IT immediately if you suspect unauthorized access.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, features, and functionality of BuntingGPT, including but not limited to software, text, graphics, logos, and trademarks, are owned by Bunting Magnetics Co. or its licensors and are protected by intellectual property laws. Unauthorized use, reproduction, or distribution is prohibited.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. AI-Generated Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              BuntingGPT utilizes artificial intelligence to generate responses. While we strive for accuracy, AI-generated content may contain errors or inaccuracies. Users should verify critical information and exercise professional judgment. AI responses should not be considered as professional, legal, or medical advice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Disclaimers</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. BUNTING DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE. USE OF THE SERVICE IS AT YOUR OWN RISK.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BUNTING SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, PROFITS, OR BUSINESS OPPORTUNITIES.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Kansas, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the courts of Harvey County, Kansas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms of Use from time to time. Continued use of the Service after changes constitutes acceptance of the updated terms. We encourage you to review these terms periodically.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Use, please contact:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mt-2">
              <p className="text-foreground font-medium">Bunting Magnetics Co.</p>
              <p className="text-muted-foreground">500 S. Spencer Road</p>
              <p className="text-muted-foreground">Newton, KS 67114</p>
              <p className="text-muted-foreground mt-2">Email: legal@bfrp.com</p>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
