var exampleOutput = document.getElementById('output');

fetch("http://localhost:8000/api/person_count").then((response) => {
    response.json().then((personCount) => {
        exampleOutput.innerText = personCount[0].count;
    });
});
