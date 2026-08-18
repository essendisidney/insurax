const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value?: string | null): value is string {
  return Boolean(value && UUID.test(value));
}

export function asUuid(value?: string | null) {
  return isUuid(value) ? value : crypto.randomUUID();
}

export function defaultOperatorId() {
  return process.env.NEXT_PUBLIC_OPERATOR_ID ?? "00000000-0000-4000-8000-000000000001";
}
