import { createServer, IncomingMessage, ServerResponse } from 'http';
import sql from './db.ts';
import fs from 'fs';
import path from 'path';
import * as dt from './datatypes.ts';
const port = 8000;

const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    if (request.url === null) return;
    const url = new URL(request.url!, `http://${request.headers.host}`);
    response.setHeader('Access-Control-Allow-Origin', '*');


    if (url.pathname === '/') {
        response.write(`
            <head>
                <meta http-equiv="refresh" content="0; url=/index.html">
            </head>
            <body>
                <p><a href="/index.html"> Click here if you aren't redirected </a></p>
            </body>
        `);

        response.end();


    } else if (url.pathname.startsWith('/api')) {
        let body = '';
        request
            .on('data', (chunk) => {
                body = body + chunk;
            })
            .on('end', async () => {
                let bodyJson = undefined;
                try {bodyJson = await JSON.parse(body);} catch (e) {}

                const apiResponse = await apiCall(url, bodyJson);
                if (apiResponse.err !== undefined) {
                    response.statusCode = 400;
                }

                response.write(JSON.stringify(apiResponse.ok ?? apiResponse.err));
                response.end();
            });


    } else {
        const file = path.join(__dirname + '/client/', url.pathname);
        fs.readFile(
            file,
            {encoding: 'utf-8'},
            (err, data) => {
                if (!err) {
                    response.write(data);
                } else {
                    console.log(err);
                    response.statusCode = 404;
                }

                response.end();
            }
        );
    }
});

server.listen(port, () => {
    console.log();
});

type APISuccess<T> = {
    ok: T;
    err?: never;
};
type APIErr = {
    ok?: never;
    err: string;
};
type APIReturn<T> = Promise<APISuccess<T> | APIErr>;

async function apiCall(url: URL, body: any): APIReturn<any> {
    const apiEndpoint = url.pathname.substring(url.pathname.indexOf('/', 1) + 1)
    console.log("Call of api endpoint: " + apiEndpoint);

    const apiFn = {
        /**create_order (Crupdate Multiple API) By Ben Findley
         *
         * POST to this api with an array of items in the order (and optionally
         * phone# in query string). This will add the order described to the DB
         * and return an ordernum you can use to refer back to the order
         *
         * example:
         *
         * ```
         * fetch("/api/create_order?phone=123-456-7890", {
         *     method: "POST",
         *     body: JSON.stringify(
         *         [{dough:{size:'Medium', type:'Thick Crust'}, sauce:'Alfredo', toppings:['Sausage', 'Pepperoni']}]
         *     ),
         * }).then((response) => {
         *     response.json().then((ordernum) => {
         *         console.log(ordernum);
         *     });
         * });
         * ```
         * prints something like "ORD0928137"
         */
        'create_order': async (args: URLSearchParams, body: any): APIReturn<String> => {
            try {
                let order: dt.Order = body;
                let phone: string | null = args.get('phone');

                let ordernum = 'ORD' + `${Math.floor(Math.random() * 100000000)}`;

                let [orderid] = await sql.begin(async sql => { // BEGIN TRANSACTION
                    const [orderid] = await sql`
                        INSERT INTO "Order" (phoneNumber, dateOrdered, orderNumber) 
                        VALUES (${phone}, NOW(), ${ordernum})
                        RETURNING id
                        ;
                    `;

                    for (let orderItem of order) {
                        if ('side' in orderItem) {
                            // this is a side
                            await sql`
                                INSERT INTO AddedSides (orderid, sideid, quantity)
                                VALUES (
                                    ${orderid.id}, 
                                    (SELECT id FROM Side WHERE name = ${orderItem.side}),
                                    ${orderItem.quantity}
                                );
                            `;
                        } else {
                            // this is a pizza
                            const [doughid] = await sql`
                                INSERT INTO Dough (doughTypeId, doughSizeId)
                                VALUES (
                                    (SELECT id FROM DoughType WHERE name = ${orderItem.dough.type}),
                                    (SELECT id FROM DoughSize WHERE name = ${orderItem.dough.size})
                                )
                                RETURNING id
                                ;
                            `;

                            const [sauceid] = await sql`
                                INSERT INTO Sauce (sauceTypeId)
                                VALUES ((SELECT id FROM SauceType WHERE SauceType.name = ${orderItem.sauce}))
                                RETURNING id
                                ;
                            `;

                            let pizzanum = 'PZ' + `${Math.floor(Math.random() * 100000000)}`;

                            const [pizzaid] = await sql`
                                INSERT INTO Pizza (orderId, doughId, sauceId, pizzaNumber)
                                VALUES (
                                    ${orderid.id},
                                    ${doughid.id},
                                    ${sauceid.id},
                                    ${pizzanum}
                                )
                                RETURNING id
                                ;
                            `;

                            for (let addedTopping of orderItem.toppings) {
                                const [addedtoppingid] = await sql`
                                    INSERT INTO AddedToppings (pizzaId, toppingId)
                                    VALUES (${pizzaid.id}, (SELECT id FROM Topping WHERE name = ${addedTopping}))
                                    ;
                                `;
                            }
                        }
                    }

                    return [orderid];
                });

                return {ok: ordernum};
            } catch (e) {
                console.error("create_order failed: " + e);
                return {err: "order failed"};
            }
        },

        /**get_order (Detail API) By Karsten Schmidt
         * GET with this api with the order number as a parameter. This will return all order details, to be displayed by the front end
         * through the datastructures defined in db.ts (pizza, toppings, souce, dough, sides, all within orderline inside of placedOrder)
         * 
         * This API retrieves the details of a placed order from the database and gives back to 
         * the user all important details, similar to an itemized receipt.
         * @params orderNumber: The order number of the order to retrieve.
         * @returns A PlacedOrder object, which contains the phone number of the orderer, the date, 
         * and all the order details
         * Example: {
                    phone: '425-667-6942',
                    dateOrdered: new Date('1999-12-10 15:13:12'),
                    orderNumber: ordernum,
                    contents: [
                        'breadsticks',
                        'cookie',
                        {
                            dough: {
                                type: 'regular',
                                size: 'medium',
                            },
                            toppings: [
                                'pepperoni'
                            ],
                            sauce: 'tomato'
                        },
                    ]
                    }
                }
        */
        'get_order': async (args: URLSearchParams, body: any): APIReturn<dt.PlacedOrder> => {
            try {
                const orderNumber = args.get('orderNumber');

                if(!orderNumber) { 
                    throw new Error('Order number is required');
                }

                const orderPizzaDetails = await sql`SELECT ordernumber, phonenumber, dateordered, pizzaNumber, DS.name AS "doughSize", DT.name AS "doughType", ST.name AS "sauceType", T.name AS "Topping"
                FROM Pizza P
                    JOIN "Order" O ON (O.ID = P.orderID)
                    JOIN Sauce S ON (P.sauceID = S.ID)
                    JOIN SauceType ST ON (S.sauceTypeID = ST.ID)
                    JOIN Dough D ON (P.doughID = D.ID)
                    JOIN DoughSize DS ON (D.doughSizeID = DS.ID)
                    JOIN DoughType DT ON (D.doughTypeID = DT.ID)
                    JOIN AddedToppings AD ON (AD.pizzaID = P.ID)
                    JOIN Topping T ON (T.ID = AD.toppingID)
                WHERE orderID = (SELECT ID FROM "Order" WHERE orderNumber = ${orderNumber})
                ORDER BY pizzaNumber;`;

                // Map to avoid duplicate pizzas
                let pizzaMap = new Map<string, dt.Pizza>();
                
                orderPizzaDetails.forEach(pizza => {
                    // Check if this is a new unique pizza, then fill in the singular items (dough, sauce)
                    if(!pizzaMap.has(pizza.pizzaNumber)) {
                        // Create the dough object to add to the pizza object
                        let dough = new dt.Dough();
                        dough.type = pizza.doughType as dt.DoughType;
                        dough.size = pizza.doughSize as dt.DoughSize;

                        // Create the pizza object and add dough and sauce
                        let pizzaObj = new dt.Pizza();
                        pizzaObj.dough = dough;
                        pizzaObj.sauce = pizza.sauceType as dt.Sauce;   
                        console.log(pizzaObj.sauce);
                        // Toppings should be empty in this case until we append later
                        pizzaObj.toppings = [];

                        pizzaMap.set(pizza.pizzaNumber, pizzaObj);
                    }

                    // Add all toppings to each pizza object in the map
                    let pizzaObj = pizzaMap.get(pizza.pizzaNumber);
                    if (pizzaObj && pizza.Topping && !pizzaObj.toppings.includes(pizza.Topping)) {
                        pizzaObj.toppings.push(pizza.Topping as dt.Topping);
                    }
                });

                // Deal with the sides
                const orderSideDetails = await sql`SELECT S.name AS "Side", ADS.quantity as "Quantity"
                FROM "Order" O
                    JOIN AddedSides ADS ON (ADS.orderID = O.ID)
                    JOIN Side S ON (S.ID = ADS.sideID)
                WHERE O.orderNumber = ${orderNumber};`

                // Map to avoid duplicate sides - unlikely, but in this rare case best to avoid issue
                let sidesMap = new Map<string, dt.AddedSide>();

                orderSideDetails.forEach(side => {
                    if(!sidesMap.has(side.Side)){
                        const tmpSide = side.Side as dt.Side;
                        let sideObj = new dt.AddedSide();
                        sideObj.side = tmpSide;
                        sideObj.quantity = 0;
                        sidesMap.set(side.Side, sideObj);
                    }
                    // Add the quantity of the specified side, to the side
                    let sideObj = sidesMap.get(side.Side);
                    sideObj.quantity = (sideObj.quantity + (side.Quantity));

                })

                // Combine sides and pizzas to the order
                const pizzas = Array.from(pizzaMap.values());
                const allSides = Array.from(sidesMap.values());

                // If someone just got sides, but no pizzas, we need to still get order details. 
                // Or for some reason there is an order with nothing associated to it
                if(pizzaMap.size === 0){
                    const boringOrder = await sql`SELECT ordernumber AS "orderNumber", phonenumber, dateordered AS "dateOrdered"
                    FROM "Order" O
                    WHERE O.ordernumber = ${orderNumber};`

                    let placedOrder = new dt.PlacedOrder();
                    placedOrder.orderNumber = boringOrder[0].orderNumber;
                    placedOrder.phone = boringOrder[0].phonenumber;
                    placedOrder.dateOrdered = new Date(boringOrder[0].dateOrdered);
                    placedOrder.contents = [...pizzas, ...allSides];

                    return {ok: placedOrder};

                } else {
                    // Create the placedOrder Object from the pizzas and sides
                    let placedOrder = new dt.PlacedOrder();
                    placedOrder.orderNumber = orderPizzaDetails[0].orderNumber;
                    placedOrder.phone = orderPizzaDetails[0].phonenumber;
                    placedOrder.dateOrdered = new Date(orderPizzaDetails[0].dateordered);
                    placedOrder.contents = [...pizzas, ...allSides];

                    return {ok: placedOrder};
                }
            } catch (error) {
                console.warn(error);
                return {err: "Unable to get order. Try again later!"};
            }
        },

        /**get_popular_side (Detail API) By Jac Chambers
         * This API retrieves the most popular sides from the database 
         * within a specified date range.
         * @param start: The start date of the range to search for popular sides.
         * @param end: The end date of the range to search for popular sides.
         * @param limit: The number of popular sides to return.
         * @returns A list of tuples, each containing a side.name and the number of times it was ordered.
         * Example: [
         *      ['breadsticks', 10], 
         *      ['cookie', 5], 
         *      ['2L soda', 3]
         * ]
         */
        'get_popular_side': async (args: URLSearchParams): APIReturn<dt.Popular<dt.Side>> => {
            try {
                // Get the start date, end date, and limit from the URL parameters
                const startDate = args.get('start');
                const endDate = args.get('end');
                const limit = args.get('limit');
                // If any of the parameters are missing, throw an error
                if (!startDate) throw new Error('startDate is required');
                if (!endDate) throw new Error('endDate is required');
                if (!limit) throw new Error('limit is required');
                
                // Query the database for the most popular sides within the specified date range
                const popularSides = await sql`SELECT Side.name, COUNT(AddedSides.sideID) as "count"
                FROM AddedSides
                    JOIN Side ON (Side.ID = AddedSides.sideID)
                    JOIN "Order" ON ("Order".ID = AddedSides.orderID)
                    WHERE "Order".dateOrdered BETWEEN ${startDate} AND ${endDate}
                    GROUP BY Side.name
                    ORDER BY count DESC
                    LIMIT ${limit};`;

                // Provided there has been no error, return OK, with the popular sides
                return {ok: popularSides.map((side: any) => [side.name, side.count])};
                
            } catch (error) {
                // If there is an error, log it and return an error message
                console.warn(error);
                return {err: "Unable to get popular sides. Try again later!"};
            }
        },

        /**get_popular_toppings (Detail API) By Jac Chambers
         * This API retrieves the most popular toppings from the database 
         * within a specified date range.
         * @param start: The start date of the range to search for popular toppings.
         * @param end: The end date of the range to search for popular toppings.
         * @param limit: The number of popular toppings to return.
         * @returns A list of tuples, each containing a topping.name and the number of times it was ordered.
         * Example: [
         *      ['pepperoni', 10],
         *      ['mushroom', 5],
         *      ['onion', 3]
         * ]
         */
        'get_popular_toppings': async (args: URLSearchParams): APIReturn<dt.Popular<dt.Topping>> => {
            try {
                // Get the start date, end date, and limit from the URL parameters
                const startDate = args.get('start');
                const endDate = args.get('end');
                const limit = args.get('limit');
                // If any of the parameters are missing, throw an error
                if (!startDate) throw new Error('startDate is required');
                if (!endDate) throw new Error('endDate is required');
                if (!limit) throw new Error('limit is required');
                
                // Query the database for the most popular toppings within the specified date range
                const popularToppings = await sql`SELECT Topping.name, COUNT(AddedToppings.toppingID) as "count"
                FROM AddedToppings
                    JOIN Topping ON (Topping.ID = AddedToppings.toppingID)
                    JOIN Pizza ON (Pizza.ID = AddedToppings.pizzaID)
                    JOIN "Order" ON ("Order".ID = Pizza.orderID)
                    WHERE "Order".dateOrdered BETWEEN ${startDate} AND ${endDate}
                    GROUP BY Topping.name
                    ORDER BY count DESC
                    LIMIT ${limit};`;

                // Provided there has been no error, return OK, with the popular toppings
                return {ok: popularToppings.map((topping: any) => [topping.name, topping.count])};
                
            } catch (error) {
                // If there is an error, log it and return an error message
                console.warn(error);
                return {err: "Unable to get popular toppings. Try again later!"};
            }
        },

        // TODO: dummy function, implement real database connection
        'get_popular_dough': async (args: URLSearchParams, body: any): APIReturn<dt.Popular<dt.Dough>> => {
            return new Promise((resolve) => {
                resolve({ok: [
                    [{type: 'regular', size: 'large'}, 43],
                    [{type: 'regular', size: 'small'}, 33],
                    [{type: 'stuffed', size: 'large'}, 20],
                    [{type: 'pretzel', size: 'personal'}, 5],
                    [{type: 'pretzel', size: 'medium'}, 1],
                ]});
            });
        },

        /** get_popular_sauce (List API)
         * This API lists the popular sauces 
         * @params None
         * @returns A list of strings, each representing popular sauces.
         * Example: ['tomato', 73],
                    ['pesto', 13],
                    ['alfredo', 8],
        */
        'get_popular_sauce': async (args: URLSearchParams, body: any): APIReturn<dt.Popular<dt.Sauce>> => {
            try {
                const result = await sql `
                    WITH PizzaSauce AS (
                        SELECT p.ID AS pizza_id, st.name AS sauce_name
                        FROM Pizza p
                        JOIN Sauce s ON p.sauceID = s.ID
                        JOIN SauceType st ON s.sauceTypeID = st.ID
                    )'
                    SELECT sauce_name, COUNT(*) AS count
                    FROM PizzaSauce
                    GROUP BY sauce_name
                    ORDER BY count DESC;`;

                const popularSauces: dt.Popular<dt.Sauce>= result.rows.map((row: any) => [row.sauve_name, parseInt(row.count, 10)]);
                return {ok: popularSauces}
            } catch (error) {
                console.log(error);
                return {err: "Unable to get popular sauces. Try again later!"};
            }
        },

        // TODO: dummy function, implement real database connection
        'get_popular_combo': async (args: URLSearchParams, body: any): APIReturn<dt.Popular<string>> => {
            return new Promise((resolve) => {
                resolve({ok: [
                    ['pepperoni/sausage', 43],
                    ['ham/pineapple', 33],
                    ['broccoli/extra cheese', 20],
                    ['mushrooms/pepperoni', 5],
                    ['anchovies/pepperoni', 1],
                ]});
            });
        },

        /** list_available_sides (List API)
         * This API lists all available sides in the database for the pizza shop.
         * @params None
         * @returns A list of strings, each representing a side available for purchase.
         * Example: ['cookie', 'breadsticks', '2L soda']
        */
        'list_available_sides': async (args: URLSearchParams, body: any): APIReturn<dt.Side[]> => {
            try {
                const sides = await sql`SELECT name FROM Side;`;
                return {ok: sides.map(side => side.name)};
            } catch (error) {
                console.log(error);
                return {err: "Unable to get all available sides. Try again later!"};
            }
        },
        /**list_available_toppings (List API)
         * This API lists all available toppings in the database for the pizza shop.
         * @params None
         * @returns A list of strings, each representing a topping available for purchase.
         * Example: ['pepperoni', 'mushroom', 'onion']
         */
        'list_available_toppings': async (args: URLSearchParams, body: any): APIReturn<dt.Topping[]> => {
            try { 
                const toppings = await sql`SELECT name FROM Topping;`;
                return {ok: toppings.map(topping => topping.name)};
            } catch (error) {
                console.log(error);
                return {err: "Unable to get all toppings. Try again later!"};
            }
        },
        /**list_available_sauces (List API)
         * This API lists all availabvlable sauces in the database for the pizza shop.
         * @params None
         * @returns A list of strings, each representing a sauce available for purchase. 
         * Example: ['marinara', 'pesto', 'alfredo']
         */
        'list_available_sauces': async (args: URLSearchParams, body: any): APIReturn<dt.Sauce[]> => {
            try {
                const sauces = await sql`SELECT name FROM SauceType;`;
                return {ok: sauces.map(sauce => sauce.name)};
            } catch (error) {
                console.log(error);
                return {err: "Unable to get all sauces. Try again later!"};
            }
        },
        /**list_available_dough (List API)
         * This API lists all available dough types in the database for the pizza shop.
         * @params None
         * @returns A list of strings, each representing a dough type available for purchase.
         * Example: ['regular', 'stuffed', 'pretzel']
         */
        'list_available_dough': async (args: URLSearchParams, body: any): APIReturn<dt.DoughType[]> => {
            try {
                const doughs = await sql`SELECT name FROM DoughType;`;
                return {ok: doughs.map(dough => dough.name)};
            } catch (error) {
                console.log(error);
                return {err: "Unable to get all dough types. Try again later!"};
            }
        },
        /** list_available_sizes (List API)
         * This API lists all available dough sizes in the database for the pizza shop.
         * @params None
         * @returns A list of strings, each representing a dough size available for purchase.
         * Example: ['small', 'medium', 'large']
         */
        'list_available_sizes': async (args: URLSearchParams, body: any): APIReturn<dt.DoughSize[]> => {
            try {
                const sizes = await sql`SELECT name FROM DoughSize;`;
                return {ok: sizes.map(size => size.name)};
            } catch (error) {
                console.log(error);
                return {err: "Unable to get all dough sizes. Try again later!"};
            }
        },

        // TODO: dummy function, implement real database connection
        'daily_topping_sales': async (args: URLSearchParams, body: any): APIReturn<dt.Trend> => {
            return new Promise((resolve) => {
                resolve({ok: [
                    [new Date('2025-03-01'),  5],
                    [new Date('2025-03-02'),  2],
                    [new Date('2025-03-03'),  3],
                    [new Date('2025-03-04'),  7],
                    [new Date('2025-03-05'), 18],
                    [new Date('2025-03-06'), 10],
                    [new Date('2025-03-07'),  8],
                    [new Date('2025-03-08'),  2],
                    [new Date('2025-03-09'),  7],
                    [new Date('2025-03-10'),  9],
                    [new Date('2025-03-11'),  1],
                    [new Date('2025-03-12'),  0],
                    [new Date('2025-03-13'),  2],
                ]});
            });
        },

        // Returns a list of order numbers which correspond to orders made on the input date
        'list_orders_made_on': async (args: URLSearchParams, body: any): APIReturn<{ orderNumber: string }[]> => {
            const date = args.get('date');
            if (!date) {
                return { err: "Date parameter is required" };
            }

            try {
                const orderNumbers = await sql<{ orderNumber: string }[]>`
                    SELECT "Order".orderNumber AS "orderNumber" FROM "Order"
                `;
                
                return { ok: orderNumbers };

            } catch (error) {
                console.log(error);
                return { err: `Unable to get all orders made on ${date}. Try again later!` };
            }
        },
        /** get_revenue_in_range
         * 
         */
        'get_revenue_in_range': async (args: URLSearchParams, body: any): APIReturn<{ orderNumber: string }[]> => {
            const start = args.get('start');
            const end = args.get('end');

            if(!start || !end){
                return { err: "Start AND end date parameter are required" };
            }
            try {
                
            } catch (error) {
                return { err: `Unable to get the revenue within this range` };
            }
        },


    }[apiEndpoint];

    if (apiFn) {
        return await apiFn(url.searchParams, body);
    } else {
        return new Promise((resolve) => {
            resolve({err: 'api endpoint does not exist'});
        });
    }
}


