document.addEventListener('DOMContentLoaded', () => {
    // Check which page is currently loaded and run the corresponding script
    if (document.getElementById('deliveryForm')) {
        initializeCustomerPage();
    } else if (document.getElementById('summaryContent')) {
        initializeSummaryPage();
    }
});

// --- NEW: State variable to track if we are editing a searched entry ---
let isEditMode = false;

// Function to handle the customer entry page
function initializeCustomerPage() {
    const form = document.getElementById('deliveryForm');
    const deliveryDateInput = document.getElementById('deliveryDate');
    const isAbsentCheckbox = document.getElementById('isAbsent');
    const milkPacketsInput = document.getElementById('milkPackets');
    const deliveryCostInput = document.getElementById('deliveryCost');
    const searchBtn = document.getElementById('searchBtn');
    const feedbackMessage = document.getElementById('feedbackMessage');

    // Function to set default date to today
    const setDefaultDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        deliveryDateInput.value = `${yyyy}-${mm}-${dd}`;
    };

    // Function to show feedback messages
    const showFeedback = (message, type) => {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `feedback ${type}`;
    };

    // Function to reset the form state
    const resetFormState = () => {
        form.reset();
        setDefaultDate();
        isEditMode = false;
        milkPacketsInput.disabled = false;
        deliveryCostInput.disabled = false;
        feedbackMessage.style.display = 'none';
    };
    
    // Set default date on initial load
    setDefaultDate();

    // Reset edit mode if the date is changed manually
    deliveryDateInput.addEventListener('change', () => {
        isEditMode = false;
        feedbackMessage.style.display = 'none';
    });

    // Disable packet and cost fields if "Absent" is checked
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

    // --- NEW: Search button functionality ---
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
            isAbsentCheckbox.dispatchEvent(new Event('change')); // Trigger change to handle disabled state
            isEditMode = true;
            showFeedback('Entry found. You can now edit and save.', 'success');
        } else {
            form.reset();
            deliveryDateInput.value = searchDate; // Keep the searched date
            isEditMode = false;
            showFeedback('No entry found for this date. You can create a new one.', 'error');
        }
    });

    // --- MODIFIED: Form submission logic ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const entryDate = deliveryDateInput.value;
        const deliveries = JSON.parse(localStorage.getItem('milkDeliveries')) || [];
        const existingEntry = deliveries.find(d => d.date === entryDate);

        // Prevent creating a new entry if one already exists and we're not in edit mode
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

// Unchanged function: saveEntry already supports updating
function saveEntry(entry) {
    let deliveries = JSON.parse(localStorage.getItem('milkDeliveries')) || [];
    const existingEntryIndex = deliveries.findIndex(d => d.date === entry.date);
    
    if (existingEntryIndex > -1) {
        // Update existing entry
        deliveries[existingEntryIndex] = entry;
    } else {
        // Add new entry
        deliveries.push(entry);
    }

    deliveries.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem('milkDeliveries', JSON.stringify(deliveries));
}

// Unchanged function: summary page logic remains the same
function initializeSummaryPage() {
    const deliveries = JSON.parse(localStorage.getItem('milkDeliveries')) || [];
    const tableBody = document.querySelector('#summaryTable tbody');
    let totalPackets = 0;
    let totalCost = 0;

    if (deliveries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" style="text-align:center;">No delivery data found.</td>`;
        tableBody.appendChild(row);
        return;
    }
    
    deliveries.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.absent ? 'N/A' : entry.packets}</td>
            <td>${entry.absent ? 'N/A' : `₹${entry.cost.toFixed(2)}`}</td>
            <td>${entry.absent ? 'Absent' : 'Delivered'}</td>
        `;
        tableBody.appendChild(row);

        if (!entry.absent) {
            totalPackets += entry.packets;
            totalCost += entry.cost;
        }
    });
    
    document.getElementById('totalPackets').textContent = totalPackets.toFixed(2);
    document.getElementById('totalCost').textContent = totalCost.toFixed(2);
}
