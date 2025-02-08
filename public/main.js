document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const signupBtn = document.getElementById("signup-btn");
    const practiceForm = document.getElementById("practice-form");
    const tableBody = document.getElementById("practice-table-body");

    async function checkLoginStatus() {
        const response = await fetch("/data");
        if (response.ok) {
            document.getElementById("authSection").style.display = "none";
            document.getElementById("inputSection").style.display = "block";
            document.getElementById("outputSection").style.display = "block";
            loadPracticeData();
        }
    }

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.ok ? checkLoginStatus() : alert("Login failed"));
    });

    signupBtn.addEventListener("click", function () {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        fetch("/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        })
        .then(response => {
            if (response.ok) {
                alert("Sign-up successful! You can now log in.");
            } else {
                alert("Sign-up failed. Try a different username.");
            }
        });
    });

    practiceForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const practiceData = {
            practiceType: document.getElementById("practice-type").value,
            duration: document.getElementById("duration").value,
            score: document.getElementById("score").value,
            date: new Date().toLocaleDateString()
        };

        fetch("/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(practiceData)
        }).then(response => {
            if (response.ok) {
                loadPracticeData();
                practiceForm.reset();
            }
        }).catch(error => console.error("Error:", error));
    });

    function loadPracticeData() {
        fetch("/data")
            .then(response => response.json())
            .then(data => {
                tableBody.innerHTML = "";
                data.forEach((entry) => {
                    const row = document.createElement("tr");
                    row.classList.add("border", "border-blue-200");
                    row.innerHTML = `
                        <td class="p-2 border border-blue-200">${entry.practiceType}</td>
                        <td class="p-2 border border-blue-200">${entry.duration}</td>
                        <td class="p-2 border border-blue-200">${entry.score}</td>
                        <td class="p-2 border border-blue-200">${entry.date}</td>
                        <td class="p-2 border border-blue-200 flex justify-center space-x-4">
                            <button 
                                onclick="editEntry('${entry._id}')"
                                class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                            >
                                Edit
                            <button 
                                onclick="deleteEntry('${entry._id}')" 
                                class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                            >
                                Delete
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            });
    }

    window.deleteEntry = function (id) {
        fetch(`/delete/${id}`, { method: "DELETE" })
            .then(response => {
                if (response.ok) {
                    loadPracticeData();
                } else {
                    alert("Failed to delete entry");
                }
            })
            .catch(error => console.error("Error:", error));
    };

    window.editEntry = function (id) {
        fetch("/data")
            .then(response => response.json())
            .then(data => {
                const entry = data.find(item => item._id === id);
    
                if (!entry) return alert("Entry not found!");
    
                const editForm = document.createElement("div");
                editForm.innerHTML = `
                    <form id="edit-form"
                        class="bg-white p-6 rounded-lg shadow-md flex flex-col space-y-4 max-w-md mx-auto"
                    >
                        <label for="edit-practice-type" class="mb-2 font-semibold">Practice Type:</label>
                        <select id="edit-practice-type"
                            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Straight">Straight</option>
                            <option value="Right Spin">Right Spin</option>
                            <option value="Left Spin">Left Spin</option>
                            <option value="Backspin">Backspin</option>
                            <option value="Stun Shot">Stun Shot</option>
                            <option value="Easy Drill">Easy Drill</option>
                            <option value="Medium Drill">Medium Drill</option>
                            <option value="Hard Drill">Hard Drill</option>
                        </select>
    
                        <label for="edit-duration" class="mb-2 font-semibold">Duration (minutes):</label>
                        <input type="number" id="edit-duration" value="${entry.duration}" min="1" required
                            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
    
                        <label for="edit-score" class="mb-2 font-semibold">Self-Score (1-10):</label>
                        <input type="number" id="edit-score" value="${entry.score}" min="1" max="10" required
                            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
    
                        <button type="submit" class="bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors">
                            Save Changes
                        </button>
                        <button type="button" id="cancel-edit" class="bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors">
                            Cancel
                            </button>
                        </form>
                `;
    
                document.body.appendChild(editForm);
                
                const editFormElement = document.getElementById("edit-form");
                const practiceTypeSelect = document.getElementById("edit-practice-type");
                practiceTypeSelect.value = entry.practiceType;
    
                document.getElementById("cancel-edit").addEventListener("click", () => {
                    document.body.removeChild(editForm);
                });
    
                editFormElement.addEventListener("submit", function (event) {
                    event.preventDefault();
    
                    const updatedEntry = {
                        practiceType: document.getElementById("edit-practice-type").value,
                        duration: document.getElementById("edit-duration").value,
                        score: document.getElementById("edit-score").value,
                        date: entry.date
                    };
    
                    fetch(`/update/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updatedEntry)
                    })
                    .then(response => {
                        if (response.ok) {
                            loadPracticeData();
                            document.body.removeChild(editForm);
                        } else {
                            alert("Failed to update entry");
                        }
                    })
                    .catch(error => console.error("Error updating entry:", error));
                });
            })
            .catch(error => console.error("Error loading data:", error));
    };

    checkLoginStatus();
});