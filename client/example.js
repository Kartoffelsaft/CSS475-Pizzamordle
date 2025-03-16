//                             --- COMMON ---                                 //
// -------------------------------------------------------------------------- //

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

//                            --- ORDERING MENU ---                           //
// -------------------------------------------------------------------------- //

var ordernumShown = document.getElementById('ordernum');
var orderItems = document.getElementById('orderitems');

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
            orderItems.push({
                side: selection.children[selection.selectedIndex].value,
                quantity: 1
            });
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

    fetch("/api/create_order", {
        method: "POST",
        body: JSON.stringify(orderItems),
    }).then((response) => {
        response.json().then((ordernum) => {
            ordernumShown.innerText = ordernum;
        });
    });
}

// This feels morally wrong, but we aren't calling the server 
// before this point so it should be fine
function cancelOrder() {
    orderItems.innerHTML = '';
}

//                     --- DASHBOARD & STATS MENU ---                         //
// -------------------------------------------------------------------------- //

var outputStatsShown = document.getElementById('outputStatsDisplay');

function displayPopular(items, what) {
    outputStatsShown.innerHTML = '';

    let table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th scope='col'>${what}</th>
                <th scope='col'>Quantity</th>
            </tr>
        </thead>
    `;
    let tableData = document.createElement('tbody');

    for (let [item, quantity] of items) {
        let row = document.createElement('tr');
        row.innerHTML = `
            <tr>
            <td>${item}</td>
            <td>${quantity}</td>
            </tr>
        `;
        tableData.appendChild(row);
    }

    table.appendChild(tableData);
    outputStatsShown.appendChild(table);
}

function popularQueryParams() {
    let params = [];

    let limit = document.getElementById('popLimit').value;
    params.push(`limit=${encodeURIComponent(limit)}`);

    if (document.getElementById('popAllTime').checked) {
    } else {
        // TODO: handle start/end dates
    }

    return params.join('&');
}

function getPopularToppings() {
    fetch(
        `/api/get_popular_toppings?${popularQueryParams()}`
    ).then((resp) => {
        resp.json().then((items) => displayPopular(items, 'Topping'));
    });
}

function getPopularDough() {
    fetch(
        `/api/get_popular_dough?${popularQueryParams()}`
    ).then((resp) => {
        resp.json().then((items) => displayPopular(items, 'Dough'));
    });
}

function getPopularSauce() {
    fetch(
        `/api/get_popular_sauce?${popularQueryParams()}`
    ).then((resp) => {
        resp.json().then((items) => displayPopular(items, 'Sauce'));
    });
}

function getPopularSide() {
    fetch(
        `/api/get_popular_side?${popularQueryParams()}`
    ).then((resp) => {
        resp.json().then((items) => displayPopular(items, 'Side'));
    });
}

function getPopularCombo() {
    fetch(
        `/api/get_popular_combo?${popularQueryParams()}`
    ).then((resp) => {
        resp.json().then((items) => displayPopular(items, 'Combo'));
    });
}

function displayTrend(data) {
    outputStatsShown.innerHTML = '';
    if (data.length <= 0) {
        outputStatsShown.innerText = 'no trend data';
        return;
    }

    let graphCanvas = document.createElement('canvas');
    graphCanvas.width = 400;
    graphCanvas.height = 200;

    let ctx = graphCanvas.getContext('2d');

    ctx.fillStyle = '#ccc'
    ctx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);

    let max = 0;
    for (let [day, datum] of data) {
        if (datum > max) max = datum;
    }

    const iToX = (i) => i * graphCanvas.width / (data.length-1);
    const vToY = (v) => graphCanvas.height - (v * graphCanvas.height / max);

    ctx.strokeStyle = '#117';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(iToX(0), vToY(data[0][1]));
    for (let i = 1; i < data.length; i++) {
        ctx.lineTo(iToX(i), vToY(data[i][1]));
    }
    ctx.stroke();

    outputStatsShown.appendChild(graphCanvas);
}

function getDailyToppingSales() {
    fetch('/api/daily_topping_sales').then((response) => {
        response.json().then((data) => {
            displayTrend(data);
        });
    });
}


