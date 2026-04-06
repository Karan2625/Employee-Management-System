/* ===============================
   STATE MANAGEMENT
   =============================== */
// Try to grab from localStorage first, otherwise fallback to default 5 employees
const DATA_KEY = 'corphr_employees';
const defaultEmployees = [
    { id: 101, name: "Alice Johnson", salary: 85000, gender: "Female", createdAt: 1648810000000 },
    { id: 102, name: "Bob Smith", salary: 72000, gender: "Male", createdAt: 1648820000000 },
    { id: 103, name: "Charlie Davis", salary: 65000, gender: "Other", createdAt: 1648830000000 },
    { id: 104, name: "Diana Prince", salary: 95000, gender: "Female", createdAt: 1648840000000 },
    { id: 105, name: "Evan Wright", salary: 110000, gender: "Male", createdAt: 1648850000000 }
];

let employees = [];
let editingId = null;
let employeeToDelete = null;

// Sorting state
let currentSort = {
    key: 'createdAt',
    direction: 'desc' // Default to "Newest First"
};

/* ===============================
   DOM ELEMENTS
   =============================== */
const form = document.getElementById('employeeForm');
const idInput = document.getElementById('empId');
const nameInput = document.getElementById('empName');
const salaryInput = document.getElementById('empSalary');
const genderSelect = document.getElementById('empGender');
const idError = document.getElementById('idError');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const editBadge = document.getElementById('editBadge');

const tableBody = document.getElementById('employeeList');
const totalEmployeesEl = document.getElementById('totalEmployees');
const totalSalaryEl = document.getElementById('totalSalary');
const searchInput = document.getElementById('searchInput');
const sortDropdown = document.getElementById('sortDropdown');
const tableHeaders = document.querySelectorAll('th.sortable');

const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

/* ===============================
   INITIALIZATION
   =============================== */
function init() {
    loadData();
    renderTable();
    setupEventListeners();
}

/* ===============================
   DATA OPERATIONS
   =============================== */
function loadData() {
    const stored = localStorage.getItem(DATA_KEY);
    if (stored) {
        employees = JSON.parse(stored);
    } else {
        employees = [...defaultEmployees];
        saveData();
    }
}

function saveData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(employees));
    updateSummary();
}

/* ===============================
   RENDER & UI
   =============================== */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function updateSummary() {
    totalEmployeesEl.textContent = employees.length;
    const total = employees.reduce((sum, emp) => sum + Number(emp.salary), 0);
    totalSalaryEl.textContent = formatCurrency(total);
}

function renderTable(filterText = "") {
    tableBody.innerHTML = "";

    let filtered = employees.filter(emp => {
        const query = filterText.toLowerCase();
        return emp.name.toLowerCase().includes(query) ||
            emp.id.toString().includes(query) ||
            emp.gender.toLowerCase().includes(query);
    });

    // Apply Sorting
    filtered = sortData(filtered);

    // Update Header UI
    updateHeaderUI();

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-text-muted);">No employees found.</td></tr>`;
        updateSummary();
        return;
    }

    filtered.forEach((emp, index) => {
        const row = document.createElement('tr');
        row.className = 'row-enter';
        row.style.animationDelay = `${index * 0.05}s`;

        let pillClass = 'pill-other';
        if (emp.gender === 'Male') pillClass = 'pill-male';
        if (emp.gender === 'Female') pillClass = 'pill-female';

        row.innerHTML = `
            <td><strong>#${emp.id}</strong></td>
            <td>${emp.name}</td>
            <td>${formatCurrency(emp.salary)}</td>
            <td><span class="gender-pill ${pillClass}">${emp.gender}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-icon btn-edit" onclick="editEmployee(${emp.id})" title="Edit">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn btn-icon btn-delete" onclick="promptDelete(${emp.id})" title="Delete">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateSummary();
}

function sortData(data) {
    return [...data].sort((a, b) => {
        let valA = a[currentSort.key];
        let valB = b[currentSort.key];

        // Handle string comparison for names/gender
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function updateHeaderUI() {
    tableHeaders.forEach(th => {
        th.classList.remove('asc', 'desc');
        if (th.dataset.sort === currentSort.key) {
            th.classList.add(currentSort.direction);
        }
    });
}

/* ===============================
   EVENT HANDLERS
   =============================== */
function setupEventListeners() {
    form.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
    searchInput.addEventListener('input', (e) => renderTable(e.target.value));

    // Modal buttons
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', executeDelete);

    // Sorting buttons
    sortDropdown.addEventListener('change', handleDropdownSort);
    tableHeaders.forEach(th => {
        th.addEventListener('click', () => handleHeaderSort(th.dataset.sort));
    });
}

function handleDropdownSort(e) {
    const value = e.target.value;
    switch (value) {
        case 'newest':
            currentSort = { key: 'createdAt', direction: 'desc' };
            break;
        case 'oldest':
            currentSort = { key: 'createdAt', direction: 'asc' };
            break;
        case 'alpha-asc':
            currentSort = { key: 'name', direction: 'asc' };
            break;
        case 'alpha-desc':
            currentSort = { key: 'name', direction: 'desc' };
            break;
    }
    renderTable(searchInput.value);
}

function handleHeaderSort(key) {
    if (currentSort.key === key) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.key = key;
        currentSort.direction = 'asc';
    }
    
    // Sync dropdown if it matches one of the presets
    if (key === 'name') {
        sortDropdown.value = currentSort.direction === 'asc' ? 'alpha-asc' : 'alpha-desc';
    } else if (key === 'createdAt') {
        sortDropdown.value = currentSort.direction === 'asc' ? 'oldest' : 'newest';
    } else {
        sortDropdown.value = ""; // Clear dropdown if custom sort
    }

    renderTable(searchInput.value);
}

function handleFormSubmit(e) {
    e.preventDefault();
    idError.textContent = "";

    const id = parseInt(idInput.value);
    const name = nameInput.value.trim();
    const salary = parseFloat(salaryInput.value);
    const gender = genderSelect.value;

    // Validate Duplicate ID
    if (!editingId && employees.some(emp => emp.id === id)) {
        idError.textContent = "Employee ID already exists!";
        return;
    }

    // Validate Edit constraints
    if (editingId && editingId !== id && employees.some(emp => emp.id === id)) {
        idError.textContent = "Employee ID already exists!";
        return;
    }

    if (editingId) {
        // Update existing
        const index = employees.findIndex(emp => emp.id === editingId);
        if (index > -1) {
            employees[index] = { id, name, salary, gender };
        }
    } else {
        // Create new
        employees.push({ 
            id, 
            name, 
            salary, 
            gender,
            createdAt: Date.now() 
        });
    }

    saveData();
    renderTable(searchInput.value);
    resetForm();
}

/* ===============================
   EDIT & DELETE LOGIC
   =============================== */
window.editEmployee = function (id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    editingId = id;
    idInput.value = emp.id;
    nameInput.value = emp.name;
    salaryInput.value = emp.salary;
    genderSelect.value = emp.gender;

    formTitle.textContent = "Edit Employee";
    editBadge.classList.remove('hidden');
    submitBtn.textContent = "Update Employee";
    cancelBtn.classList.remove('hidden');

    // Scroll mobile to top if necessary
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    editingId = null;
    form.reset();
    idError.textContent = "";

    formTitle.textContent = "Add New Employee";
    editBadge.classList.add('hidden');
    submitBtn.textContent = "Save Employee";
    cancelBtn.classList.add('hidden');
}

window.promptDelete = function (id) {
    employeeToDelete = id;
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    employeeToDelete = null;
    deleteModal.classList.add('hidden');
}

function executeDelete() {
    if (!employeeToDelete) return;

    employees = employees.filter(emp => emp.id !== employeeToDelete);
    saveData();
    renderTable(searchInput.value);
    closeDeleteModal();

    // If we're editing the deleted user, reset form
    if (editingId === employeeToDelete) {
        resetForm();
    }
}

// Bootstrap
init();
