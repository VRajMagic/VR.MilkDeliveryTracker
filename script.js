document.addEventListener('DOMContentLoaded', () => {
    // Check which page is currently loaded and run the corresponding script
    if (document.getElementById('deliveryForm')) {
        initializeCustomerPage();
    } else if (document.getElementById('summaryContent')) {
        initializeSummaryPage();
    }
});

// --- CUSTOMER PAGE LOGIC (Unchanged) ---
let isEditMode = false;

function initializeCustomerPage() {
    const form = document.getElementById('deliveryForm');
    const deliveryDateInput = document.getElementById('deliveryDate');
    const isAbsentCheckbox = document.getElementById('isAbsent');
    const milkPacketsInput = document.getElementById('milkPackets');
    const deliveryCostInput = document.getElementById('deliveryCost');
    const searchBtn = document.getElementById('searchBtn');
    const feedbackMessage = document.getElementById('feedbackMessage');

    const setDefaultDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        deliveryDateInput.value = `${yyyy}-${mm}-${dd}`;
    };

    const showFeedback = (message, type) => {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `feedback ${type}`;
    };

    const resetFormState = () => {
        form.reset();
        setDefaultDate();
        isEditMode = false;
        milkPacketsInput.disabled = false;
        deliveryCostInput.disabled = false;
        feedbackMessage.style.display = 'none';
    };
    
    setDefaultDate();

    deliveryDateInput.addEventListener('change', () => {
        isEditMode = false;
        feedbackMessage.style.display = 'none';
    });

    isAbsentCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            milkPacketsInput.value = '';
            deliveryCostInput.value = '';
            milkPacketsInput.disabled = true;
            deliveryCostInput.disabled = true;
        } else {
            milkPacketsInput.disabled = false;
            deliveryCostInput.disabled = false;
        }
    });

    searchBtn.addEventListener('click', () => {
        const searchDate = deliveryDateInput.value;
        if (!searchDate) {
            showFeedback('Please select a date to search.', 'error');
            return;
        }
        const deliveries = JSON.parse(localStorage.getItem('milkDeliveries')) || [];
        const foundEntry = deliveries.find(d => d.date === searchDate);
        if (foundEntry) {
            milkPacketsInput.value = foundEntry.packets;
            deliveryCostInput.value = foundEntry.cost;
            isAbsentCheckbox.checked = foundEntry.absent;
            isAbsentCheckbox.dispatchEvent(new Event('change'));
            isEditMode = true;
            showFeedback('Entry found. You can now edit and save.', 'success');
        } else {
            form.reset();
            deliveryDateInput.value = searchDate;
            isEditMode = false;
            showFeedback('No entry found for this date. You can create a new one.', 'error');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const entryDate = deliveryDateInput.value;
        const deliveries = JSON.parse(localStorage.getItem('milkDeliveries')) || [];
        const existingEntry = deliveries.find(d => d.date === entryDate);

        if (existingEntry && !isEditMode) {
            showFeedback('Entry for this date already exists. Please use the Search button to edit.', 'error');
            return;
        }
        
        const newEntry = {
            date: entryDate,
            packets: isAbsentCheckbox.checked ? 0 : parseFloat(milkPacketsInput.value) || 0,
            cost: isAbsentCheckbox.checked ? 0 : parseFloat(deliveryCostInput.value) || 0,
            absent: isAbsentCheckbox.checked,
        };
        saveEntry(newEntry);
        alert('Entry saved successfully!');
        resetFormState();
    });
}

function saveEntry(entry) {
    let deliveries = JSON.parse(localStorage.getItem('milkDeliveries')) || [];
    const existingEntryIndex = deliveries.findIndex(d => d.date === entry.date);
    if (existingEntryIndex > -1) {
        deliveries[existingEntryIndex] = entry;
    } else {
        deliveries.push(entry);
    }
    deliveries.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem('milkDeliveries', JSON.stringify(deliveries));
}


// --- SUMMARY PAGE LOGIC (MODIFIED) ---

// This function now renders the summary based on a selected month and year
function renderSummary(selectedMonth, selectedYear) {
    const deliveries = JSON.parse(localStorage.getItem('milkDeliveries')) || [];
    const tableBody = document.querySelector('#summaryTable tbody');
    const totalPacketsEl = document.getElementById('totalPackets');
    const totalCostEl = document.getElementById('totalCost');

    // Clear previous data
    tableBody.innerHTML = '';
    let totalPackets = 0;
    let totalCost = 0;

    // Filter deliveries for the selected month and year
    const filteredDeliveries = deliveries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() == selectedMonth && entryDate.getFullYear() == selectedYear;
    });

    if (filteredDeliveries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" style="text-align:center;">No delivery data for this month.</td>`;
        tableBody.appendChild(row);
    } else {
        filteredDeliveries.forEach(entry => {
            const row = document.createElement('tr');
            
            // --- MODIFIED: Add 'status-absent' class if absent ---
            const statusCell = entry.absent 
                ? '<td class="status-absent">Absent</td>' 
                : '<td>Delivered</td>';

            row.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.absent ? 'N/A' : entry.packets}</td>
                <td>${entry.absent ? 'N/A' : `₹${entry.cost.toFixed(2)}`}</td>
                ${statusCell}
            `;
            tableBody.appendChild(row);

            if (!entry.absent) {
                totalPackets += entry.packets;
                totalCost += entry.cost;
            }
        });
    }

    // Update totals
    totalPacketsEl.textContent = totalPackets.toFixed(2);
    totalCostEl.textContent = totalCost.toFixed(2);
}

// This is the main function for the summary page
function initializeSummaryPage() {
    const monthFilter = document.getElementById('monthFilter');
    const yearDisplay = document.getElementById('currentYear');
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Populate month dropdown
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index; // 0-11
        option.textContent = month;
        monthFilter.appendChild(option);
    });

    // Set default values
    monthFilter.value = currentMonth;
    yearDisplay.textContent = `Year: ${currentYear}`;

    // Initial render
    renderSummary(currentMonth, currentYear);

    // Add event listener to re-render on month change
    monthFilter.addEventListener('change', () => {
        const selectedMonth = monthFilter.value;
        renderSummary(selectedMonth, currentYear);
    });
}
