import { JWT } from "google-auth-library";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import _ from "lodash";
import { z } from "zod";

const { SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } =
  import.meta.env;

const schema = z.object({
  code: z.string().min(5).max(5),
  name: z.string().min(2),
  attending: z.enum(["yes", "no", "maybe"]).optional(),
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
  await doc.loadInfo();
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

export async function getRowsFromCode(code: string): Promise<Row[]> {
  const rows = await getData();
  const applicable = rows.filter((r) => r.get("code") === code);
  if (applicable.length === 0) return [];

  return applicable.map((r) => {
    const row = r.toObject();

    // Let's just validate the data before returning it, for FE sanity
    const check = schema.safeParse(row);
    if (!check.success)
      throw new Error(`Bad Sheet Data!? ${JSON.stringify(r.toObject())}`, {
        cause: check.error.format(),
      });

    return check.data;
  });
}

async function updateRow(data: Row): Promise<void> {
  const rows = await getData();
  const row = rows.find(
    (r) => r.get("code") === data.code && r.get("name") === data.name,
  );
  if (!row) throw new Error(`Row for ${data.name} not found`);
  row.assign(data);
  await row.save();
}

export async function handleUpdateForm(formData: FormData): Promise<void> {
  console.log(formData);

  // We've got multiple objects with prepended indexes, so unpack into objects
  const keyValuePairs = [...formData.entries()];

  const updates: unknown[] = [];
  keyValuePairs.forEach(([k, v]) => _.set(updates, k, v));
  console.log(updates);

  for (const update of updates) {
    const result = schema.safeParse(update);
    if (!result.success) {
      console.error(update);
      throw new Error("Bad FormData?", { cause: result.error.format() });
    }
    await updateRow(result.data);
  }
}
