import { useState } from "react";
import type { FoodOrder } from "../utils";
import _ from "lodash";
import type { Menu } from "../menu";

export default function FoodOrderForm({
  orders,
  menu,
}: {
  orders: FoodOrder[];
  menu: Menu;
}) {
  const [formState, setFormState] = useState<FoodOrder>({
    name: "",
    code: "",
    foodOrder: [],
  });

  return (
    <form method="POST" className="flex flex-col gap-4 p-4">
      <div className="mb-4">
        <label htmlFor="name" className="mb-2 block font-bold">
          Your Name:
        </label>
        <select
          name="name"
          id="name"
          className="w-full rounded border p-2"
          value={formState.name}
          onChange={(e) => {
            const name = e.target.value;
            const userOrder = orders.find((order) => order.name === name);
            if (!userOrder)
              throw new Error(`User order not found for name: ${name}`);
            setFormState(userOrder);
          }}
        >
          <option value="">Select</option>
          {orders.map((o) => (
            <option key={o.name} value={o.name}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" name="code" value={formState.code} />

      {Object.entries(menu).map(([section, items]) => (
        <div key={section} className="mb-4">
          <h2 className={`p-2 text-xl font-bold`}>{section}</h2>
          <div className="flex flex-col border p-2">
            {items.map((item) => {
              return (
                <label
                  key={item.item}
                  className="flex items-center justify-between p-2 text-sm"
                >
                  <div>
                    <input
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
                    <span className="m-4">{item.item}</span>
                  </div>
                  <span>£{item.price}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-4">
        Total: £{_.sumBy(formState.foodOrder, (item) => item.price).toFixed(2)}
      </div>
      <button
        type="submit"
        className="mb-16 rounded-lg bg-gray-100 p-3 font-bold text-green-600 hover:bg-green-700 hover:text-white"
      >
        Submit Order
      </button>
    </form>
  );
}
