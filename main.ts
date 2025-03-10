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
                let bodyJson = await JSON.parse(body);
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

        // TODO: dummy function, implement real database connection
        'get_order': async (args: URLSearchParams, body: any): Promise<dt.PlacedOrder> => {
            let ordernum: String = args.get('orderNumber');

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
    }[apiEndpoint];

    if (apiFn) {
        return await apiFn(url.searchParams, body);
    } else {
        return undefined;
    }
}

module.exports = {};
