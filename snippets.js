function testScript(evt) {
    const parent = evt.target.parentElement;
    const clipContainer = parent.querySelector(".clip-container");
    const clipCard = document.createElement('h1');
    clipCard.textContent = "Here's a clip";
    clipContainer.appendChild(clipCard);
}

