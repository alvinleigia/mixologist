export function generateCustomerToken() {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
}
