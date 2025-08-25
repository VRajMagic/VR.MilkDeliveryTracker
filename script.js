document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('deliveryForm')) {
        initializeCustomerPage();
    } else if (document.getElementById('summaryContent')) {
        initializeSummaryPage();
    }
});

// --- PASTE YOUR GOOGLE APPS SCRIPT URL HERE ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx7tZtODHgYf6KA4-KNPla0vxfXb53odXCUBn67LjFEraeM-cHDwVqIDroFnIggqWXH/exec"; 

// --- CUSTOMER PAGE LOGIC (MODIFIED) ---
function initializeCustomerPage() {
    const form = document.getElementById('deliveryForm');
    const deliveryDateInput = document.getElementById('deliveryDate');
    const searchBtn = document.getElementById('searchBtn');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const submitButton = form.querySelector('button[type="submit"]');

    const setDefaultDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        deliveryDateInput.value = `${yyyy}-${mm}-${dd}`;
    };

    const showFeedback = (message, type, duration = 3000) => {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `feedback ${type}`;
        setTimeout(() => { feedbackMessage.style.display = 'none'; }, duration);
    };
    
    setDefaultDate();

    // Search functionality now fetches from Google Sheets
    searchBtn.addEventListener('click', async () => {
        const searchDate = deliveryDateInput.value;
        showFeedback('Searching...', 'success');
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        const foundEntry = data.find(d => d.date.startsWith(searchDate));
        
        if (foundEntry) {
            document.getElementById('milkPackets').value = foundEntry.packets;
            document.getElementById('deliveryCost').value = foundEntry.cost;
            document.getElementById('isAbsent').checked = foundEntry.absent;
            document.getElementById('isAbsent').dispatchEvent(new Event('change'));
            showFeedback('Entry found. You can now edit and save.', 'success');
        } else {
            showFeedback('No entry found. You can create a new one.', 'error');
        }
    });

    // Form submission now sends data to Google Sheets
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        const entry = {
            date: deliveryDateInput.value,
            packets: parseFloat(document.getElementById('milkPackets').value) || 0,
            cost: parseFloat(document.getElementById('deliveryCost').value) || 0,
            absent: document.getElementById('isAbsent').checked,
        };

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(entry),
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await response.json();

            if (result.status === 'success') {
                alert('Entry saved successfully!');
                form.reset();
                setDefaultDate();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert('An error occurred: ' + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Entry';
        }
    });
}

// --- SUMMARY PAGE LOGIC (MODIFIED) ---
async function renderSummary(selectedMonth, selectedYear) {
    const tableBody = document.querySelector('#summaryTable tbody');
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Loading data...</td></tr>`;

    try {
        const response = await fetch(SCRIPT_URL);
        const deliveries = await response.json();
        
        tableBody.innerHTML = '';
        let totalPackets = 0;
        let totalCost = 0;

        const filteredDeliveries = deliveries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() == selectedMonth && entryDate.getFullYear() == selectedYear;
        }).sort((a,b) => new Date(a.date) - new Date(b.date));


        if (filteredDeliveries.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No delivery data for this month.</td></tr>`;
        } else {
            filteredDeliveries.forEach(entry => {
                const row = document.createElement('tr');
                const dateParts = entry.date.split('T')[0].split('-');
                const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts}`;
                
                const statusCell = entry.absent ? '<td class="status-absent">Absent</td>' : '<td>Delivered</td>';
                row.innerHTML = `<td>${formattedDate}</td><td>${entry.absent ? 'N/A' : entry.packets}</td><td>${entry.absent ? 'N/A' : `₹${parseFloat(entry.cost).toFixed(2)}`}</td>${statusCell}`;
                tableBody.appendChild(row);

                if (!entry.absent) {
                    totalPackets += parseFloat(entry.packets);
                    totalCost += parseFloat(entry.cost);
                }
            });
        }
        document.getElementById('totalPackets').textContent = totalPackets.toFixed(2);
        document.getElementById('totalCost').textContent = totalCost.toFixed(2);
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Error loading data.</td></tr>`;
    }
}

function initializeSummaryPage() {
    const monthFilter = document.getElementById('monthFilter');
    const yearDisplay = document.getElementById('currentYear');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    months.forEach((month, index) => {
        const option = new Option(month, index);
        monthFilter.add(option);
    });
    
    monthFilter.value = currentMonth;
    yearDisplay.textContent = `Year: ${currentYear}`;
    renderSummary(currentMonth, currentYear);

    monthFilter.addEventListener('change', () => {
        renderSummary(monthFilter.value, currentYear);
    });
}

