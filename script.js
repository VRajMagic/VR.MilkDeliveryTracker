document.addEventListener('DOMContentLoaded', () => {
    // Check which page is currently loaded and run the corresponding script
    if (document.getElementById('deliveryForm')) {
        initializeCustomerPage();
    } else if (document.getElementById('summaryContent')) {
        initializeSummaryPage();
    }
});

// Function to handle the customer entry page
function initializeCustomerPage() {
    const form = document.getElementById('deliveryForm');
    const isAbsentCheckbox = document.getElementById('isAbsent');
    const milkPacketsInput = document.getElementById('milkPackets');
    const deliveryCostInput = document.getElementById('deliveryCost');

    // Disable packet and cost fields if "Absent" is checked
    isAbsentCheckbox.addEventListener('change', (e) => {
        const checked = e.target.checked;
        milkPacketsInput.disabled = checked;
        deliveryCostInput.disabled = checked;
        if (checked) {
            milkPacketsInput.value = '';
            deliveryCostInput.value = '';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const deliveryDate = document.getElementById('deliveryDate').value;
        const isAbsent = isAbsentCheckbox.checked;

        const entry = {
            date: deliveryDate,
            packets: isAbsent ? 0 : parseInt(milkPacketsInput.value) || 0,
            cost: isAbsent ? 0 : parseFloat(deliveryCostInput.value) || 0,
            absent: isAbsent,
        };

        // Validate that date is selected
        if (!entry.date) {
            alert('Please select a date.');
            return;
        }

        saveEntry(entry);
        alert('Entry saved successfully!');
        form.reset();
        milkPacketsInput.disabled = false;
        deliveryCostInput.disabled = false;
    });
}

// Function to save an entry to localStorage
function saveEntry(entry) {
    let deliveries = JSON.parse(localStorage.getItem('milkDeliveries')) || [];
    // Check if an entry for this date already exists and update it
    const existingEntryIndex = deliveries.findIndex(d => d.date === entry.date);
    if (existingEntryIndex > -1) {
        deliveries[existingEntryIndex] = entry;
    } else {
        deliveries.push(entry);
    }
    // Sort entries by date
    deliveries.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem('milkDeliveries', JSON.stringify(deliveries));
}

// Function to handle the milkman summary page
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

    document.getElementById('totalPackets').textContent = totalPackets;
    document.getElementById('totalCost').textContent = totalCost.toFixed(2);
}
