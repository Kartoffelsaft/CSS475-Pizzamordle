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
        response.write(JSON.stringify(await apiCall(url)));
        response.end();


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

async function apiCall(url: URL): Promise<any> {
    const apiEndpoint = url.pathname.substring(url.pathname.indexOf('/', 1) + 1)
    console.log("Call of api endpoint: " + apiEndpoint);

    const apiFn = {
        'create_order': async (args: URLSearchParams): Promise<Number> => {
            let order: dt.Order = await JSON.parse(args.get('order'));
            let phone: String | null = args.get('phone');

            let query = await sql`
                SELECT 2 AS ordernumber;
            `;

            return query[0].ordernumber;
        }
    }[apiEndpoint];

    if (apiFn) {
        return await apiFn(url.searchParams);
    } else {
        return undefined;
    }
}

module.exports = {};
