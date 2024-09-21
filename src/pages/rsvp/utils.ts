import { JWT } from "google-auth-library";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { z } from "zod";

const { SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } =
  import.meta.env;

const schema = z.object({
  code: z.string().min(5).max(5),
  name: z.string().min(2),
  attending: z.boolean().optional(),
  diet: z.string().optional(),
  accommodation: z.string().optional(),
});
type Row = z.infer<typeof schema>;

async function getData(): Promise<GoogleSpreadsheetRow<Row>[]> {
  if (!SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY)
    throw new Error("Missing env vars");

  const serviceAccountAuth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  const sheet = doc.sheetsByTitle["AppData"];
  if (!sheet)
    throw new Error(`Unable to find AppData Sheet on ${SPREADSHEET_ID}"`);
  await sheet.loadCells();
  const rows = await sheet.getRows<Row>();

  return rows;
}

export async function getCodeFromName(name: string): Promise<string | null> {
  const rows = await getData();
  const row = rows.find((r) => r.get("name").includes(name));
  return row?.get("code") ?? null;
}
