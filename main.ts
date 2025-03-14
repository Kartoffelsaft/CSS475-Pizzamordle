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

        // TODO: dummy function, implement real database connection (DETAIL API)
        'get_order': async (args: URLSearchParams, body: any): Promise<dt.PlacedOrder> => {
            let ordernum: String = args.get('orderNumber');
            try {
                
            } catch (error) {
                console.log(error);
            }
            return new Promise<dt.PlacedOrder>((resolve) => {
                resolve({
                    phone: '420-666-6969',
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
                });
            });
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
        // TODO: dummy function, implement real database connection
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

module.exports = {};
