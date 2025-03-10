var exampleOutput = document.getElementById('output');
var exampleOutput2 = document.getElementById('output2');

fetch("http://localhost:8000/api/create_order", {
    method: "POST",
    body: JSON.stringify([]),
}).then((response) => {
    response.json().then((ordernum) => {
        exampleOutput.innerText = ordernum;
    });
});

fetch("http://localhost:8000/api/get_order?orderNumber=2", {
    method: "POST",
    body: JSON.stringify([]),
}).then((response) => {
    response.json().then((order) => {
        exampleOutput2.innerText = JSON.stringify(order);
    });
});
