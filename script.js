const button = document.getElementById("myButton");

button.addEventListener("click", function () {
    alert("You clicked the button!");
});


const weightInput = document.getElementById('weight');
const totalInput = document.getElementById('total');
const actionButton = document.getElementById('myButton');
const message = document.getElementById('displayMessage');

actionButton.addEventListener('click', function() {
    const weight = weightInput.value;
    const total = totalInput.value;

    if (weight === "" || total === "") {
        message.innerText = "Please fill out both boxes!";
    } else {
        message.innerText = `The grade is ${calculateGrade(weight, total)}!`;
    }
});