export type CrbCheckInput = {
  idNumber: string;
  fullName?: string;
  phone?: string;
};

export type CrbFacility = {
  lender: string;
  product: string;
  outstanding: number;
  status: "performing" | "arrears" | "written_off" | "closed";
};

export type CrbCheckResult = {
  mode: "live" | "sandbox_simulated";
  found: boolean;
  score: number;
  band: "excellent" | "good" | "fair" | "poor" | "severe";
  delinquencies24m: number;
  facilities: CrbFacility[];
  uwHint: "accept" | "load" | "refer" | "reject";
  loadPercent: number;
  notes: string[];
  reference: string;
  checkedAt: string;
};

function env(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export function isCrbLiveConfigured() {
  return Boolean(env("CRB_API_URL") && env("CRB_API_KEY"));
}

/** Metropol / TransUnion-style CRB credit check for underwriting. */
export async function checkCredit(input: CrbCheckInput): Promise<CrbCheckResult> {
  const idNumber = input.idNumber.replace(/\D/g, "");
  if (!/^\d{7,8}$/.test(idNumber)) {
    return {
      mode: isCrbLiveConfigured() ? "live" : "sandbox_simulated",
      found: false,
      score: 0,
      band: "severe",
      delinquencies24m: 0,
      facilities: [],
      uwHint: "refer",
      loadPercent: 0,
      notes: ["Invalid national ID for CRB enquiry."],
      reference: ref("CRB"),
      checkedAt: new Date().toISOString(),
    };
  }

  if (isCrbLiveConfigured()) {
    try {
      const res = await fetch(`${env("CRB_API_URL").replace(/\/$/, "")}/enquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env("CRB_API_KEY")}`,
        },
        body: JSON.stringify({
          idNumber,
          fullName: input.fullName,
          phone: input.phone,
        }),
      });
      if (!res.ok) throw new Error(`CRB HTTP ${res.status}`);
      const data = (await res.json()) as CrbCheckResult;
      return { ...data, mode: "live" };
    } catch {
      // sandbox fallback
    }
  }

  return simulateCrb(idNumber, input.fullName);
}

function simulateCrb(idNumber: string, fullName?: string): CrbCheckResult {
  const seed = Number(idNumber.slice(-4));
  // Deterministic score 280–820
  const score = 280 + ((seed * 37) % 541);
  const delinquencies24m = seed % 11 === 0 ? 3 : seed % 5 === 0 ? 1 : 0;

  const facilities: CrbFacility[] = [
    {
      lender: seed % 2 === 0 ? "Equity Bank" : "KCB",
      product: "Personal loan",
      outstanding: 40000 + (seed % 20) * 5000,
      status: delinquencies24m >= 3 ? "arrears" : "performing",
    },
  ];
  if (seed % 3 === 0) {
    facilities.push({
      lender: "M-Shwari",
      product: "Fuliza / overdraft",
      outstanding: 2500 + (seed % 10) * 200,
      status: delinquencies24m ? "arrears" : "performing",
    });
  }

  let band: CrbCheckResult["band"];
  let uwHint: CrbCheckResult["uwHint"];
  let loadPercent = 0;
  const notes: string[] = [];

  if (score < 400 || delinquencies24m >= 3) {
    band = "severe";
    uwHint = "reject";
    notes.push("Severe credit impairment — decline or escalate compliance.");
  } else if (score < 550) {
    band = "poor";
    uwHint = "refer";
    notes.push("Below agent binding score — refer to underwriter.");
  } else if (score < 650) {
    band = "fair";
    uwHint = "load";
    loadPercent = 10;
    notes.push("Fair CRB band — contribution loading +10%.");
  } else if (score < 750) {
    band = "good";
    uwHint = "accept";
    notes.push("Good CRB standing.");
  } else {
    band = "excellent";
    uwHint = "accept";
    notes.push("Excellent CRB standing.");
  }

  if (fullName) notes.push(`Enquiry subject: ${fullName.toUpperCase()}`);

  return {
    mode: "sandbox_simulated",
    found: true,
    score,
    band,
    delinquencies24m,
    facilities,
    uwHint,
    loadPercent,
    notes,
    reference: ref("CRB"),
    checkedAt: new Date().toISOString(),
  };
}

function ref(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0")}`;
}
