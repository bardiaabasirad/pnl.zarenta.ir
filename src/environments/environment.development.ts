import {PriceReference} from '../app/interfaces/enums';

export const environment = {
  production: false,
  appTitle: 'زرنتا',
  domain: 'localhost:8000',
  apiUrl: 'http://localhost:8000/api',
  access_token: 'dUeOEuIWLyT2oMPyQn51dMpTelbCo74T',
  dark_mode: 'brLrMgD1ZiWiPz4dKCWXNuNPeR4NRNaN',
  encryptionKey: '3EafTBWHaB35CFec7vE5UeeD6suHOsZD',
  reverb: {
    wsHost: 'localhost',
    wsPort: 8080,
    forceTLS: false,
  },
  zarenta: {
    key: 'y9LbiTNqfekjghn4PjFac7RaU1cZCptz',
    secret: 'M92sW3lDQnfOQYaPB94Gh67Xbd42tdLiHJive2sBW5UuGXg5dZ2qI2Tbm7ocl1tn',
  },
  priceReference: PriceReference.TABAN
};
