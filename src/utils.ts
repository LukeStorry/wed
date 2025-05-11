import { JWT } from "google-auth-library";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import _ from "lodash";
import { z } from "zod";

const { SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } =
  import.meta.env;

const schema = z.object({
  code: z.string().min(5),
  name: z.string().min(2),
  attending: z.enum(["yes", "no", "maybe"]).optional(),
  diet: z.string().optional(),
  accommodation: z.string().optional(),
  seeAll: z.string().optional(),
  note: z.string().optional(),
  foodOrder: z.string().optional(),
});

const foodSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(5),
  foodOrder: z
    .array(
      z.object({
        item: z.string(),
        price: z.number(),
      }),
    )
    .optional()
    .default([]),
});
export type FoodOrder = z.infer<typeof foodSchema>;

export type Row = z.infer<typeof schema>;

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

  const rows = await sheet.getRows<Row>();

  return rows;
}

export async function getCodeFromName(name: string): Promise<string | null> {
  const rows = await getData().catch((e) => console.error(e));
  if (!rows) return null;
  const row = rows.find((r) =>
    String(r.get("name")).toLowerCase().includes(name.toLowerCase()),
  );
  return row?.get("code") ?? null;
}

export const getFoodOrders = async (): Promise<FoodOrder[]> => {
  const rows = await getData().then((r) =>
    r.filter((r) => r.get("code")).map(rowToRow),
  );

  return rows
    .filter((r) => r.attending === "yes" && r.seeAll == "yes")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(rowToFoodOrder);
};

const rowToFoodOrder = (r: Row): FoodOrder => ({
  name: r.name,
  foodOrder: JSON.parse(r.foodOrder ?? "[]"),
  code: r.code,
});

function rowToRow(r: GoogleSpreadsheetRow<Row>): Row {
  const row = r.toObject();
  // Let's just validate the data before returning it, for FE sanity
  const check = schema.safeParse(row);
  if (!check.success)
    throw new Error(`Bad Sheet Data!? ${JSON.stringify(r.toObject())}`, {
      cause: check.error.format(),
    });

  return check.data;
}

export async function getRowsFromCode(code: string): Promise<Row[]> {
  const rows = await getData();
  const applicable = rows.filter((r) => r.get("code") === code);
  if (applicable.length === 0) return [];

  return applicable.map(rowToRow);
}

async function updateFoodOrder(data: FoodOrder): Promise<FoodOrder> {
  console.log("updateFoodOrder", data);
  const rows = await getData();
  const row = rows.find(
    (r) => r.get("name") === data.name && r.get("code") === data.code,
  );
  if (!row) throw new Error(`Row for ${data.name} not found`);
  row.set("foodOrder", JSON.stringify(data.foodOrder ?? []));
  await row.save();
  return rowToFoodOrder(rowToRow(row));
}

export async function handleUpdateForm(formData: FormData): Promise<FoodOrder> {
  console.log(formData);

  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const foodOrder = (formData.getAll("foodOrder") as string[]).map((item) => ({
    item: item.split(":")[0]!,
    price: parseFloat(item.split(":")[1]!),
  }));

  const value = {
    code,
    name,
    foodOrder,
  };

  const result = foodSchema.safeParse(value);

  if (!result.success) {
    console.error(value);
    throw new Error("Bad Food FormData?", { cause: result.error.format() });
  }

  return await updateFoodOrder(result.data);
}
