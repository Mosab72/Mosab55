// ========================================
// نظام تحليل العقود - ملف JavaScript الرئيسي
// ========================================

// المتغيرات العامة
let currentPage = 1;
const itemsPerPage = 20;
let filteredContracts = [];
let allContracts = [];

// ========================================
// تحميل البيانات وتهيئة التطبيق
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // تحميل البيانات
    allContracts = typeof contractsData !== 'undefined' ? contractsData : generateSampleData();
    filteredContracts = [...allContracts];
    
    // تهيئة الواجهة
    setupTabs();
    updateStatistics();
    renderOverview();
    renderAllContracts();
    renderExpiryCategories();
    renderUniversities();
    renderDepartments();
    renderSpecializations();
    
    console.log(`✅ تم تحميل ${allContracts.length} عقد بنجاح`);
}

// ========================================
// نظام التبويبات
// ========================================

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabName) {
    // إخفاء كل المحتويات
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // إزالة active من كل الأزرار
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // إظهار المحتوى المطلوب
    document.getElementById(tabName).classList.add('active');
    
    // تفعيل الزر المطلوب
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// ========================================
// تحديث الإحصائيات
// ========================================

function updateStatistics() {
    // حساب العقود المنتهية/قريبة من الانتهاء
    const now = new Date('2025-11-29');
    const endOf2024 = new Date('2024-12-31');
    
    const endedCount = allContracts.filter(c => {
        const endDate = parseDate(c.contractEnd);
        return endDate && endDate <= endOf2024;
    }).length;
    
    const ending2025 = allContracts.filter(c => {
        const endDate = parseDate(c.contractEnd);
        return endDate && endDate.getFullYear() === 2025;
    }).length;
    
    const ending2026 = allContracts.filter(c => {
        const endDate = parseDate(c.contractEnd);
        return endDate && endDate.getFullYear() >= 2026;
    }).length;
    
    // تحديث العرض
    document.getElementById('endedCount').textContent = endedCount;
    document.getElementById('ending2025').textContent = ending2025;
    document.getElementById('ending2026').textContent = ending2026;
    
    // عدد الجامعات
    const universities = [...new Set(allContracts.map(c => c.university))];
    document.getElementById('universitiesCount').textContent = universities.length;
}

// ========================================
// عرض النظرة العامة
// ========================================

function renderOverview() {
    // توزيع حسب الدرجة العلمية
    const degrees = {};
    allContracts.forEach(c => {
        degrees[c.degree] = (degrees[c.degree] || 0) + 1;
    });
    
    renderDegreeChart(degrees);
    
    // توزيع حسب نسبة الإنجاز
    const progress = {};
    allContracts.forEach(c => {
        const prog = c.completionRate || 'غير محدد';
        progress[prog] = (progress[prog] || 0) + 1;
    });
    
    renderProgressChart(progress);
}

function renderDegreeChart(data) {
    const container = document.getElementById('degreeChart');
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    
    let html = '<div style="display: grid; gap: 10px;">';
    
    Object.entries(data).forEach(([degree, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        html += `
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span class="badge degree-${degree.toLowerCase()}">${degree}</span>
                    <span><strong>${count}</strong> عقد (${percentage}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderProgressChart(data) {
    const container = document.getElementById('progressChart');
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    
    let html = '<div style="display: grid; gap: 10px;">';
    
    Object.entries(data).forEach(([progress, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        html += `
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${progress}</span>
                    <span><strong>${count}</strong> عقد (${percentage}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ========================================
// عرض جميع العقود
// ========================================

function renderAllContracts() {
    const tbody = document.getElementById('contractsBody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageContracts = filteredContracts.slice(start, end);
    
    let html = '';
    pageContracts.forEach((contract, index) => {
        const globalIndex = start + index + 1;
        html += `
            <tr onclick="showContractDetails(${contract.id})">
                <td>${globalIndex}</td>
                <td>${contract.university}</td>
                <td>${contract.program}</td>
                <td><span class="badge degree-${contract.degree}">${contract.degree}</span></td>
                <td><span class="badge status-${getStatusClass(contract.documentStatus)}">${contract.contractStatus}</span></td>
                <td>${contract.contractStart}</td>
                <td>${contract.contractEnd}</td>
                <td>${contract.completionRate || 'غير محدد'}</td>
                <td>${contract.department}</td>
                <td><button class="btn btn-primary">عرض</button></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    renderPagination();
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
    
    let html = '';
    
    // زر السابق
    if (currentPage > 1) {
        html += `<button onclick="changePage(${currentPage - 1})">السابق</button>`;
    }
    
    // أزرار الصفحات
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<button disabled>...</button>';
        }
    }
    
    // زر التالي
    if (currentPage < totalPages) {
        html += `<button onclick="changePage(${currentPage + 1})">التالي</button>`;
    }
    
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderAllContracts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// البحث والتصفية
// ========================================

function applyFilters() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const filterDegree = document.getElementById('filterDegree').value;
    const filterStatus = document.getElementById('filterStatus').value;
    
    filteredContracts = allContracts.filter(contract => {
        const matchesSearch = !searchText || 
            contract.university.toLowerCase().includes(searchText) ||
            contract.program.toLowerCase().includes(searchText) ||
            contract.college.toLowerCase().includes(searchText);
        
        const matchesDegree = !filterDegree || contract.degree === filterDegree;
        const matchesStatus = !filterStatus || contract.documentStatus === filterStatus;
        
        return matchesSearch && matchesDegree && matchesStatus;
    });
    
    currentPage = 1;
    renderAllContracts();
}

// ========================================
// البحث حسب التاريخ
// ========================================

function searchByDate() {
    const dateInput = document.getElementById('dateSearch').value;
    if (!dateInput) {
        alert('يرجى اختيار تاريخ');
        return;
    }
    
    const searchDate = new Date(dateInput);
    const results = allContracts.filter(contract => {
        const startDate = parseDate(contract.contractStart);
        const endDate = parseDate(contract.contractEnd);
        
        return (startDate && isSameDate(startDate, searchDate)) ||
               (endDate && isSameDate(endDate, searchDate));
    });
    
    displayDateResults(results, dateInput);
}

function showAllDates() {
    const dateResults = document.getElementById('dateResults');
    const dates = {};
    
    allContracts.forEach(contract => {
        if (contract.contractStart) {
            dates[contract.contractStart] = (dates[contract.contractStart] || 0) + 1;
        }
        if (contract.contractEnd) {
            dates[contract.contractEnd] = (dates[contract.contractEnd] || 0) + 1;
        }
    });
    
    let html = '';
    Object.entries(dates).sort().reverse().slice(0, 50).forEach(([date, count]) => {
        html += `
            <div class="card" onclick="searchSpecificDate('${date}')">
                <h3>📅 ${date}</h3>
                <p><span class="highlight">${count}</span> عقد في هذا التاريخ</p>
            </div>
        `;
    });
    
    dateResults.innerHTML = html;
}

function searchSpecificDate(date) {
    document.getElementById('dateSearch').value = convertToInputDate(date);
    searchByDate();
}

function displayDateResults(results, date) {
    const container = document.getElementById('dateResults');
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>لا توجد عقود في التاريخ ${date}</h3>
            </div>
        `;
        return;
    }
    
    let html = `<h3 style="grid-column: 1/-1; color: var(--primary-color);">
        📅 العقود في ${date} (${results.length} عقد)
    </h3>`;
    
    results.forEach(contract => {
        html += createContractCard(contract);
    });
    
    container.innerHTML = html;
}

// ========================================
// تصنيف حسب الانتهاء
// ========================================

function renderExpiryCategories() {
    const categories = {
        expired: [],
        firstHalf2025: [],
        secondHalf2025: [],
        year2026: []
    };
    
    allContracts.forEach(contract => {
        const endDate = parseDate(contract.contractEnd);
        if (!endDate) return;
        
        if (endDate <= new Date('2024-12-31')) {
            categories.expired.push(contract);
        } else if (endDate.getFullYear() === 2025) {
            if (endDate.getMonth() < 6) {
                categories.firstHalf2025.push(contract);
            } else {
                categories.secondHalf2025.push(contract);
            }
        } else {
            categories.year2026.push(contract);
        }
    });
    
    // تحديث العدادات
    document.getElementById('expiredCount').textContent = categories.expired.length;
    document.getElementById('firstHalf2025Count').textContent = categories.firstHalf2025.length;
    document.getElementById('secondHalf2025Count').textContent = categories.secondHalf2025.length;
    document.getElementById('year2026Count').textContent = categories.year2026.length;
    
    // عرض البطاقات
    renderCategoryCards('expiredList', categories.expired);
    renderCategoryCards('firstHalf2025List', categories.firstHalf2025);
    renderCategoryCards('secondHalf2025List', categories.secondHalf2025);
    renderCategoryCards('year2026List', categories.year2026);
}

function renderCategoryCards(containerId, contracts) {
    const container = document.getElementById(containerId);
    let html = '';
    
    contracts.forEach(contract => {
        html += createContractCard(contract);
    });
    
    container.innerHTML = html || '<p class="empty-state">لا توجد عقود في هذه الفئة</p>';
}

// ========================================
// عرض الجامعات
// ========================================

function renderUniversities() {
    const universitiesData = {};
    
    allContracts.forEach(contract => {
        if (!universitiesData[contract.university]) {
            universitiesData[contract.university] = [];
        }
        universitiesData[contract.university].push(contract);
    });
    
    // ترتيب حسب عدد العقود
    const sortedUniversities = Object.entries(universitiesData)
        .sort((a, b) => b[1].length - a[1].length);
    
    const container = document.getElementById('universitiesList');
    let html = '';
    
    sortedUniversities.forEach(([university, contracts]) => {
        html += `
            <div class="university-card">
                <div class="university-header" onclick="toggleUniversity('${sanitizeId(university)}')">
                    <h3>🏛️ ${university}</h3>
                    <div class="university-stats">
                        <span>📋 ${contracts.length} عقد</span>
                        <span>📚 ${[...new Set(contracts.map(c => c.degree))].length} درجات</span>
                    </div>
                </div>
                <div id="${sanitizeId(university)}" class="university-content">
                    ${renderUniversityContracts(contracts)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderUniversityContracts(contracts) {
    let html = '';
    
    contracts.forEach(contract => {
        html += `
            <div class="contract-item" onclick="showContractDetails(${contract.id})">
                <strong>${contract.program}</strong> - ${contract.degree}
                <div class="contract-details" onclick="event.stopPropagation()">
                    <div class="detail-item">
                        <strong>الكلية</strong>
                        <span>${contract.college}</span>
                    </div>
                    <div class="detail-item">
                        <strong>بداية العقد</strong>
                        <span>${contract.contractStart}</span>
                    </div>
                    <div class="detail-item">
                        <strong>انتهاء العقد</strong>
                        <span>${contract.contractEnd}</span>
                    </div>
                    <div class="detail-item">
                        <strong>نسبة الإنجاز</strong>
                        <span>${contract.completionRate || 'غير محدد'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>حالة التسليم</strong>
                        <span class="badge status-${getStatusClass(contract.documentStatus)}">${contract.documentStatus}</span>
                    </div>
                    <div class="detail-item">
                        <strong>الإدارة المختصة</strong>
                        <span>${contract.department}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    return html;
}

function toggleUniversity(id) {
    const content = document.getElementById(id);
    content.classList.toggle('active');
}

function filterUniversities() {
    const searchText = document.getElementById('universitySearch').value.toLowerCase();
    const cards = document.querySelectorAll('.university-card');
    
    cards.forEach(card => {
        const universityName = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = universityName.includes(searchText) ? 'block' : 'none';
    });
}

// ========================================
// عرض الإدارات
// ========================================

function renderDepartments() {
    const departments = {
        'إدارة برامج العلوم الهندسية وعلوم الحاسب': 'dept1',
        'إدارة برامج العلوم الصحية': 'dept2',
        'إدارة برامج العلوم الإنسانية والتربوية': 'dept3',
        'إدارة برامج العلوم الإسلامية والعربية': 'dept4',
        'إدارة برامج التخصصات العلمية': 'dept5'
    };
    
    Object.entries(departments).forEach(([deptName, deptId]) => {
        const deptContracts = allContracts.filter(c => c.department === deptName);
        document.getElementById(`${deptId}Count`).textContent = deptContracts.length;
        
        let html = '';
        deptContracts.forEach(contract => {
            html += createContractCard(contract);
        });
        
        document.getElementById(`${deptId}List`).innerHTML = html || 
            '<p class="empty-state">لا توجد عقود في هذه الإدارة</p>';
    });
}

// ========================================
// عرض التخصصات
// ========================================

function renderSpecializations() {
    const specs = {
        engineering: allContracts.filter(c => 
            c.department === 'إدارة برامج العلوم الهندسية وعلوم الحاسب'),
        health: allContracts.filter(c => 
            c.department === 'إدارة برامج العلوم الصحية'),
        humanities: allContracts.filter(c => 
            c.department === 'إدارة برامج العلوم الإنسانية والتربوية'),
        islamic: allContracts.filter(c => 
            c.department === 'إدارة برامج العلوم الإسلامية والعربية'),
        scientific: allContracts.filter(c => 
            c.department === 'إدارة برامج التخصصات العلمية')
    };
    
    document.getElementById('engineeringCount').textContent = specs.engineering.length;
    document.getElementById('healthCount').textContent = specs.health.length;
    document.getElementById('humanitiesCount').textContent = specs.humanities.length;
    document.getElementById('islamicCount').textContent = specs.islamic.length;
    document.getElementById('scientificCount').textContent = specs.scientific.length;
}

function showSpecializationDetails(specType) {
    const container = document.getElementById('specializationDetails');
    const specs = {
        engineering: {
            name: 'التخصصات الهندسية وعلوم الحاسب',
            contracts: allContracts.filter(c => 
                c.department === 'إدارة برامج العلوم الهندسية وعلوم الحاسب')
        },
        health: {
            name: 'التخصصات الصحية',
            contracts: allContracts.filter(c => 
                c.department === 'إدارة برامج العلوم الصحية')
        },
        humanities: {
            name: 'العلوم الإنسانية والتربوية',
            contracts: allContracts.filter(c => 
                c.department === 'إدارة برامج العلوم الإنسانية والتربوية')
        },
        islamic: {
            name: 'العلوم الإسلامية والعربية',
            contracts: allContracts.filter(c => 
                c.department === 'إدارة برامج العلوم الإسلامية والعربية')
        },
        scientific: {
            name: 'التخصصات العلمية',
            contracts: allContracts.filter(c => 
                c.department === 'إدارة برامج التخصصات العلمية')
        }
    };
    
    const selectedSpec = specs[specType];
    
    let html = `
        <div class="category-section">
            <div class="category-header">
                <h2>${selectedSpec.name}</h2>
                <span class="count">${selectedSpec.contracts.length} عقد</span>
            </div>
            <div class="category-content" style="display: block;">
                <div class="cards-grid">
    `;
    
    selectedSpec.contracts.forEach(contract => {
        html += createContractCard(contract);
    });
    
    html += '</div></div></div>';
    container.innerHTML = html;
    
    container.scrollIntoView({ behavior: 'smooth' });
}

// ========================================
// عرض تفاصيل العقد (المودال)
// ========================================

function showContractDetails(contractId) {
    const contract = allContracts.find(c => c.id === contractId);
    if (!contract) return;
    
    const modal = document.getElementById('contractModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="contract-details" style="grid-template-columns: 1fr;">
            <div class="detail-item">
                <strong>🏛️ الجامعة</strong>
                <span>${contract.university}</span>
            </div>
            <div class="detail-item">
                <strong>🏫 الكلية</strong>
                <span>${contract.college}</span>
            </div>
            <div class="detail-item">
                <strong>📚 البرنامج</strong>
                <span>${contract.program}</span>
            </div>
            <div class="detail-item">
                <strong>🎓 الدرجة العلمية</strong>
                <span class="badge degree-${contract.degree}">${contract.degree}</span>
            </div>
            <div class="detail-item">
                <strong>📊 حالة العقد</strong>
                <span>${contract.contractStatus}</span>
            </div>
            <div class="detail-item">
                <strong>📅 بداية سريان العقد</strong>
                <span>${contract.contractStart}</span>
            </div>
            <div class="detail-item">
                <strong>📅 انتهاء سريان العقد</strong>
                <span>${contract.contractEnd}</span>
            </div>
            <div class="detail-item">
                <strong>📈 نسبة الإنجاز</strong>
                <span>${contract.completionRate || 'غير محدد'}</span>
            </div>
            <div class="detail-item">
                <strong>📋 حالة تسليم الوثائق</strong>
                <span class="badge status-${getStatusClass(contract.documentStatus)}">${contract.documentStatus}</span>
            </div>
            <div class="detail-item">
                <strong>📅 تاريخ استلام الوثائق</strong>
                <span>${contract.documentReceived || 'لم يتم التسليم'}</span>
            </div>
            <div class="detail-item">
                <strong>📅 التاريخ المجدول للزيارة</strong>
                <span>${contract.scheduledVisit || 'لم تتم الجدولة'}</span>
            </div>
            <div class="detail-item">
                <strong>🏢 الإدارة المختصة</strong>
                <span>${contract.department}</span>
            </div>
            ${contract.notes ? `
            <div class="detail-item" style="grid-column: 1/-1;">
                <strong>📝 ملاحظات</strong>
                <span>${contract.notes}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('contractModal').classList.remove('active');
}

// إغلاق المودال عند النقر خارجه
document.getElementById('contractModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// ========================================
// وظائف مساعدة
// ========================================

function toggleCategory(categoryId) {
    const content = document.getElementById(categoryId + 'Content');
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
    } else {
        content.style.display = 'none';
    }
}

function createContractCard(contract) {
    const statusClass = getStatusClass(contract.documentStatus);
    return `
        <div class="card" onclick="showContractDetails(${contract.id})">
            <h3>${contract.program}</h3>
            <p><strong>الجامعة:</strong> ${contract.university}</p>
            <p><strong>الكلية:</strong> ${contract.college}</p>
            <p><strong>الدرجة:</strong> <span class="badge degree-${contract.degree}">${contract.degree}</span></p>
            <p><strong>بداية العقد:</strong> ${contract.contractStart}</p>
            <p><strong>انتهاء العقد:</strong> ${contract.contractEnd}</p>
            <p><strong>الإنجاز:</strong> <span class="highlight">${contract.completionRate || 'غير محدد'}</span></p>
            <p><strong>الحالة:</strong> <span class="badge status-${statusClass}">${contract.documentStatus}</span></p>
        </div>
    `;
}

function getStatusClass(status) {
    if (status === 'تم التسليم') return 'ongoing';
    if (status === 'تم التسليم متأخر') return 'delayed';
    if (status === 'لم يتم التسليم') return 'not-scheduled';
    return 'ongoing';
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(`20${parts[2]}-${parts[0]}-${parts[1]}`);
}

function isSameDate(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function convertToInputDate(dateStr) {
    const date = parseDate(dateStr);
    if (!date) return '';
    return date.toISOString().split('T')[0];
}

function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
}

// ========================================
// بيانات نموذجية (في حالة عدم وجود data.js)
// ========================================

function generateSampleData() {
    console.warn('⚠️ لم يتم العثور على ملف البيانات، سيتم استخدام بيانات نموذجية');
    return [];
}

// تصدير الوظائف للاستخدام العام
window.applyFilters = applyFilters;
window.searchByDate = searchByDate;
window.showAllDates = showAllDates;
window.toggleCategory = toggleCategory;
window.toggleUniversity = toggleUniversity;
window.filterUniversities = filterUniversities;
window.showSpecializationDetails = showSpecializationDetails;
window.showContractDetails = showContractDetails;
window.closeModal = closeModal;
window.changePage = changePage;

console.log('✅ تم تحميل النظام بنجاح');
