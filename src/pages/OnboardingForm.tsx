import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormData {
  poc_name: string;
  phone: string;
  [key: string]: string;
}

const OnboardingForm = () => {
  const { slug } = useParams<{ slug: string }>();
  const [formData, setFormData] = useState<FormData>({ poc_name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const companySlug = slug || "etaps";

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/submit-onboarding-form`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ANON_KEY}`,
            apikey: ANON_KEY,
          },
          body: JSON.stringify({
            form_data: formData,
            company_slug: companySlug,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Submission failed");
      }

      setPortalUrl(result.portal_url);
      setPortalToken(result.portal_token);
      setShowSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold">Submitted Successfully!</h1>
        <p className="text-muted-foreground">Your onboarding form has been received.</p>
        {portalUrl && (
          <a
            href={portalUrl}
            className="text-primary underline text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Track your onboarding progress →
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">Onboarding Form</h1>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poc_name">Point of Contact Name</Label>
            <Input
              id="poc_name"
              value={formData.poc_name}
              onChange={(e) => setFormData((p) => ({ ...p, poc_name: e.target.value }))}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+92 xxx xxxxxxx"
            />
          </div>
        </div>

        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}

        <Button
          className="w-full"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Submitting…" : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingForm;
