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

Open your console and get into postgres as the postgres user.

Run: 

psql -U postgres -c 'DROP DATABASE popularpizza;'
    psql -U postgres -f PizzariaDB.txt
    psql -U postgres -f DB_data.txt -d popularpizza

then run in your Directory where this is stored, with urpassword as your postgres password the following: 
env PGPASSWORD=urpassword npm run start 

Go to localhost 8000 in your browser.

Enjoy!
```
