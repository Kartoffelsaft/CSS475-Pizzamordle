//                             --- COMMON ---                                 //
// -------------------------------------------------------------------------- //

var sides = [];
var toppings = [];
var sauces = [];
var dough = [];
var sizes = [];

// load all the DB's menu items client side
fetch('/api/list_available_sides').then((response) => {
    response.json().then((avail_sides) => {
        sides = avail_sides
        fillAllSelections('sides', sides);
    });
});
fetch('/api/list_available_toppings').then((response) => {
    response.json().then((avail_toppings) => {
        toppings = avail_toppings
        fillAllSelections('toppings', toppings);
    });
});
fetch('/api/list_available_sauces').then((response) => {
    response.json().then((avail_sauces) => {
        sauces = avail_sauces
        fillAllSelections('sauces', sauces);
    });
});
fetch('/api/list_available_dough').then((response) => {
    response.json().then((avail_dough) => {
        dough = avail_dough
        fillAllSelections('dough', dough);
    });
});
fetch('/api/list_available_sizes').then((response) => {
    response.json().then((avail_sizes) => {
        sizes = avail_sizes
        fillAllSelections('sizes', sizes);
    });
});

/**
 * @param {string} what
 * @param {string[]} options
 */
function fillAllSelections(what, options) {
    let optionElems = options.map((option) => {
        let elem = document.createElement('option');
        elem.innerText = option;
        elem.value = option;
        return elem;
    });

    for (let selection of document.getElementsByClassName(what)) {
        if (selection.tagName === 'SELECT') {
            optionElems.forEach((elem) => selection.add(elem));
        }
    }
}

//                            --- ORDERING MENU ---                           //
// -------------------------------------------------------------------------- //

// Shows the ordernum for the order the user just posted
var ordernumShown = document.getElementById('ordernum');
// HTML DOM list of all the items the user has added
var orderItems = document.getElementById('orderitems');

/**
 * Create an HTML <select> element with <option>s based on the list of strings
 * given
 *
 * @param {String[]} list
 * @param {String} name
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

/**
 * Add a pizza to the orderItems list
 */
function addPizza() {
    let newPizza = document.createElement('li');
    newPizza.className = 'pizza';

    let deleteButton = document.createElement('button');
    deleteButton.onclick = () => {
        for (child in newPizza.children) {
            child.innerHTML = '';
        }
        newPizza.remove();
    };
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

/**
 * Add a side to the orderItems list
 */
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

/**
 * Parses the DOM in orderItems to determine the order the user wants to 
 * submit and POSTs it to /api/create_pizza
 */
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

    if (orderItems.length == 0) {
        alert("Orders with no contents are not allowed.");
        return;
    }

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
    if (confirm("Are you sure you want to cancel this order?")) {
        orderItems.innerHTML = '';
    }
    return;
    
}

//                     --- DASHBOARD & STATS MENU ---                         //
// -------------------------------------------------------------------------- //

var outputStatsShown = document.getElementById('outputStatsDisplay');

/**
 * Generate a table of of all the items
 *
 * @param {[string, number][]} items
 * @param {string} what
 */
function displayPopular(items, what) {
    if (!items) {
        displayError("Unknown Error: displayPopular(items, what): items was null");
    }
    if (!what) {
        displayError("Unknown Error: displayPopular(items, what): what was null");
    }

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

/**
 * Extract the user's input for the popular query, and turn it into a query 
 * string
 *
 * @returns {string}
 */
function popularQueryParams() {
    const params = new URLSearchParams();
    params.set('limit', document.getElementById('popLimit').value);

    if (document.getElementById('popAllTime').checked) {
        params.set('start', '578-01-01');
        params.set('end', '9999-12-31');
    } else {
        params.set('start', document.getElementById('popStart').value);
        params.set('end', document.getElementById('popEnd').value);
    }

    return params.toString();
}

// buttons to query specific popularities
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
        resp.json().then((items) => {
            items = items.map(([dough, quantity]) => [`${dough.size} ${dough.type}`, quantity]);
            displayPopular(items, 'Dough')
        });
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

/**
 * Draws a graph of the data to the output region
 *
 * @param {[Date, number][]} data
 */
function displayTrend(data) {
    if (data.length <= 0) {
        displayError('no trend data');
        return;
    }
    if (data.length <= 1) {
        displayError('not enough trend data');
        return;
    }

    outputStatsShown.innerHTML = '';

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
    let earliest = data[0][0].valueOf();
    let latest = data[data.length-1][0].valueOf();
    let timeSpan = latest - earliest;

    const dateToX = (d) => (d.valueOf()-earliest) * (graphCanvas.width-10) / timeSpan + 5;
    const valueToY = (v) => graphCanvas.height - (v * (graphCanvas.height-10) / max) - 5;

    ctx.strokeStyle = '#117';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(dateToX(data[0][0]), valueToY(data[0][1]));
    let i = 0;
    for (
        let day = new Date(data[0][0]); 
        i < data.length; 
        day.setDate(day.getDate()+1)
    ) {
        // there is no data point for this day, assume 0 sales
        if (day.valueOf() < data[i][0].valueOf()) {
            ctx.lineTo(dateToX(day), valueToY(0));
        } else {
            ctx.lineTo(dateToX(data[i][0]), valueToY(data[i][1]));
            i++;
        }
    }
    ctx.stroke();

    outputStatsShown.appendChild(graphCanvas);
}

// buttons to draw the graphs for topping & sauce sales
function getDailyToppingSales() {
    let params = new URLSearchParams();

    let selectionTopping = document.getElementById('toppingName');

    if (!selectionTopping) {
        displayError("Topping is required for getDailyToppingSales");
    }

    params.append('topping', selectionTopping.children[selectionTopping.selectedIndex].value);

    if (document.getElementById('topAllTime').checked) {
        params.set('start', '578-01-01');
        params.set('end', '9999-12-31');
    } else {
        params.set('start', document.getElementById('topStartDate').value);
        params.set('end', document.getElementById('topEndDate').value);
    }

    fetch(`/api/daily_topping_sales?${params.toString()}`).then((response) => {
        response.json().then((data) => {
            data = data.map(([date, value]) => [new Date(date), +value]);
            displayTrend(data);
        });
    });
}
function getDailySauceSales() {
    let params = new URLSearchParams();

    let selectionSauce = document.getElementById('sauceName');

    if (!selectionSauce) {
        displayError("Sauce is required for getDailySauceSales");
    }

    params.append('sauce', selectionSauce.children[selectionSauce.selectedIndex].value);

    if (document.getElementById('sauceAllTime').checked) {
        params.set('start', '578-01-01');
        params.set('end', '9999-12-31');
    } else {
        params.set('start', document.getElementById('sauceStartDate').value);
        params.set('end', document.getElementById('sauceEndDate').value);
    }

    fetch(`/api/daily_sauce_sales?${params.toString()}`).then((response) => {
        response.json().then((data) => {
            data = data.map(([date, value]) => [new Date(date), +value]);
            displayTrend(data);
        });
    });
}

function displayError(text) {
    const outputStatsDisplay = document.getElementById('outputStatsDisplay');
    outputStatsDisplay.innerText = text;
}

function listOrdersMadeOn() {
    console.log(document.getElementById('orderDate').value);
    if (document.getElementById('orderDate').value == '') {
        displayError("Order date required.");
        return;
    }

    fetch(
        `/api/list_orders_made_on?date=${document.getElementById('orderDate').value}`
    ).then((resp) => {
        resp.json().then((orderNums) => {
            const realOrderNumbers = orderNums.map(orderNumber => orderNumber.orderNumber);
            console.log(realOrderNumbers);

            outputStatsShown.innerHTML = '';

            let table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th scope='col'>Order Number</th>
                        <th scope='col'>Items</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            let tableBody = table.querySelector('tbody');

            let orderFetches = realOrderNumbers.map(orderNum =>
                fetch(`/api/get_order?orderNumber=${orderNum}`) // Fix: Use 'ordernum'
                    .then(resp => resp.json())
                    .then(order => { // Fix: Access order.contents, not orderItems
                        console.log(order.contents);
                        if (!order.contents || order.contents.length === 0) {
                            return; // Skip this order if there are no items
                        }
                        let row = document.createElement('tr');
                        let itemStrings = order.contents.map(item => {
                            // if the item is a side...
                            if (item.quantity) {
                                return `${item.quantity}x ${item.side}`;
                            } 
                            // otherwise it's a pizza
                            else {
                                let description = `1x ${item.dough.size} ${item.dough.type} Pizza with ${item.sauce}`;
                                if (item.toppings) {
                                    description += ', topped with ' + item.toppings.join(', ');
                                }
                                return description;
                            }
                        });

                        row.innerHTML = `
                            <td>${orderNum}</td>
                            <td>${itemStrings.join(', ')}</td>
                        `;

                        tableBody.appendChild(row);
                    }
                )
            );

            Promise.all(orderFetches).then(() => {
                outputStatsShown.appendChild(table);
            });
        });
    });
}

/** getRevenue() - Karsten
 *  This function simply utilizes the getRevenue() API to display the total store revenue in a given range.
 *  @param start_date, end_date
 *  @returns revenue as a number
 */
function getRevenue() {
    if (!document.getElementById('revStart').value || !document.getElementById('revEnd').value) {
        displayError("A full range of dates is required to get the revenue");
    }

    fetch(`/api/get_revenue_in_range?start=${document.getElementById('revStart').value}&end=${document.getElementById('revEnd').value}`)
        .then((resp) => {
            resp.json()
                .then((totalRevenue) => {
                    let revenue = parseFloat(totalRevenue[0].Revenue).toFixed(2);
                    document.getElementById('revenueOutput').innerText = revenue;
                }).catch(error => {
                    displayError("Unable to fetch revenue. Please try again later.");
                })
        }).catch(error => {
            displayError("Please input valid start and end dates to get the revenue for that range. Please try again later.");
        });
}

/** getOrderNumber() - Karsten
 *  This function simply utilizes the getOrderNumber() API to display the data in the statistics output for the input order
 *  @param orderNumber 
 *  @returns order details
 */
function getOrderNumber(){
    if(!document.getElementById('getOrderWithNumber').value) {
        displayError("This order number is invalid");
    }

    fetch(`/api/get_order?orderNumber=${document.getElementById('getOrderWithNumber').value}`)
    .then(resp => resp.json())
    .then(order => {
        if (order.err) {
            console.warn(order.err);
            return;
        }

        console.log(order.contents);

        outputStatsShown.innerHTML = '';

        let table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th scope='col'>Order Number</th>
                    <th scope='col'>Phone</th>
                    <th scope='col'>Date Ordered</th>
                    <th scope='col'>Items</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        let tableBody = table.querySelector('tbody');

        let row = document.createElement('tr');

        let itemStrings = order.contents.map(item => {
            if (item.quantity) {
                return `${item.quantity}x ${item.side}`;
            } else {
                let description = `1x ${item.dough.size} ${item.dough.type} Pizza with ${item.sauce}`;
                if (item.toppings && item.toppings.length > 0) {
                    description += ', topped with ' + item.toppings.join(', ');
                }
                return description;
            }
        });

        row.innerHTML = `
            <td>${document.getElementById('getOrderWithNumber').value}</td>
            <td>${order.phone}</td>
            <td>${new Date(order.dateOrdered).toLocaleString()}</td>
            <td>${itemStrings.join(', ')}</td>
        `;

        tableBody.appendChild(row);
        outputStatsShown.appendChild(table);
    })
    .catch(error => {
        displayError("Error fetching order, check your oder number again.");
    });
}


