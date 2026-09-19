// Mirrors app/services/validation.py's determine_partner_count for the
// "Generate PDFs" partner_count query param.

export function determinePartnerCount(fieldData: Record<string, string>): number {
  if (fieldData.BID_TYPE === "Single Bidder") return 1;
  if (fieldData.SECOND_PARTNER_NAME) return 3;
  if (fieldData.FIRST_PARTNER_NAME) return 2;
  return 1;
}
