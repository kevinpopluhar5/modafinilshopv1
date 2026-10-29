export function sfAuthorization({email,apiKey,companyId,module='ShopIntegration'}) {
  if (!email || !apiKey || !companyId) throw new Error('SUPERFAKTURA_CREDENTIALS_REQUIRED');
  const values = { email, apikey:apiKey, module, company_id:companyId };
  return `SFAPI ${Object.entries(values).map(([key,value])=>`${key}=${encodeURIComponent(value)}`).join('&')}`;
}
export function superfakturaRequirements() {
  return { stage:'pending-provider-sandbox', credentials:['SUPERFAKTURA_EMAIL','SUPERFAKTURA_API_KEY','SUPERFAKTURA_COMPANY_ID'], mode:'review-before-create', automaticExternalCalls:false };
}
