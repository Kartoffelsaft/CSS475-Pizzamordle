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
                response.write(JSON.stringify(await apiCall(url, bodyJson)));
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

async function apiCall(url: URL, body: any): Promise<any> {
    const apiEndpoint = url.pathname.substring(url.pathname.indexOf('/', 1) + 1)
    console.log("Call of api endpoint: " + apiEndpoint);

    const apiFn = {
        // TODO: dummy function
        'create_order': async (args: URLSearchParams, body: any): Promise<String> => {
            let order: dt.Order = await JSON.parse(args.get('order'));
            let phone: String | null = args.get('phone');

            let query = await sql`
                SELECT '2' AS ordernumber;
            `;

            return query[0].ordernumber;
        },

        /**get_order (Detail API) By Karsten Schmidt
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
        'get_order': async (args: URLSearchParams, body: any): Promise<dt.PlacedOrder> => {
            /* 
            Query to get specific order pizza info:
            SELECT ordernumber, phonenumber, dateordered, pizzaNumber, DS.name AS "doughSize", DT.name AS "doughType", ST.name AS "sauceType", T.name AS "Topping"
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
            ORDER BY pizzaNumber;

            Query to get all order sides info:
            SELECT S.name AS "Side", ADS.quantity as "Quantity"
            FROM "Order" O
                JOIN AddedSides ADS ON (ADS.orderID = O.ID)
                JOIN Side S ON (S.ID = ADS.sideID)
            WHERE O.orderNumber = ${orderNumber};
            */
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
            const pizzaMap = new Map<string, dt.Pizza>();
            
            orderPizzaDetails.forEach(pizza => {
                // Check if this is a new unique pizza, then fill in the singular items (dough, sauce)
                if(!pizzaMap.has(pizza.pizzaNumber)) {
                    // Create the dough object to add to the pizza object
                    const dough = new dt.Dough();
                    dough.type = pizza.doughType as dt.DoughType;
                    dough.size = pizza.doughSize as dt.DoughSize;

                    // Create the pizza object and add dough and sauce
                    const pizzaObj = new dt.Pizza();
                    pizzaObj.dough = dough;
                    pizzaObj.sauce = pizza.sauce as dt.Sauce;   
                    // Toppings should be empty in this case until we append later
                    pizzaObj.toppings = [];

                    pizzaMap.set(pizza.pizzaNumber, pizzaObj);
                }

                // Add all toppings to each pizza object in the map
                const pizzaObj = pizzaMap.get(pizza.pizzaNumber);
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
            const sidesMap = new Map<string, dt.AddedSide>();

            orderSideDetails.forEach(side => {
                if(!sidesMap.has(side.Side)){
                    const tmpSide = side.Side as dt.Side;
                    const sideObj = new dt.AddedSide();
                    sideObj.side = tmpSide;
                    sideObj.quantity = 0;
                    sidesMap.set(side.Side, sideObj);
                }
                // Add the quantity of the specified side, to the side
                const sideObj = sidesMap.get(side.Side);
                sideObj.quantity = (sideObj.quantity + (side.quantity as number));

            })

            // Combine sides and pizzas to the order
            const pizzas = Array.from(pizzaMap.values());
            const allSides = Array.from(sidesMap.values());

            // If someone just got sides, but no pizzas, we need to still get order details. 
            // Or for some reason there is an order with nothing associated to it
            if(pizzaMap.size === 0){
                const boringOrder = await sql`SELECT ordernumber AS "orderNumber", phonenumber, dateordered AS "dateOrdered"
                FROM "Order" O
                WHERE O.ordernumber = '${orderNumber}';`

                const placedOrder = new dt.PlacedOrder();
                placedOrder.orderNumber = boringOrder[0].orderNumber;
                placedOrder.phone = boringOrder[0].phonenumber;
                placedOrder.dateOrdered = new Date(boringOrder[0].dateOrdered);
                placedOrder.contents = [...pizzas, ...allSides];
            } else {
                // Create the placedOrder Object from the pizzas and sides
                const placedOrder = new dt.PlacedOrder();
                placedOrder.orderNumber = orderPizzaDetails[0].orderNumber;
                placedOrder.phone = orderPizzaDetails[0].phonenumber;
                placedOrder.dateOrdered = new Date(orderPizzaDetails[0].dateOrdered);
                placedOrder.contents = [...pizzas, ...allSides];

                return placedOrder;
            }
            } catch (error) {
                console.log(error);
                throw new Error('Error fetching order details');
            }
        },

        // TODO: dummy function, implement real database connection
        'get_latest_ordernum': async (args: URLSearchParams, body: any): Promise<String> => {
            let phoneNum: String | null = args.get('phone');
            return new Promise((resolve) => resolve('2'));
        },

        // TODO: dummy function, implement real database connection
        'get_popular_sides': async (args: URLSearchParams, body: any): Promise<dt.Popular<dt.Side>> => {
            return new Promise((resolve) => {
                resolve([
                    ['cookie', 58],
                    ['breadsticks', 33],
                    ['2L soda', 7],
                ]);
            });
        },

        // TODO: dummy function, implement real database connection
        'get_popular_toppings': async (args: URLSearchParams, body: any): Promise<dt.Popular<dt.Topping>> => {
            return new Promise((resolve) => {
                resolve([
                    ['pepperoni', 101],
                    ['mushroom', 34],
                ]);
            });
        },

        // TODO: dummy function, implement real database connection
        'get_popular_dough': async (args: URLSearchParams, body: any): Promise<dt.Popular<dt.Dough>> => {
            return new Promise((resolve) => {
                resolve([
                    [{type: 'regular', size: 'large'}, 43],
                    [{type: 'regular', size: 'small'}, 33],
                    [{type: 'stuffed', size: 'large'}, 20],
                    [{type: 'pretzel', size: 'personal'}, 5],
                    [{type: 'pretzel', size: 'medium'}, 1],
                ]);
            });
        },

        /** list_available_sides
         * This API lists all available sides in the database for the pizza shop.
         * @params None
         * @returns A list of strings, each representing a side available for purchase.
         * Example: ['cookie', 'breadsticks', '2L soda']
        */
        'list_available_sides': async (args: URLSearchParams, body: any): Promise<dt.Side[]> => {
            try {
                const sides = await sql`SELECT name FROM Side;`;
                return sides.map(side => side.name);
            } catch (error) {
                console.log(error);
                return [];
            }
        },
        /**list_available_toppings
         * This API lists all available toppings in the database for the pizza shop.
         * @params None
         * @returns A list of strings, each representing a topping available for purchase.
         * Example: ['pepperoni', 'mushroom', 'onion']
         */
        'list_available_toppings': async (args: URLSearchParams, body: any): Promise<dt.Topping[]> => {
            try { 
                const toppings = await sql`SELECT name FROM Topping;`;
                return toppings.map(topping => topping.name);
            } catch (error) {
                console.log(error);
                return [];
            }
        },
        /**list_available_sauces
         * This API lists all availabvlable sauces in the database for the pizza shop.
         * @params None
         * @returns A list of strings, each representing a sauce available for purchase. 
         * Example: ['marinara', 'pesto', 'alfredo']
         */
        'list_available_sauces': async (args: URLSearchParams, body: any): Promise<dt.Sauce[]> => {
            try {
                const sauces = await sql`SELECT name FROM SauceType;`;
                return sauces.map(sauce => sauce.name);
            } catch (error) {
                console.log(error);
                return [];
            }
        },
        /**list_available_dough
         * This API lists all available dough types in the database for the pizza shop.
         * @params None
         * @returns A list of strings, each representing a dough type available for purchase.
         * Example: ['regular', 'stuffed', 'pretzel']
         */
        'list_available_dough': async (args: URLSearchParams, body: any): Promise<dt.DoughType[]> => {
            try {
                const doughs = await sql`SELECT name FROM DoughType;`;
                return doughs.map(dough => dough.name);
            } catch (error) {
                console.log(error);
                return [];
            }
        },
        /** list_available_sizes
         * This API lists all available dough sizes in the database for the pizza shop.
         * @params None
         * @returns A list of strings, each representing a dough size available for purchase.
         * Example: ['small', 'medium', 'large']
         */
        'list_available_sizes': async (args: URLSearchParams, body: any): Promise<dt.DoughSize[]> => {
            try {
                const sizes = await sql`SELECT name FROM DoughSize;`;
                return sizes.map(size => size.name);
            } catch (error) {
                console.log(error);
                return [];
            }
        },
    }[apiEndpoint];

    if (apiFn) {
        return await apiFn(url.searchParams, body);
    } else {
        return undefined;
    }
}


