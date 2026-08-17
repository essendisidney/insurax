import { Card, PageHeader } from "@/components/ui";

const caps = [
  ["AI chatbot", "WhatsApp / in-app care with policy-aware answers"],
  ["Claims triage", "Severity, cover match and next-best action"],
  ["Risk scoring", "Participant and asset risk at quote time"],
  ["Contribution prediction", "Expected loss vs wakala sustainability"],
  ["Churn prediction", "Renewal save campaigns before lapse"],
  ["Cross-sell", "Hospital cash after motor, device after SACCO loan"],
  ["Fraud scoring", "Duplicates, devices, identity, location"],
  ["Document extraction", "OCR on abstracts, IDs, medical notes"],
  ["Voice transcription", "Call-center QA and complaint mining"],
  ["Automated underwriting", "STP with explainable rule + model blend"],
];

export default function AiPage() {
  return (
    <div>
      <PageHeader
        eyebrow="InsuraX AI"
        title="Intelligence, automation & decisioning"
        description="Models assist — they do not silently bind the operator. Every score is explainable and overridable."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {caps.map(([title, copy]) => (
          <Card key={title} className="p-5">
            <h2 className="font-display text-xl">{title}</h2>
            <p className="mt-2 text-sm text-mute">{copy}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-5 text-sm">
        <p className="font-medium">Live in this demo</p>
        <p className="mt-2 text-mute">
          Quote pricing, underwriting rules, and claim fraud scoring run locally. OCR / IPRS / NTSA sandboxes are live on{" "}
          <a href="/app/integrations" className="text-teal underline-offset-2 hover:underline">
            Partners &amp; OCR
          </a>
          . Production connects OpenAI / Azure AI / open-source LLMs behind the API gateway.
        </p>
      </Card>
    </div>
  );
}
