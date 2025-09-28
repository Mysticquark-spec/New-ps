// Practice School Dashboard JavaScript
let studentsData = [];
let filteredData = [];
let charts = {};

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const filterButtons = document.querySelectorAll('.filter-btn');
const companyFilter = document.getElementById('companyFilter');
const sortSelect = document.getElementById('sortSelect');
const studentGrid = document.getElementById('studentGrid');
const noResults = document.getElementById('noResults');
const refreshBtn = document.getElementById('refreshBtn');
const resetFiltersBtn = document.getElementById('resetFilters');
const scrollToTopBtn = document.getElementById('scrollToTop');
const studentModal = document.getElementById('studentModal');
const modalClose = document.getElementById('modalClose');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    showLoading();
    loadStudentData();
    setupEventListeners();
    updateLastUpdated();
});

// Show loading screen with animation
function showLoading() {
    const loadingBar = document.getElementById('loadingBar');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(hideLoading, 500);
        }
        loadingBar.style.width = progress + '%';
    }, 200);
}

// Hide loading screen
function hideLoading() {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

// Load student data from JSON file
async function loadStudentData() {
    try {
        const response = await fetch('student.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        studentsData = data.map(student => ({
            ...student,
            Salary: parseInt(student.Salary) || 0,
            Selected: student.Selected.toLowerCase(),
            searchText: `${student.Name} ${student['ERP ID']} ${student['CAMPUS ID']} ${student.Company}`.toLowerCase()
        }));
        
        filteredData = [...studentsData];
        initializeDashboard();
    } catch (error) {
        console.error('Error loading student data:', error);
        showError('Failed to load student data. Please check if student.json exists.');
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="retry-btn">Retry</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

// Initialize dashboard components
function initializeDashboard() {
    updateMetrics();
    updateFinancialOverview();
    populateCompanyFilter();
    renderStudentGrid();
    initializeCharts();
    updateCompanyTable();
    hideLoading();
}

// Update key metrics
function updateMetrics() {
    const total = studentsData.length;
    const selected = studentsData.filter(s => s.Selected === 'yes').length;
    const rejected = studentsData.filter(s => s.Selected === 'no').length;
    const disabled = studentsData.filter(s => s.Selected === 'dis').length;
    
    const selectedPercent = total > 0 ? Math.round((selected / total) * 100) : 0;
    const rejectedPercent = total > 0 ? Math.round((rejected / total) * 100) : 0;
    const disabledPercent = total > 0 ? Math.round((disabled / total) * 100) : 0;
    
    // Update metric values
    document.getElementById('totalStudents').textContent = total;
    document.getElementById('selectedCount').textContent = selected;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('disabledCount').textContent = disabled;
    
    // Update progress bars
    document.getElementById('selectedProgress').style.width = selectedPercent + '%';
    document.getElementById('rejectedProgress').style.width = rejectedPercent + '%';
    document.getElementById('disabledProgress').style.width = disabledPercent + '%';
    
    // Update percentage text
    document.getElementById('selectedPercent').textContent = selectedPercent + '%';
    document.getElementById('rejectedPercent').textContent = rejectedPercent + '%';
    document.getElementById('disabledPercent').textContent = disabledPercent + '%';
    
    // Update header stats
    document.getElementById('headerSuccessRate').textContent = selectedPercent + '%';
    document.getElementById('headerTotalStudents').textContent = total;
}

// Update financial overview (removed total payout)
function updateFinancialOverview() {
    const selectedStudents = studentsData.filter(s => s.Selected === 'yes' && s.Salary > 0);
    
    if (selectedStudents.length === 0) {
        document.getElementById('avgStipend').textContent = '₹0.00';
        document.getElementById('medianStipend').textContent = '₹0.00';
        document.getElementById('totalCompanies').textContent = '0';
        return;
    }
    
    const salaries = selectedStudents.map(s => s.Salary).sort((a, b) => a - b);
    
    // Calculate average with two decimal places
    const avgSalary = salaries.reduce((sum, sal) => sum + sal, 0) / salaries.length;
    
    // Calculate median with two decimal places
    const medianSalary = salaries.length % 2 === 0 
        ? (salaries[salaries.length / 2 - 1] + salaries[salaries.length / 2]) / 2
        : salaries[Math.floor(salaries.length / 2)];
    
    const uniqueCompanies = new Set(selectedStudents.map(s => s.Company.toLowerCase())).size;
    
    document.getElementById('avgStipend').textContent = formatCurrencyWithDecimals(avgSalary);
    document.getElementById('medianStipend').textContent = formatCurrencyWithDecimals(medianSalary);
    document.getElementById('totalCompanies').textContent = uniqueCompanies;
}

function formatCurrencyWithDecimals(amount) {
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(2) + 'Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(2) + 'L';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(2) + 'K';
    } else {
        return '₹' + amount.toFixed(2);
    }
}
// Format currency
function formatCurrency(amount) {
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(1) + 'L';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(1) + 'K';
    } else {
        return '₹' + amount.toLocaleString('en-IN');
    }
}

// Populate company filter dropdown
function populateCompanyFilter() {
    const companies = [...new Set(studentsData.map(s => s.Company))].sort();
    companyFilter.innerHTML = '<option value="all">All Companies</option>';
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companyFilter.appendChild(option);
    });
}

// Render student grid
function renderStudentGrid() {
    if (filteredData.length === 0) {
        studentGrid.style.display = 'none';
        noResults.style.display = 'block';
        updateResultsCount();
        return;
    }
    
    studentGrid.style.display = 'grid';
    noResults.style.display = 'none';
    
    studentGrid.innerHTML = filteredData.map(student => `
        <div class="student-card ${getStatusClass(student.Selected)}" onclick="showStudentModal(${student['S.No']})">
            <div class="student-header">
                <div class="student-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="student-info">
                    <h3 class="student-name">${student.Name}</h3>
                    <p class="student-id">${student['CAMPUS ID']}</p>
                </div>
                <div class="status-badge ${getStatusClass(student.Selected)}">
                    <i class="fas ${getStatusIcon(student.Selected)}"></i>
                    ${getStatusText(student.Selected)}
                </div>
            </div>
            <div class="student-details">
                <div class="detail-item">
                    <i class="fas fa-building"></i>
                    <span>${student.Company}</span>
                </div>
                ${student.Selected === 'yes' ? `
                    <div class="detail-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>${formatCurrency(student.Salary)}</span>
                    </div>
                ` : ''}
                <div class="detail-item">
                    <i class="fas fa-id-card"></i>
                    <span>ERP: ${student['ERP ID']}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    updateResultsCount();
}

// Get status class for styling
function getStatusClass(status) {
    switch(status) {
        case 'yes': return 'selected';
        case 'no': return 'rejected';
        case 'dis': return 'disabled';
        default: return '';
    }
}

// Get status icon
function getStatusIcon(status) {
    switch(status) {
        case 'yes': return 'fa-check-circle';
        case 'no': return 'fa-times-circle';
        case 'dis': return 'fa-pause-circle';
        default: return 'fa-question-circle';
    }
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'yes': return 'Selected';
        case 'no': return 'Not Selected';
        case 'dis': return 'Disabled';
        default: return 'Unknown';
    }
}

// Show student modal
function showStudentModal(sNo) {
    const student = studentsData.find(s => s['S.No'] === sNo);
    if (!student) return;
    
    document.getElementById('modalTitle').textContent = student.Name;
    document.getElementById('modalBody').innerHTML = `
        <div class="modal-student-info">
            <div class="modal-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="modal-details">
                <div class="detail-row">
                    <label>Name:</label>
                    <span>${student.Name}</span>
                </div>
                <div class="detail-row">
                    <label>ERP ID:</label>
                    <span>${student['ERP ID']}</span>
                </div>
                <div class="detail-row">
                    <label>Campus ID:</label>
                    <span>${student['CAMPUS ID']}</span>
                </div>
                <div class="detail-row">
                    <label>Company:</label>
                    <span>${student.Company}</span>
                </div>
                <div class="detail-row">
                    <label>Status:</label>
                    <span class="status-text ${getStatusClass(student.Selected)}">
                        <i class="fas ${getStatusIcon(student.Selected)}"></i>
                        ${getStatusText(student.Selected)}
                    </span>
                </div>
                ${student.Selected === 'yes' ? `
                    <div class="detail-row">
                        <label>Stipend:</label>
                        <span class="salary-amount">${formatCurrency(student.Salary)}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    studentModal.style.display = 'flex';
}

// Update results count
function updateResultsCount() {
    document.getElementById('visibleCount').textContent = filteredData.length;
    document.getElementById('totalCount').textContent = studentsData.length;
}

// Filter students
function filterStudents() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = document.querySelector('.filter-btn.active').dataset.filter;
    const companyFilterValue = companyFilter.value;
    
    filteredData = studentsData.filter(student => {
        const matchesSearch = searchTerm === '' || student.searchText.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || student.Selected === statusFilter;
        const matchesCompany = companyFilterValue === 'all' || student.Company === companyFilterValue;
        
        return matchesSearch && matchesStatus && matchesCompany;
    });
    
    sortStudents();
    renderStudentGrid();
}

// Sort students
function sortStudents() {
    const sortBy = sortSelect.value;
    
    filteredData.sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.Name.localeCompare(b.Name);
            case 'stipend':
                return b.Salary - a.Salary;
            case 'company':
                return a.Company.localeCompare(b.Company);
            case 'status':
                const statusOrder = { 'yes': 0, 'no': 1, 'dis': 2 };
                return (statusOrder[a.Selected] || 3) - (statusOrder[b.Selected] || 3);
            default:
                return 0;
        }
    });
}
// // Global variables
// let studentsData = [];
// let charts = {};

// Initialize charts with proper error handling
function initializeCharts() {
    // Wait for Chart.js to be fully loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }
    
    try {
        initStatusChart();
        initStipendChart();
        initCompanyChart();
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Fetch data from student.json
async function fetchStudentData() {
    try {
        const response = await fetch('student.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        studentsData = await response.json();
        console.log('Student data loaded:', studentsData.length, 'records');
        initializeAllCharts();
    } catch (error) {
        console.error('Error fetching student data:', error);
        // Show error message to user
        showErrorMessage('Failed to load student data. Please check if student.json exists.');
    }
}

// Show error message
function showErrorMessage(message) {
    const analyticsSection = document.getElementById('analyticsSection');
    if (analyticsSection) {
        analyticsSection.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h3>Error Loading Data</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize all charts
function initializeAllCharts() {
    initStatusChart();
    initSalaryChart();
    initCompanyChart();
    initSalaryRangeChart();
    setupChartControls();
}

// Initialize status chart (Placement Status)
function initStatusChart() {
    const canvas = document.getElementById('statusChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const selected = studentsData.filter(s => s.ps === 'yes' || s.Selected === 'yes').length;
    const rejected = studentsData.filter(s => s.ps === 'no' || s.Selected === 'no').length;
    const disabled = studentsData.filter(s => s.ps === 'dis' || s.Selected === 'dis').length;
    
    // Destroy existing chart if it exists
    if (charts.status) {
        charts.status.destroy();
    }
    
    charts.status = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Selected', 'Not Selected', 'Disabled'],
            datasets: [{
                data: [selected, rejected, disabled],
                backgroundColor: [
                    '#10B981', // Green for selected
                    '#EF4444', // Red for not selected
                    '#F59E0B'  // Yellow for disabled
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize stipend chart with better error handling
function initStipendChart() {
    const canvas = document.getElementById('stipendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const selectedStudents = studentsData.filter(s => s.Selected === 'yes' && s.Salary > 0);
    
    // Create salary ranges
    const ranges = [
        { label: '< 75K', min: 0, max: 75000 },
        { label: '75K-100K', min: 75000, max: 100000 },
        { label: '100K-150K', min: 100000, max: 150000 },
        { label: '150K-200K', min: 150000, max: 200000 },
        { label: '> 200K', min: 200000, max: Infinity }
    ];
    
    const rangeCounts = ranges.map(range => 
        selectedStudents.filter(s => s.Salary >= range.min && s.Salary < range.max).length
    );
    
    // Destroy existing chart if it exists
    if (charts.stipend) {
        charts.stipend.destroy();
    }
    
    charts.stipend = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges.map(r => r.label),
            datasets: [{
                label: 'Students',
                data: rangeCounts,
                backgroundColor: '#3B82F6',
                borderColor: '#1D4ED8',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Initialize salary distribution chart
function initSalaryChart() {
    const canvas = document.getElementById('salaryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const selectedStudents = studentsData.filter(s => 
        (s.ps === 'yes' || s.Selected === 'yes') && 
        (s.stipend > 0 || s.Salary > 0)
    );
    
    // Get salary values
    const salaries = selectedStudents.map(s => s.stipend || s.Salary || 0);
    
    // Create salary ranges for histogram
    const ranges = [
        { label: '< 50K', min: 0, max: 50000 },
        { label: '50K-75K', min: 50000, max: 75000 },
        { label: '75K-100K', min: 75000, max: 100000 },
        { label: '100K-150K', min: 100000, max: 150000 },
        { label: '150K-200K', min: 150000, max: 200000 },
        { label: '> 200K', min: 200000, max: Infinity }
    ];
    
    const rangeCounts = ranges.map(range => 
        salaries.filter(salary => salary >= range.min && salary < range.max).length
    );
    
    // Destroy existing chart if it exists
    if (charts.salary) {
        charts.salary.destroy();
    }
    
    charts.salary = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges.map(r => r.label),
            datasets: [{
                label: 'Number of Students',
                data: rangeCounts,
                backgroundColor: '#3B82F6',
                borderColor: '#1D4ED8',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Students: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize company chart - UPDATED TO SHOW ALL COMPANIES
function initCompanyChart() {
    const canvas = document.getElementById('companyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const selectedStudents = studentsData.filter(s => 
        (s.ps === 'yes' || s.Selected === 'yes') && 
        (s.company || s.Company)
    );
    
    // Group by company
    const companyData = {};
    selectedStudents.forEach(student => {
        const company = (student.company || student.Company || '').trim();
        if (company && company !== '') {
            if (!companyData[company]) {
                companyData[company] = { count: 0, totalSalary: 0 };
            }
            companyData[company].count++;
            companyData[company].totalSalary += (student.stipend || student.Salary || 0);
        }
    });
    
    // Sort companies by count - REMOVED .slice(0, 15) to show ALL companies
    const companies = Object.keys(companyData)
        .sort((a, b) => companyData[b].count - companyData[a].count);
    
    const studentCounts = companies.map(company => companyData[company].count);
    
    // Generate colors for all companies (cycling through a color palette)
    const colorPalette = [
        '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
        '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1',
        '#8B5A2B', '#059669', '#DC2626', '#7C2D12', '#1F2937',
        '#7E22CE', '#0891B2', '#16A34A', '#CA8A04', '#B91C1C',
        '#A21CAF', '#0F766E', '#EA580C', '#65A30D', '#4F46E5'
    ];
    const backgroundColors = companies.map((_, index) => 
        colorPalette[index % colorPalette.length]
    );
    const borderColors = companies.map((_, index) => 
        colorPalette[index % colorPalette.length]
    );
    
    // Destroy existing chart if it exists
    if (charts.company) {
        charts.company.destroy();
    }
    
charts.company = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: companies,
        datasets: [{
            label: 'Students Placed',
            data: studentCounts,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                        size: companies.length > 20 ? 8 : companies.length > 10 ? 10 : 12
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        // Only show the number of students, remove average salary
                        return `Students: ${context.raw}`;
                    }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    }
});
}

// Initialize salary range analysis chart
function initSalaryRangeChart() {
    const canvas = document.getElementById('salaryRangeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const selectedStudents = studentsData.filter(s => 
        (s.ps === 'yes' || s.Selected === 'yes') && 
        (s.stipend > 0 || s.Salary > 0)
    );
    
    // Create more detailed salary ranges
    const ranges = [
        { label: '40K-60K', min: 40000, max: 60000, color: '#EF4444' },
        { label: '60K-80K', min: 60000, max: 80000, color: '#F97316' },
        { label: '80K-100K', min: 80000, max: 100000, color: '#EAB308' },
        { label: '100K-130K', min: 100000, max: 130000, color: '#22C55E' },
        { label: '130K-150K', min: 130000, max: 150000, color: '#3B82F6' },
        { label: '150K-200K', min: 150000, max: 200000, color: '#8B5CF6' },
        { label: '200K+', min: 200000, max: Infinity, color: '#EC4899' }
    ];
    
    const rangeCounts = ranges.map(range => {
        return selectedStudents.filter(student => {
            const salary = student.stipend || student.Salary || 0;
            return salary >= range.min && salary < range.max;
        }).length;
    });
    
    // Destroy existing chart if it exists
    if (charts.salaryRange) {
        charts.salaryRange.destroy();
    }
    
    charts.salaryRange = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges.map(r => r.label),
            datasets: [{
                label: 'Number of Students',
                data: rangeCounts,
                backgroundColor: ranges.map(r => r.color),
                borderColor: ranges.map(r => r.color),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `Students: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Setup chart control buttons
function setupChartControls() {
    // Handle chart type switching
    document.querySelectorAll('.chart-btn').forEach(button => {
        button.addEventListener('click', function() {
            const chartType = this.getAttribute('data-chart');
            const target = this.getAttribute('data-target');
            
            // Update active button
            this.parentNode.querySelectorAll('.chart-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Switch chart type
            switchChartType(target, chartType);
        });
    });
}

// Switch chart type function
function switchChartType(target, type) {
    switch(target) {
        case 'status':
            if (charts.status) {
                charts.status.config.type = type === 'doughnut' ? 'doughnut' : 'pie';
                charts.status.update();
            }
            break;
        case 'company':
            if (charts.company) {
                const isHorizontal = type === 'horizontal';
                charts.company.config.type = isHorizontal ? 'bar' : 'bar';
                charts.company.config.options.indexAxis = isHorizontal ? 'y' : 'x';
                charts.company.config.options.scales = {
                    [isHorizontal ? 'x' : 'y']: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    [isHorizontal ? 'y' : 'x']: {
                        ticks: {
                            maxRotation: isHorizontal ? 0 : 45,
                            minRotation: isHorizontal ? 0 : 45,
                            font: {
                                size: isHorizontal ? 10 : (charts.company.data.labels.length > 20 ? 8 : 10)
                            }
                        }
                    }
                };
                charts.company.update();
            }
            break;
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    fetchStudentData();
});

// Handle window resize
window.addEventListener('resize', function() {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
            chart.resize();
        }
    });
});

// Update company table
function updateCompanyTable() {
    const tableBody = document.getElementById('companyTableBody');
    if (!tableBody) return;
    
    const selectedStudents = studentsData.filter(s => s.Selected === 'yes' && s.Salary > 0);
    const companyData = {};
    
    selectedStudents.forEach(student => {
        const company = student.Company;
        if (!companyData[company]) {
            companyData[company] = [];
        }
        companyData[company].push(student.Salary);
    });
    
    const rows = Object.keys(companyData).map(company => {
        const salaries = companyData[company].sort((a, b) => a - b);
        const count = salaries.length;
        const avg = Math.round(salaries.reduce((sum, sal) => sum + sal, 0) / count);
        const median = count % 2 === 0 
            ? Math.round((salaries[count / 2 - 1] + salaries[count / 2]) / 2)
            : salaries[Math.floor(count / 2)];
        const min = salaries[0];
        const max = salaries[salaries.length - 1];
        const range = max - min;
        
        return {
            company,
            count,
            avg,
            median,
            min,
            max,
            range
        };
    }).sort((a, b) => b.count - a.count);
    
    tableBody.innerHTML = rows.map(row => `
        <tr>
            <td><strong>${row.company}</strong></td>
            <td>${row.count}</td>
            <td>${formatCurrency(row.avg)}</td>
            <td>${formatCurrency(row.median)}</td>
            <td>${formatCurrency(row.min)}</td>
            <td>${formatCurrency(row.max)}</td>
            <td>${formatCurrency(row.range)}</td>
        </tr>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', filterStudents);
    }
    
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                filterStudents();
            }
        });
    }
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterStudents();
        });
    });
    
    // Company filter
    if (companyFilter) {
        companyFilter.addEventListener('change', filterStudents);
    }
    
    // Sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', filterStudents);
    }
    
    // Reset filters
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (companyFilter) companyFilter.value = 'all';
            if (sortSelect) sortSelect.value = 'name';
            filterButtons.forEach(b => b.classList.remove('active'));
            if (filterButtons[0]) filterButtons[0].classList.add('active');
            filterStudents();
        });
    }
    
    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.classList.add('spinning');
            setTimeout(() => {
                loadStudentData();
                refreshBtn.classList.remove('spinning');
            }, 1000);
        });
    }
    
    // Modal functionality
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            if (studentModal) {
                studentModal.style.display = 'none';
            }
        });
    }
    
    if (studentModal) {
        studentModal.addEventListener('click', (e) => {
            if (e.target === studentModal) {
                studentModal.style.display = 'none';
            }
        });
    }
    
    // Scroll to top
    window.addEventListener('scroll', () => {
        if (scrollToTopBtn) {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }
    });
    
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Chart controls
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const chartType = e.target.dataset.chart;
            const container = e.target.closest('.chart-container');
            if (container) {
                container.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Handle chart type changes for status chart
                if (container.querySelector('#statusChart') && charts.status && chartType) {
                    charts.status.config.type = chartType;
                    charts.status.update();
                }
            }
        });
    });
}

// Update last updated timestamp
function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = new Date().toLocaleString();
    }
}

// Global function to show student modal (called from rendered HTML)
window.showStudentModal = showStudentModal;
