export type NtsaLookupInput = {
  registrationNumber: string;
  chassisNumber?: string;
};

export type NtsaVehicle = {
  registrationNumber: string;
  make: string;
  model: string;
  colour: string;
  year: number;
  bodyType: string;
  fuel: string;
  chassisNumber: string;
  engineNumber: string;
  ownerName: string;
  logbookStatus: "valid" | "caveat" | "stolen" | "exported";
  insuranceStatus: "unknown" | "active" | "expired";
  countyOfUse: string;
};

export type NtsaLookupResult = {
  mode: "live" | "sandbox_simulated";
  found: boolean;
  vehicle: NtsaVehicle | null;
  riskFlags: string[];
  reference: string;
  lookedUpAt: string;
};

function env(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export function isNtsaLiveConfigured() {
  return Boolean(env("NTSA_API_URL") && env("NTSA_API_KEY"));
}

/** NTSA TIMS / vehicle registry lookup for motor underwriting. */
export async function lookupVehicle(input: NtsaLookupInput): Promise<NtsaLookupResult> {
  const reg = normalizeReg(input.registrationNumber);
  if (!/^[A-Z]{3}\d{3}[A-Z]$/.test(reg) && !/^[A-Z]{2}\d{3}[A-Z]$/.test(reg)) {
    return {
      mode: isNtsaLiveConfigured() ? "live" : "sandbox_simulated",
      found: false,
      vehicle: null,
      riskFlags: ["Invalid registration format (expected e.g. KDA123A)."],
      reference: ref("NTSA"),
      lookedUpAt: new Date().toISOString(),
    };
  }

  if (isNtsaLiveConfigured()) {
    try {
      const url = new URL(`${env("NTSA_API_URL").replace(/\/$/, "")}/vehicles/${encodeURIComponent(reg)}`);
      if (input.chassisNumber) url.searchParams.set("chassis", input.chassisNumber);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${env("NTSA_API_KEY")}` },
      });
      if (!res.ok) throw new Error(`NTSA HTTP ${res.status}`);
      const data = (await res.json()) as NtsaLookupResult;
      return { ...data, mode: "live" };
    } catch {
      // sandbox fallback
    }
  }

  return simulateNtsa(reg, input.chassisNumber);
}

function simulateNtsa(reg: string, chassis?: string): NtsaLookupResult {
  const hash = [...reg].reduce((a, c) => a + c.charCodeAt(0), 0);
  const makes = ["Toyota", "Nissan", "Mazda", "Subaru", "Isuzu"];
  const models = ["Premio", "Note", "Demio", "Forester", "D-Max"];
  const colours = ["Silver", "White", "Black", "Blue", "Red"];
  const year = 2008 + (hash % 16);
  const statusRoll = hash % 17;

  const vehicle: NtsaVehicle = {
    registrationNumber: reg,
    make: makes[hash % makes.length],
    model: models[hash % models.length],
    colour: colours[hash % colours.length],
    year,
    bodyType: hash % 3 === 0 ? "Pickup" : "Saloon",
    fuel: hash % 4 === 0 ? "Diesel" : "Petrol",
    chassisNumber: chassis?.toUpperCase() || `JTD${reg}${hash}X`,
    engineNumber: `ENG${hash}${reg.slice(-3)}`,
    ownerName: hash % 2 === 0 ? "JOSEPH OTIENO" : "AMINA HASSAN",
    logbookStatus: statusRoll === 0 ? "stolen" : statusRoll === 1 ? "caveat" : "valid",
    insuranceStatus: statusRoll === 2 ? "expired" : "unknown",
    countyOfUse: ["Nairobi", "Kiambu", "Mombasa", "Kisumu"][hash % 4],
  };

  const riskFlags: string[] = [];
  if (vehicle.logbookStatus === "stolen") riskFlags.push("Vehicle flagged stolen on registry.");
  if (vehicle.logbookStatus === "caveat") riskFlags.push("Caveat / finance interest on logbook.");
  if (new Date().getFullYear() - vehicle.year > 15) riskFlags.push("Vehicle age above 15 years — UW referral.");
  if (vehicle.insuranceStatus === "expired") riskFlags.push("Prior cover appears expired.");

  return {
    mode: "sandbox_simulated",
    found: true,
    vehicle,
    riskFlags,
    reference: ref("NTSA"),
    lookedUpAt: new Date().toISOString(),
  };
}

function normalizeReg(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function ref(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0")}`;
}
