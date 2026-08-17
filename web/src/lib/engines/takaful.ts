export const KENYA_LEVIES = {
  trainingLevy: 0.002,
  phcf: 0.0025,
  stampDutyRate: 0.001,
};

export function splitContribution(gross: number, wakalaRate: number) {
  const wakala = round2(gross * wakalaRate);
  const tabarru = round2(gross - wakala);
  return { wakala, tabarru };
}

export function applyLevies(contribution: number) {
  const training = round2(contribution * KENYA_LEVIES.trainingLevy);
  const phcf = round2(contribution * KENYA_LEVIES.phcf);
  const stamp = round2(contribution * KENYA_LEVIES.stampDutyRate);
  const levies = round2(training + phcf + stamp);
  return { training, phcf, stamp, levies, taxes: 0 };
}

export function frequencyFactor(frequency: string) {
  switch (frequency) {
    case "daily":
      return 1 / 365;
    case "weekly":
      return 1 / 52;
    case "monthly":
      return 1 / 12;
    case "quarterly":
      return 1 / 4;
    case "single":
    case "annually":
    default:
      return 1;
  }
}

export function toMonthly(annual: number) {
  return round2(annual / 12);
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}
