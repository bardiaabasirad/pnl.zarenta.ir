import {PriceReference} from '../app/interfaces/enums';

export const environment = {
  production: true,
  appTitle: 'زرنتا',
  domain: 'zarenta.ir',
  apiUrl: 'https://api.zarenta.ir/api',
  access_token: 'YDhX7Ki6Dm86MtijIbHLhEPyVPxapWsi',
  dark_mode: 'TApovoFL7K5h7XfGmNC0XOBxk5iv1FuI',
  encryptionKey: '4kaEV29FSsPKmQnLq1UHWiQGNlbnijDL',
  reverb: {
    wsHost: 'api.zarenta.ir',
    wsPort: 443,
    forceTLS: true,
  },
  zarenta: {
    key: 'y9LbiTNqfekjghn4PjFac7RaU1cZCptz',
    secret: 'M92sW3lDQnfOQYaPB94Gh67Xbd42tdLiHJive2sBW5UuGXg5dZ2qI2Tbm7ocl1tn',
  },
  priceReference: PriceReference.TABAN
};
