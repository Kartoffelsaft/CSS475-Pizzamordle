var exampleOutput = document.getElementById('output');

fetch("http://localhost:8000/api/create_order", {
    method: "POST",
    body: JSON.stringify([]),
}).then((response) => {
    response.json().then((ordernum) => {
        exampleOutput.innerText = ordernum;
    });
});
