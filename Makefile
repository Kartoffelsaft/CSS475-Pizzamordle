
.build/deps: .build package.json tsconfig.json package-lock.json
	npm i
	touch .build/deps

.build/db: .build PizzariaDB.txt DB_data.txt
	psql -U postgres -c 'DROP DATABASE popularpizza;'
	psql -U postgres -f PizzariaDB.txt
	psql -U postgres -f DB_data.txt -d popularpizza
	touch .build/db

run: .build/deps .build/db
	npm run start

clean:
	rm -r .build

.build:
	mkdir .build
