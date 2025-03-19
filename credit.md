# Credit

## Driver UI

- Visual design / structure: Mostly Jac, some by Ben
- Functionality: Mostly Ben, some by Jac

## API endpoints

Keep in mind the *description* column here is abridged. For better
documentation about how a given API works look at it's JSDoc/doxygen doc in
[main.ts](./main.ts).

| Endpoint | Type | Credit | Description |
| -------- | ---- | ------ | ----------- |
| `create_order`            | CRUD multiple | Ben          | post a full order and get an order number           |
| `get_order`               | Detail        | Karsten      | get details for an order                            |
| `get_popular_side`        | List          | Jac          | number of sales for each different side             |
| `get_popular_toppings`    | List          | Jac          | number of sales for each different topping          |
| `get_popular_dough`       | List          | keisuke      | number of sales for each different dough            |
| `get_popular_sauce`       | List          | keisuke      | number of sales for each different sauce            |
| `get_popular_combo`       | List          | keisuke      | number of sales for each different pair of toppings |
| `list_available_sides`    | List          | Karsten\*    | all sides currently sold / recognized by the DB     |
| `list_available_toppings` | List          | Karsten\*    | all toppings currently sold / recognized by the DB  |
| `list_available_sauces`   | List          | Karsten\*    | all sauces currently sold / recognized by the DB    |
| `list_available_dough`    | List          | Karsten\*    | all doughs currently sold / recognized by the DB    |
| `list_available_sizes`    | List          | Karsten\*    | all sizes currently sold / recognized by the DB     |
| `daily_topping_sales`     | List          | Ben          | get sales of a specific topping per day             |
| `daily_sauce_sales`       | List          | Ben          | get sales of a specific sauce per day               |
| `list_orders_made_on`     | List          | Jac          | get all ordernums for a particular day              |
| `get_revenue_in_range`    | Complex Query | Karsten      | get the total revenue for a given range             |

\* Does not wish for this to count for or against grade

## Mock database

- [Schema Implementation](./PizzariaDB.txt): Karsten
- [Mock Data](./DB_data.txt): Keisuke
