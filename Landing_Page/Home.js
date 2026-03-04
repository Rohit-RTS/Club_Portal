// Select all category cards
const categoryCards = document.querySelectorAll(".category-card");

categoryCards.forEach(card => {
    card.addEventListener("click", () => {
        const category = card.getAttribute("data-category");

        // Redirect to category page
        window.location.href = `category.html?type=${category}`;
    });
});