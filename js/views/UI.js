/**
 * UI - User Interface Controller
 */

export class UI {
    constructor(app) {
        this.app = app;
        this.currentClassId = null;
        this.currentDate = new Date().toISOString().split('T')[0];
        this.views = {};
    }

    init() {
        this.renderApp();
        this.setupEventListeners();
        this.showClassSelector();
    }

    /**
     * Render main app structure
     */
    renderApp() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <header class="app-header">
                <h1>📚 Lateness Tracker</h1>
                <div class="header-controls">
                    <input type="date" id="datePicker" value="${this.currentDate}">
                    <button id="menuBtn" class="icon-btn">☰</button>
                </div>
            </header>
            
            <nav id="classNav" class="class-nav"></nav>
            
            <main id="mainContent" class="main-content">
                <div class="welcome-screen">
                    <p>Select a class to start tracking</p>
                </div>
            </main>
            
            <nav id="bottomNav" class="bottom-nav">
                <button class="nav-btn active" data-view="tracker">👋 Arrival</button>
                <button class="nav-btn" data-view="students">👥 Students</button>
                <button class="nav-btn" data-view="schedule">📅 Schedule</button>
                <button class="nav-btn" data-view="reports">📊 Reports</button>
            </nav>

            <div id="modal" class="modal hidden"></div>
            <div id="sidebar" class="sidebar hidden"></div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Date picker
        document.getElementById('datePicker').addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.refreshCurrentView();
        });

        // Bottom navigation
        document.getElementById('bottomNav').addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                const view = e.target.dataset.view;
                this.switchView(view);
            }
        });

        // Menu button
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Close modal on background click
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.closeModal();
        });
    }

    /**
     * Show class selector
     */
    showClassSelector() {
        const classes = this.app.classManager.getAll();
        const nav = document.getElementById('classNav');
        
        if (classes.length === 0) {
            // No classes yet, show setup
            nav.innerHTML = `
                <button class="add-class-btn" onclick="window.app.ui.showAddClassModal()">
                    + Add Class
                </button>
            `;
        } else {
            nav.innerHTML = classes.map(c => `
                <button class="class-btn ${this.currentClassId === c.id ? 'active' : ''}" 
                        data-class-id="${c.id}">
                    ${c.name}
                </button>
            `).join('');
            
            nav.querySelectorAll('.class-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.selectClass(btn.dataset.classId);
                });
            });
            
            // Auto-select first class
            if (!this.currentClassId) {
                this.selectClass(classes[0].id);
            }
        }
    }

    /**
     * Select a class
     */
    selectClass(classId) {
        this.currentClassId = classId;
        
        // Update UI
        document.querySelectorAll('.class-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.classId === classId);
        });
        
        this.refreshCurrentView();
    }

    /**
     * Switch between views
     */
    switchView(viewName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
        
        // Render view
        const main = document.getElementById('mainContent');
        
        switch (viewName) {
            case 'tracker':
                this.renderTrackerView(main);
                break;
            case 'students':
                this.renderStudentsView(main);
                break;
            case 'schedule':
                this.renderScheduleView(main);
                break;
            case 'reports':
                this.renderReportsView(main);
                break;
        }
        
        this.currentView = viewName;
    }

    /**
     * Render arrival tracker view
     */
    renderTrackerView(container) {
        if (!this.currentClassId) {
            container.innerHTML = '<p class="empty-state">Select a class first</p>';
            return;
        }

        const students = this.app.studentManager.getSortedByName(this.currentClassId);
        const arrivals = this.app.arrivalTracker.getByClassAndDate(this.currentClassId, this.currentDate);
        const classObj = this.app.classManager.getById(this.currentClassId);
        
        // Get schedule for today
        const dayOfWeek = new Date(this.currentDate).getDay();
        const schedule = this.app.classManager.getScheduleForDay(this.currentClassId, dayOfWeek);
        
        container.innerHTML = `
            <div class="tracker-view">
                <div class="tracker-header">
                    <h2>${classObj.name}</h2>
                    <p class="date-display">${this.formatDate(this.currentDate)}</p>
                    ${schedule && schedule.enabled ? 
                        `<p class="schedule-info">Class: ${schedule.startTime} - ${schedule.endTime}</p>` : 
                        '<p class="no-class">No class scheduled</p>'}
                </div>
                
                <div class="students-grid">
                    ${students.map(s => {
                        const arrival = arrivals.find(a => a.studentId === s.id);
                        return this.renderStudentCard(s, arrival);
                    }).join('')}
                </div>
                
                <div class="tracker-stats">
                    <span>Present: ${arrivals.length}</span>
                    <span>Absent: ${students.length - arrivals.length}</span>
                </div>
            </div>
        `;
        
        // Add click handlers
        container.querySelectorAll('.student-card').forEach(card => {
            card.addEventListener('click', () => {
                this.toggleArrival(card.dataset.studentId);
            });
        });
    }

    /**
     * Render student card
     */
    renderStudentCard(student, arrival) {
        const hasArrived = !!arrival;
        const statusClass = hasArrived ? arrival.status : 'absent';
        const statusText = hasArrived ? 
            (arrival.minutesLate > 0 ? `${arrival.minutesLate}min late` : 'On time') : 
            'Absent';
        
        return `
            <div class="student-card ${statusClass}" data-student-id="${student.id}">
                <div class="student-photo">
                    ${student.photoUrl ? 
                        `<img src="${student.photoUrl}" alt="${student.name}">` :
                        '<div class="photo-placeholder">👤</div>'}
                </div>
                <div class="student-name">${student.name}</div>
                <div class="student-status">${statusText}</div>
                ${hasArrived ? `<div class="arrival-time">${arrival.time}</div>` : ''}
            </div>
        `;
    }

    /**
     * Toggle student arrival
     */
    toggleArrival(studentId) {
        const existing = this.app.arrivalTracker.hasArrived(studentId, this.currentDate);
        
        if (existing) {
            this.app.arrivalTracker.removeArrival(studentId, this.currentDate);
        } else {
            this.app.arrivalTracker.markArrival(studentId, this.currentClassId, this.currentDate);
        }
        
        this.refreshCurrentView();
    }

    /**
     * Render students management view
     */
    renderStudentsView(container) {
        if (!this.currentClassId) {
            container.innerHTML = '<p class="empty-state">Select a class first</p>';
            return;
        }

        const students = this.app.studentManager.getSortedByName(this.currentClassId);
        
        container.innerHTML = `
            <div class="students-view">
                <div class="view-header">
                    <h2>Students - ${this.app.classManager.getById(this.currentClassId)?.name}</h2>
                    <button class="btn btn-primary" onclick="window.app.ui.showAddStudentModal()">
                        + Add Student
                    </button>
                </div>
                
                <div class="import-section">
                    <button class="btn btn-secondary" onclick="window.app.ui.showImportModal()">
                        📥 Import CSV
                    </button>
                </div>
                
                <ul class="student-list">
                    ${students.map(s => `
                        <li class="student-item">
                            <span>${s.name}</span>
                            <button class="icon-btn danger" onclick="window.app.ui.deleteStudent('${s.id}')">🗑️</button>
                        </li>
                    `).join('')}
                </ul>
                
                ${students.length === 0 ? '<p class="empty-state">No students yet</p>' : ''}
            </div>
        `;
    }

    /**
     * Render schedule view
     */
    renderScheduleView(container) {
        if (!this.currentClassId) {
            container.innerHTML = '<p class="empty-state">Select a class first</p>';
            return;
        }

        const classObj = this.app.classManager.getById(this.currentClassId);
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        container.innerHTML = `
            <div class="schedule-view">
                <h2>Schedule - ${classObj.name}</h2>
                
                <div class="schedule-grid">
                    ${days.map((day, i) => {
                        const schedule = classObj.schedule[day] || { enabled: false };
                        return `
                            <div class="schedule-day ${schedule.enabled ? 'enabled' : ''}">
                                <label class="day-name">
                                    <input type="checkbox" ${schedule.enabled ? 'checked' : ''} 
                                           onchange="window.app.ui.toggleDay('${day}')">
                                    ${dayNames[i]}
                                </label>
                                ${schedule.enabled ? `
                                    <div class="time-inputs">
                                        <input type="time" value="${schedule.startTime || '08:00'}"
                                               onchange="window.app.ui.updateSchedule('${day}', 'startTime', this.value)">
                                        <span>to</span>
                                        <input type="time" value="${schedule.endTime || '12:00'}"
                                               onchange="window.app.ui.updateSchedule('${day}', 'endTime', this.value)">
                                    </div>
                                ` : '<span class="no-class">No class</span>'}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render reports view
     */
    renderReportsView(container) {
        const classObj = this.app.classManager.getById(this.currentClassId);
        const now = new Date();
        
        container.innerHTML = `
            <div class="reports-view">
                <h2>Reports - ${classObj?.name || 'Select Class'}</h2>
                
                <div class="report-options">
                    <label>
                        Month:
                        <select id="reportMonth">
                            ${Array.from({length: 12}, (_, i) => 
                                `<option value="${i + 1}" ${i + 1 === now.getMonth() + 1 ? 'selected' : ''}>
                                    ${new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </option>`
                            ).join('')}
                        </select>
                    </label>
                    
                    <label>
                        Year:
                        <select id="reportYear">
                            ${Array.from({length: 3}, (_, i) => 
                                `<option value="${now.getFullYear() - i}" ${i === 0 ? 'selected' : ''}>
                                    ${now.getFullYear() - i}
                                </option>`
                            ).join('')}
                        </select>
                    </label>
                </div>
                
                <div class="report-actions">
                    <button class="btn btn-primary" onclick="window.app.ui.generatePDFReport()">
                        📄 Generate PDF
                    </button>
                    <button class="btn btn-secondary" onclick="window.app.ui.generateCSVReport()">
                        📊 Export CSV
                    </button>
                </div>
                
                <div id="reportPreview" class="report-preview"></div>
            </div>
        `;
    }

    /**
     * Show add class modal
     */
    showAddClassModal() {
        this.showModal(`
            <h2>Add Class</h2>
            <form onsubmit="window.app.ui.addClass(event)">
                <div class="form-group">
                    <label>Class Name</label>
                    <input type="text" name="className" placeholder="e.g., 1AEP" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="window.app.ui.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add</button>
                </div>
            </form>
        `);
    }

    /**
     * Add new class
     */
    addClass(e) {
        e.preventDefault();
        const form = e.target;
        const name = form.className.value;
        
        this.app.classManager.add(name);
        this.showClassSelector();
        this.closeModal();
    }

    /**
     * Show add student modal
     */
    showAddStudentModal() {
        this.showModal(`
            <h2>Add Student</h2>
            <form onsubmit="window.app.ui.addStudent(event)">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="studentName" placeholder="Student name" required>
                </div>
                <div class="form-group">
                    <label>Photo URL (optional)</label>
                    <input type="url" name="photoUrl" placeholder="https://...">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="window.app.ui.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add</button>
                </div>
            </form>
        `);
    }

    /**
     * Add new student
     */
    addStudent(e) {
        e.preventDefault();
        const form = e.target;
        const name = form.studentName.value;
        const photoUrl = form.photoUrl.value || null;
        
        this.app.studentManager.add(name, this.currentClassId, photoUrl);
        this.refreshCurrentView();
        this.closeModal();
    }

    /**
     * Show import modal
     */
    showImportModal() {
        this.showModal(`
            <h2>Import Students from CSV</h2>
            <p class="help-text">CSV format: name,photoUrl (optional)</p>
            <form onsubmit="window.app.ui.importStudents(event)">
                <div class="form-group">
                    <textarea name="csvContent" rows="10" placeholder="Ahmed&#10;Sara,https://...&#10;Khalid" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="window.app.ui.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Import</button>
                </div>
            </form>
        `);
    }

    /**
     * Import students from CSV
     */
    importStudents(e) {
        e.preventDefault();
        const form = e.target;
        const csvContent = form.csvContent.value;
        
        const result = this.app.studentManager.importFromCSV(csvContent, this.currentClassId);
        
        alert(`Imported ${result.imported} students${result.errors.length > 0 ? '. Errors: ' + result.errors.join(', ') : ''}`);
        
        this.refreshCurrentView();
        this.closeModal();
    }

    /**
     * Delete student
     */
    deleteStudent(studentId) {
        if (confirm('Delete this student?')) {
            this.app.studentManager.delete(studentId);
            this.refreshCurrentView();
        }
    }

    /**
     * Toggle day in schedule
     */
    toggleDay(day) {
        const classObj = this.app.classManager.getById(this.currentClassId);
        const current = classObj.schedule[day]?.enabled || false;
        
        this.app.classManager.update(this.currentClassId, {
            schedule: {
                ...classObj.schedule,
                [day]: current ? { enabled: false } : { enabled: true, startTime: '08:00', endTime: '12:00' }
            }
        });
        
        this.refreshCurrentView();
    }

    /**
     * Update schedule time
     */
    updateSchedule(day, field, value) {
        const classObj = this.app.classManager.getById(this.currentClassId);
        
        this.app.classManager.update(this.currentClassId, {
            schedule: {
                ...classObj.schedule,
                [day]: {
                    ...classObj.schedule[day],
                    [field]: value
                }
            }
        });
    }

    /**
     * Generate PDF report
     */
    async generatePDFReport() {
        const month = parseInt(document.getElementById('reportMonth').value);
        const year = parseInt(document.getElementById('reportYear').value);
        
        const report = this.app.reportGenerator.generateMonthlyReport(
            this.currentClassId, year, month
        );
        
        // Generate HTML report for printing
        const html = this.generateReportHTML(report);
        
        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }

    /**
     * Generate CSV report
     */
    generateCSVReport() {
        const month = parseInt(document.getElementById('reportMonth').value);
        const year = parseInt(document.getElementById('reportYear').value);
        
        const report = this.app.reportGenerator.generateMonthlyReport(
            this.currentClassId, year, month
        );
        
        const csv = this.app.reportGenerator.generateCSV(report);
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_${report.className}_${month}_${year}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Generate report HTML for PDF
     */
    generateReportHTML(report) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Rapport - ${report.className} - ${report.monthName}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                    th { background: #f0f0f0; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                </style>
            </head>
            <body>
                <h1>Rapport de Retards - ${report.className}</h1>
                <p class="text-center">${report.monthName} ${report.year}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Élève</th>
                            <th class="text-center">Jours</th>
                            <th class="text-center">À l'heure</th>
                            <th class="text-center">Retards</th>
                            <th class="text-right">Minutes</th>
                            <th class="text-right">Moyenne</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.students.map(s => `
                            <tr>
                                <td>${s.name}</td>
                                <td class="text-center">${s.totalDays}</td>
                                <td class="text-center">${s.onTime}</td>
                                <td class="text-center">${s.tardies}</td>
                                <td class="text-right">${s.totalMinutesLate}</td>
                                <td class="text-right">${s.avgMinutesLate}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p style="margin-top: 20px; text-align: right;">
                    Généré le ${new Date().toLocaleDateString()}
                </p>
            </body>
            </html>
        `;
    }

    /**
     * Show modal
     */
    showModal(content) {
        const modal = document.getElementById('modal');
        modal.innerHTML = `<div class="modal-content">${content}</div>`;
        modal.classList.remove('hidden');
    }

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('modal').classList.add('hidden');
    }

    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('hidden');
    }

    /**
     * Refresh current view
     */
    refreshCurrentView() {
        this.switchView(this.currentView || 'tracker');
    }

    /**
     * Format date
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}
