/* RepurposerOne PayPal configuration.
 *
 * MODE:
 *   'sandbox' -> PayPal Sandbox (test) client id. No real money moves.
 *   'live'    -> live client id. Requires live API credentials.
 *
 * We reuse the ProfitPulse billing catalog quantities so money, if/when live,
 * settles to the same business account owner (RECEIVER_EMAIL).
 */
window.RP__PAYPAL = {
  MODE: 'sandbox',            // set to 'live' once live credentials exist
  CLIENT_ID_SANDBOX: 'Adj2_6UGQF3hTwhBj1Q_waCK2Acw5cAlQze5GAQIcdJkv9FKOxeYaMUEa52YIHkNoRqCGngkBIGSa7KF',
  CLIENT_ID_LIVE: '',         // <<< live client id here when upgrading
  CURRENCY: 'USD',
  RECEIVER_EMAIL: 'zanabal.nowshad@icloud.com',
  PLANS: {
    pro: 'P-6C143761BX9578412NKL7D4Q'   // $9.00/mo (ProfitPulse Pro billing plan)
  },
  PLAN_PRICE: {
    pro: { value: '9.00', currency: 'USD' }
  }
};
