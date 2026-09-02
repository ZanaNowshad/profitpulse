/* ProfitPulse PayPal configuration.
 *
 * MODE:
 *   'sandbox' -> uses the PayPal Sandbox (test) client id. No real money moves.
 *   'live'    -> uses your real PayPal client id. Requires live API credentials.
 *
 * RECEIVER_EMAIL is the PayPal business account that receives payment. Set to the
 * account that owns the billing product/plans.
 */
window.PP_PAYPAL = {
  MODE: 'sandbox',            // set to 'live' once live credentials are available
  CLIENT_ID_SANDBOX: 'Adj2_6UGQF3hTwhBj1Q_waCK2Acw5cAlQze5GAQIcdJkv9FKOxeYaMUEa52YIHkNoRqCGngkBIGSa7KF',
  CLIENT_ID_LIVE: '',         // <<< put live client id here when upgrading
  CURRENCY: 'USD',
  RECEIVER_EMAIL: 'zanabal.nowshad@icloud.com',
  PLANS: {
    pro:  'P-6C143761BX9578412NKL7D4Q',
    team: 'P-5HE234419H928930TNKL7D4Y'
  },
  PLAN_PRICE: {
    pro:  { value: '9.00',  currency: 'USD' },
    team: { value: '29.00', currency: 'USD' }
  }
};
