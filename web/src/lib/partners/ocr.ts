export type OcrDocumentType =
  | "national_id"
  | "logbook"
  | "police_abstract"
  | "medical_report"
  | "kra_pin"
  | "unknown";

export type OcrExtractInput = {
  documentType?: OcrDocumentType;
  /** Filename or sample label used by the sandbox extractor. */
  fileName?: string;
  /** Optional raw text paste for deterministic extraction demos. */
  textSample?: string;
};

export type OcrField = {
  key: string;
  value: string;
  confidence: number;
};

export type OcrExtractResult = {
  mode: "live" | "sandbox_simulated";
  documentType: OcrDocumentType;
  fields: OcrField[];
  rawText: string;
  qualityScore: number;
  reference: string;
  extractedAt: string;
};

function env(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export function isOcrLiveConfigured() {
  return Boolean(env("OCR_API_URL") && env("OCR_API_KEY"));
}

/** Document OCR for KYC, motor, and claims intake. */
export async function extractDocument(input: OcrExtractInput): Promise<OcrExtractResult> {
  const hinted = input.documentType ?? inferType(input.fileName, input.textSample);

  if (isOcrLiveConfigured() && !input.textSample) {
    try {
      const res = await fetch(`${env("OCR_API_URL").replace(/\/$/, "")}/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env("OCR_API_KEY")}`,
        },
        body: JSON.stringify({
          documentType: hinted,
          fileName: input.fileName,
        }),
      });
      if (!res.ok) throw new Error(`OCR HTTP ${res.status}`);
      const data = (await res.json()) as OcrExtractResult;
      return { ...data, mode: "live" };
    } catch {
      // sandbox fallback
    }
  }

  return simulateOcr(hinted, input);
}

function simulateOcr(documentType: OcrDocumentType, input: OcrExtractInput): OcrExtractResult {
  if (input.textSample?.trim()) {
    return extractFromText(documentType, input.textSample.trim());
  }

  switch (documentType) {
    case "national_id":
      return pack("national_id", "REPUBLIC OF KENYA\nSERIAL 123456789\nJOSEPH OTIENO\nID 29876543\nDOB 12.04.1990\nMALE", [
        field("full_name", "JOSEPH OTIENO", 0.97),
        field("id_number", "29876543", 0.99),
        field("date_of_birth", "1990-04-12", 0.94),
        field("gender", "M", 0.98),
      ]);
    case "logbook":
      return pack(
        "logbook",
        "NTSA LOGBOOK\nREG KDA123A\nMAKE TOYOTA PREMIO\nCHASSIS JTDKDA123AX\nOWNER JOSEPH OTIENO",
        [
          field("registration_number", "KDA123A", 0.98),
          field("make_model", "TOYOTA PREMIO", 0.95),
          field("chassis_number", "JTDKDA123AX", 0.96),
          field("owner_name", "JOSEPH OTIENO", 0.93),
        ],
      );
    case "police_abstract":
      return pack(
        "police_abstract",
        "POLICE ABSTRACT\nOB 42/22/06/2026 GITHURAI\nACCIDENT ON THIKA RD\nVEHICLE KDA123A\nCOMPLAINANT JOSEPH OTIENO",
        [
          field("ob_number", "42/22/06/2026", 0.91),
          field("station", "GITHURAI", 0.9),
          field("vehicle_reg", "KDA123A", 0.97),
          field("complainant", "JOSEPH OTIENO", 0.92),
          field("incident_date", "2026-06-22", 0.88),
        ],
      );
    case "medical_report":
      return pack(
        "medical_report",
        "MEDICAL REPORT\nPATIENT AMINA HASSAN\nDIAGNOSIS Soft tissue injury\nADMISSION 2 days\nFACILITY Mama Lucy",
        [
          field("patient_name", "AMINA HASSAN", 0.94),
          field("diagnosis", "Soft tissue injury", 0.89),
          field("admission_days", "2", 0.86),
          field("facility", "Mama Lucy", 0.9),
        ],
      );
    case "kra_pin":
      return pack("kra_pin", "KRA PIN CERTIFICATE\nA001234567B\nJOSEPH OTIENO", [
        field("pin", "A001234567B", 0.99),
        field("taxpayer_name", "JOSEPH OTIENO", 0.95),
      ]);
    default:
      return pack("unknown", input.fileName ?? "document.pdf", [
        field("note", "Unclassified document — review manually.", 0.4),
      ]);
  }
}

function extractFromText(documentType: OcrDocumentType, text: string): OcrExtractResult {
  const fields: OcrField[] = [];
  const id = text.match(/\b(\d{7,8})\b/);
  const reg = text.match(/\b(K[A-Z]{2}\s?\d{3}[A-Z])\b/i);
  const pin = text.match(/\b([A-Z]\d{9}[A-Z])\b/);
  const ob = text.match(/\bOB?\s?(\d+\/\d+\/\d+\/\d+)\b/i);

  if (id) fields.push(field("id_number", id[1], 0.9));
  if (reg) fields.push(field("registration_number", reg[1].replace(/\s/g, "").toUpperCase(), 0.92));
  if (pin) fields.push(field("pin", pin[1].toUpperCase(), 0.95));
  if (ob) fields.push(field("ob_number", ob[1], 0.88));
  if (fields.length === 0) fields.push(field("raw_snippet", text.slice(0, 120), 0.5));

  return pack(documentType === "unknown" ? inferType(undefined, text) : documentType, text, fields);
}

function pack(documentType: OcrDocumentType, rawText: string, fields: OcrField[]): OcrExtractResult {
  const qualityScore =
    fields.length === 0 ? 0.3 : fields.reduce((s, f) => s + f.confidence, 0) / fields.length;
  return {
    mode: "sandbox_simulated",
    documentType,
    fields,
    rawText,
    qualityScore: Math.round(qualityScore * 100) / 100,
    reference: `OCR-${Date.now().toString(36).toUpperCase()}`,
    extractedAt: new Date().toISOString(),
  };
}

function field(key: string, value: string, confidence: number): OcrField {
  return { key, value, confidence };
}

function inferType(fileName?: string, text?: string): OcrDocumentType {
  const hay = `${fileName ?? ""} ${text ?? ""}`.toLowerCase();
  if (/id|national|passport/.test(hay)) return "national_id";
  if (/logbook|ntsa|chassis/.test(hay)) return "logbook";
  if (/abstract|police|ob\s?\d/.test(hay)) return "police_abstract";
  if (/medical|hospital|diagnosis/.test(hay)) return "medical_report";
  if (/kra|pin/.test(hay)) return "kra_pin";
  return "unknown";
}
