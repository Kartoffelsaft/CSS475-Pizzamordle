To run the project:
```bash
cd $WHEREVER_YOU_EXTRACTED_THIS
npm i
npm run start
```

This for this to work (i.e. not crash) it assumes that postgres is running with
a database (`mydb`) that has a `Person` table with some people listed. To set
this up, run:

```bash
psql -U postgres
```

```SQL
CREATE DATABASE mydb;

\c mydb \\

CREATE TABLE Person (
    id integer NOT NULL,
    firstname character varying(20),
    lastname character varying(20) NOT NULL
);

INSERT INTO Person VALUES (1, 'Ben', 'Findley');
INSERT INTO Person VALUES (2, 'Jac', 'Chambers');
INSERT INTO Person VALUES (3, 'Karsten', 'Schmidt');
INSERT INTO Person VALUES (4, 'Kesuke', 'Maeda');
```

Open your browser to `http://localhost:8000/`, and it should say "There are 4
people in the database"
