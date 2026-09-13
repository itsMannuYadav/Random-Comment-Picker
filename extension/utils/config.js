// Single source of truth for MySocial's production origin inside the
// extension. This mirrors NEXT_PUBLIC_APP_URL on the website — update BOTH
// when the app migrates to a new domain (see planning doc section 102).
// There is no server-side config the extension can read at runtime, so this
// constant is the extension's entire domain-migration surface.
const MYSOCIAL_APP_URL = "https://mycp.mannuyadav.me";

// During local development, temporarily replace the export above with:
//   const MYSOCIAL_APP_URL = "http://localhost:3000";
// and add "http://localhost:3000/*" to host_permissions in manifest.json.
// Remove both before packing for Microsoft Edge Add-ons / Chrome Web Store.
