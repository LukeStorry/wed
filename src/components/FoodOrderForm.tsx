import { useState, type Dispatch, type SetStateAction } from "react";
import type { FoodOrder } from "../utils";
import _ from "lodash";
import type { Menu } from "../menu";

export default function FoodOrderForm({
  orders,
  menu,
  initialName,
}: {
  orders: FoodOrder[];
  menu: Menu;
  initialName: string | undefined;
}) {
  const [formState, setFormState] = useState<FoodOrder>(
    orders.find((o) => o.name === initialName) ?? {
      name: "",
      code: "",
      foodOrder: [],
    },
  );

  const [error, setError] = useState<string | null>(null);

  const disabled = !orders.some((o) => o.name === formState.name);

  return (
    <form method="POST" className="flex flex-col gap-4 p-4">
      <p>
        Friday night will be fish and chips, menu available{" "}
        <a
          className="text-green-600 underline"
          href="https://theplaiceex23.touchtakeaway.net/menu"
          target="_blank"
        >
          here
        </a>
        .
      </p>
      <p>
        Saturday lunch will be pasties, menu available{" "}
        <a
          className="text-green-600 underline"
          href="https://tastypasties.co.uk/pasties-html/"
          target="_blank"
        >
          here
        </a>
        . This will Be Saturday Lunch
      </p>
      <p>BYOB for these meals, but corkage fees from 3pm Saturday onwards</p>

      <div className="mb-4">
        <label htmlFor="name" className="mb-2 block font-bold">
          Your Name:
        </label>
        <input
          name="name"
          id="name"
          className="w-full rounded border p-2"
          value={formState.name}
          onChange={(e) => {
            setFormState((prev) => ({ ...prev, name: e.target.value }));
          }}
          onBlur={() => {
            const userOrder = orders.find(
              (order) =>
                order.name.toLowerCase() ===
                formState.name.toLowerCase().trim(),
            );
            if (!userOrder) {
              if (formState.name.length < 5 || !formState.name.includes(" ")) {
                setError("Please enter your full name as on the RSVP.");
              } else {
                setError(
                  `"${formState.name}" not found, possibly: ${orders
                    .filter((o) =>
                      o.name
                        .toLowerCase()
                        .includes(formState.name.toLowerCase().slice(0, 5)),
                    )
                    .map((o) => `"${o.name}"`)
                    .join("/")}`,
                );
              }
            } else {
              setError(null);
              setFormState(userOrder);
            }
          }}
        />
        {error && <p className="text-red-500">{error}</p>}
      </div>

      <input type="hidden" name="code" value={formState.code} />

      {Object.entries(menu).map(([section, items]) => (
        <div key={section} className="mb-4 rounded border">
          <h2 className={`p-2 text-xl font-bold`}>{section}</h2>
          {items.map((item) => (
            <MenuItemCheckbox
              key={item.item}
              formState={formState}
              setFormState={setFormState}
              item={item}
            />
          ))}
        </div>
      ))}

      <div className="text-sm">
        {formState.foodOrder.map((item) => (
          <p key={item.item}>
            {item.item}: £{item.price.toFixed(2)}
          </p>
        ))}
        <p className="text-normal font-bold">
          Total: £
          {_.sumBy(formState.foodOrder, (item) => item.price).toFixed(2)}
        </p>
      </div>

      <button
        type="submit"
        className="mb-16 w-fit rounded-lg bg-green-800 p-3 font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        disabled={disabled}
        onClick={() => {
          alert(
            `Saved! ${formState.foodOrder.map((item) => item.item).join(", ")}`,
          );
        }}
      >
        Submit Order
      </button>
    </form>
  );
}

function MenuItemCheckbox({
  formState,
  setFormState,
  item,
}: {
  formState: FoodOrder;
  setFormState: Dispatch<SetStateAction<FoodOrder>>;
  item: Menu[keyof Menu][number];
}) {
  return (
    <label className="flex items-center justify-between pr-2 text-sm">
      <div>
        <input
          className="m-2"
          type="checkbox"
          name="foodOrder"
          value={`${item.item}:${item.price}`}
          checked={formState.foodOrder.some((orderItem) =>
            _.isEqual(orderItem, item),
          )}
          onChange={(e) => {
            if (e.target.checked) {
              setFormState((prev) => ({
                ...prev,
                foodOrder: [...prev.foodOrder, item],
              }));
            } else {
              setFormState((prev) => ({
                ...prev,
                foodOrder: prev.foodOrder.filter(
                  (orderItem) => !_.isEqual(orderItem, item),
                ),
              }));
            }
          }}
        />
        <span>{item.item}</span>
      </div>
      <span>£{item.price}</span>
    </label>
  );
}
