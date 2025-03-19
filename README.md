# [Pizzamordle](https://github.com/Kartoffelsaft/CSS475-Pizzamordle)

To run the project:
```bash
make run
```

This assumes you have postgres installed running on a user named postgres, and
that the postgres user doesn't have a password (setting the `PGPASSWORD` env
var *may* work but is untested).

You can use the UI at `http://localhost:8000/`.

Work credit & API desciptions are listed in [credit.md](./credit.md)

Note: If you cannot get make run to work for you, the longer instructions are as follows:
```
Load into the project directory

run:
npm i

Open your console and get into postgres as the postgres user. Ensure your DB has no password, or disable it

To disable the password requirement for PostgreSQL, you need to modify the pg_hba.conf file to set the authentication method to "trust" for the relevant connections. (Should be IPv4 and IPv6 labels under method at the bottom of pg_hba inside of the data folder wherever you have postgres set it from `scram-sha-256` or whatever you have to trust).

Run our PizzariaDB.txt file

Run DB_data.txt to populate the DB

Run the command npm run start 

Go to localhost 8000 in your browser.

Enjoy!
```
