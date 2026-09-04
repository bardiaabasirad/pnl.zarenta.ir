import {PriceReference} from '../app/interfaces/enums';

export const environment = {
  production: false,
  domain: 'localhost:8000',
  apiUrl: 'http://localhost:8000',
  access_token: 'KDL^kb.d)VDq]i3X)nfiaVNpVyhk7TTC',
  dark_mode: ',&_WiOsTr796ICRZIRUiS&Yah9NtlHcw',
  encryptionKey: 'BdG2xCUlxakj9EwhFKdAPxdKVc16CQsk',
  reverb: {
    wsHost: 'localhost',
    wsPort: 8080,
    forceTLS: false,
  },
  zhikgold: {
    key: 'y9LbiTNqfekjghn4PjFac7RaU1cZCptz',
    secret: 'M92sW3lDQnfOQYaPB94Gh67Xbd42tdLiHJive2sBW5UuGXg5dZ2qI2Tbm7ocl1tn',
  },
  priceReference: PriceReference.TABAN
};
