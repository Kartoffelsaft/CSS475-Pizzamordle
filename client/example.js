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
function dropdownFromList(list, name) {
    let ret = document.createElement('select');
    for (let item of list) {
        let option = document.createElement('option');
        option.value = item;
        option.innerText = item;
        ret.add(option);
    }
    ret.name = name;

    return ret;
}

function addPizza() {
    let newPizza = document.createElement('li');
    newPizza.className = 'pizza'

    let deleteButton = document.createElement('button');
    deleteButton.onclick = () => {newSide.remove();};
    deleteButton.innerText = 'X';
    deleteButton.className = 'deleteButton';
    newPizza.appendChild(deleteButton);

    newPizza.appendChild(dropdownFromList(sizes, 'pizzaOptionSize'));
    newPizza.appendChild(dropdownFromList(dough, 'pizzaOptionDough'));
    newPizza.appendChild(dropdownFromList(sauces, 'pizzaOptionSauce'));

    let toppingList = document.createElement('ul');
    toppingList.id = 'pizzaToppings'; // why do some HTML elements not have a name field???
    toppingList.className = 'topping';
    newPizza.appendChild(toppingList);

    let addToppingButton = document.createElement('button');
    addToppingButton.onclick = () => {
        let toppingLine = document.createElement('li');

        let deleteButton = document.createElement('button');
        deleteButton.onclick = () => {toppingLine.remove();};
        deleteButton.innerText = 'X';
        deleteButton.className = 'deleteButton';
        toppingLine.appendChild(deleteButton);

        toppingLine.appendChild(dropdownFromList(toppings, 'pizzaOptionTopping'));
        toppingList.appendChild(toppingLine);
    };
    addToppingButton.innerText = 'Add topping';
    addToppingButton.className = 'addToppingButton';
    newPizza.appendChild(addToppingButton);

    orderItems.appendChild(newPizza);
}

function addSide() {
    let newSide = document.createElement('li');
    newSide.className = 'side';

    let deleteButton = document.createElement('button');
    deleteButton.onclick = () => {newSide.remove();};
    deleteButton.innerText = 'X';
    deleteButton.className = 'deleteButton';

    newSide.appendChild(deleteButton);
    newSide.appendChild(dropdownFromList(sides, 'sideOption'));
    orderItems.appendChild(newSide);
}

function submitOrder() {
    /** @type {(String|Object)[]} */
    let orderItems = [];
    let orderLines = document.getElementById('orderitems');

    for (let orderLine of orderLines.children) {
        if (orderLine.classList.contains('side')) {
            /** @type {HTMLSelectElement} */
            let selection = orderLine.children.namedItem('sideOption');
            orderItems.push(selection.children[selection.selectedIndex].value);
        }
        if (orderLine.classList.contains('pizza')) {
            let selectionSize = orderLine.children.namedItem('pizzaOptionSize');
            let selectionDough = orderLine.children.namedItem('pizzaOptionDough');
            let selectionSauce = orderLine.children.namedItem('pizzaOptionSauce');

            let thisPizza = {
                'dough': {
                    'type': selectionDough.children[selectionDough.selectedIndex].value,
                    'size': selectionSize.children[selectionSize.selectedIndex].value,
                },
                'sauce': selectionSauce.children[selectionSauce.selectedIndex].value,
                'toppings': []
            };

            for (let toppingLine of orderLine.children.namedItem('pizzaToppings').children) {
                let selectionTopping = toppingLine.children.namedItem('pizzaOptionTopping');
                thisPizza.toppings.push(selectionTopping.children[selectionTopping.selectedIndex].value);
            }

            orderItems.push(thisPizza);
        }
    }

    console.log(orderItems);

    fetch("http://localhost:8000/api/create_order", {
        method: "POST",
        body: JSON.stringify(orderItems),
    }).then((response) => {
        response.json().then((ordernum) => {
            exampleOutput.innerText = ordernum;
        });
    });
}

// This feels morally wrong, but we aren't calling the server 
// before this point so it should be fine
function cancelOrder() {
    orderItems.innerHTML = '';
}
