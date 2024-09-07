/// <reference types="astro/client" />

interface ImportMeta {
  readonly env: {
    readonly PASSWORD: string;
    readonly SPREADSHEET_ID: string;
    readonly GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
    readonly GOOGLE_PRIVATE_KEY: string;
  };
}
