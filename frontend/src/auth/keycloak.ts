import Keycloak from 'keycloak-js';

const url = import.meta.env.VITE_KEYCLOAK_URL as string;
const realm = import.meta.env.VITE_KEYCLOAK_REALM as string;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string;

export const keycloak = new Keycloak({ url, realm, clientId });

let initPromise: Promise<boolean> | null = null;

export async function initKeycloak() {
  if (!initPromise) {
    initPromise = keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        enableLogging: true,
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        flow: 'standard',           // explícito
        responseMode: 'query',      // evita el hash
      })
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}
