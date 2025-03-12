var exampleOutput = document.getElementById('output');
var exampleOutput2 = document.getElementById('output2');
var orderItems = document.getElementById('orderitems');

var sides = [];
var toppings = [];
var sauces = [];
var dough = [];
var sizes = [];

fetch('/api/list_available_sides').then((response) => {
    response.json().then((avail_sides) => sides = avail_sides);
});
fetch('/api/list_available_toppings').then((response) => {
    response.json().then((avail_toppings) => toppings = avail_toppings);
});
fetch('/api/list_available_sauces').then((response) => {
    response.json().then((avail_sauces) => sauces = avail_sauces);
});
fetch('/api/list_available_dough').then((response) => {
    response.json().then((avail_dough) => dough = avail_dough);
});
fetch('/api/list_available_sizes').then((response) => {
    response.json().then((avail_sizes) => sizes = avail_sizes);
});

fetch("http://localhost:8000/api/create_order", {
    method: "POST",
    body: JSON.stringify([]),
}).then((response) => {
    response.json().then((ordernum) => {
        exampleOutput.innerText = ordernum;
    });
});

fetch("http://localhost:8000/api/get_order?orderNumber=2", {
    method: "GET",
}).then((response) => {
    response.json().then((order) => {
        exampleOutput2.innerText = JSON.stringify(order);
    });
});

/**
 * @param {String[]} list
 * @returns {HTMLSelectElement}
 */
function dropdownFromList(list) {
    let ret = document.createElement('select');
    for (let item of list) {
        let option = document.createElement('option');
        option.value = item;
        option.innerText = item;
        ret.add(option);
    }

    return ret;
}

function addPizza() {
    let newPizza = document.createElement('li');

    let deleteButton = document.createElement('button');
    deleteButton.onclick = () => {newSide.remove();};
    deleteButton.innerText = 'X';
    newPizza.appendChild(deleteButton);

    newPizza.appendChild(dropdownFromList(sizes));
    newPizza.appendChild(dropdownFromList(dough));
    newPizza.appendChild(dropdownFromList(sauces));

    let toppingList = document.createElement('ul');
    newPizza.appendChild(toppingList);

    let addToppingButton = document.createElement('button');
    addToppingButton.onclick = () => {
        let toppingLine = document.createElement('li');

        let deleteButton = document.createElement('button');
        deleteButton.onclick = () => {toppingLine.remove();};
        deleteButton.innerText = 'X';
        toppingLine.appendChild(deleteButton);

        toppingLine.appendChild(dropdownFromList(toppings));
        toppingList.appendChild(toppingLine);
    };
    addToppingButton.innerText = 'Add topping';
    newPizza.appendChild(addToppingButton);

    orderItems.appendChild(newPizza);
}
function addSide() {
    let newSide = document.createElement('li');
    let deleteButton = document.createElement('button');
    deleteButton.onclick = () => {newSide.remove();};
    deleteButton.innerText = 'X';
    newSide.appendChild(deleteButton);
    newSide.appendChild(dropdownFromList(sides));
    orderItems.appendChild(newSide);
}
