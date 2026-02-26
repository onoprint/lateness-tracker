(() => {
  // js/models/ClassManager.js
  var ClassManager = class {
    constructor(storage) {
      this.storage = storage;
      this.classes = [];
    }
    /**
     * Load classes from storage
     */
    async load() {
      this.classes = this.storage.get("classes") || this.getDefaultClasses();
    }
    /**
     * Save classes to storage
     */
    save() {
      this.storage.set("classes", this.classes);
    }
    /**
     * Get all classes
     * @returns {array}
     */
    getAll() {
      return [...this.classes];
    }
    /**
     * Get class by ID
     * @param {string} id 
     * @returns {object|null}
     */
    getById(id) {
      return this.classes.find((c) => c.id === id) || null;
    }
    /**
     * Add a new class
     * @param {string} name - Class name (e.g., "1AEP")
     * @param {object} schedule - Weekly schedule
     */
    add(name, schedule = {}) {
      const newClass = {
        id: this.generateId(),
        name,
        schedule: schedule || this.defaultSchedule(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.classes.push(newClass);
      this.save();
      return newClass;
    }
    /**
     * Update a class
     * @param {string} id 
     * @param {object} updates 
     */
    update(id, updates) {
      const index = this.classes.findIndex((c) => c.id === id);
      if (index !== -1) {
        this.classes[index] = { ...this.classes[index], ...updates };
        this.save();
        return this.classes[index];
      }
      return null;
    }
    /**
     * Delete a class
     * @param {string} id 
     */
    delete(id) {
      this.classes = this.classes.filter((c) => c.id !== id);
      this.save();
    }
    /**
     * Get schedule for a specific day
     * @param {string} classId 
     * @param {number} dayOfWeek - 0=Sunday, 1=Monday, etc.
     * @returns {object|null} - { startTime, endTime } or null if no class
     */
    getScheduleForDay(classId, dayOfWeek) {
      const classObj = this.getById(classId);
      if (!classObj) return null;
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayName = dayNames[dayOfWeek];
      return classObj.schedule[dayName] || null;
    }
    /**
     * Default weekly schedule template
     */
    defaultSchedule() {
      return {
        monday: { enabled: true, startTime: "12:30", endTime: "14:20" },
        tuesday: { enabled: true, startTime: "12:30", endTime: "14:20" },
        wednesday: { enabled: true, startTime: "12:30", endTime: "14:20" },
        thursday: { enabled: true, startTime: "12:30", endTime: "14:20" },
        friday: { enabled: true, startTime: "12:30", endTime: "14:20" },
        saturday: { enabled: true, startTime: "12:30", endTime: "14:20" },
        sunday: { enabled: false }
      };
    }
    /**
     * Generate unique ID
     */
    getDefaultClasses() { return [{id:"cls_default",name:"2AEP",schedule:{monday:{enabled:true,startTime:"14:30",endTime:"16:20"},tuesday:{enabled:true,startTime:"14:30",endTime:"16:20"},wednesday:{enabled:true,startTime:"14:30",endTime:"16:20"},thursday:{enabled:true,startTime:"14:30",endTime:"16:20"},friday:{enabled:true,startTime:"14:30",endTime:"16:20"},saturday:{enabled:true,startTime:"14:30",endTime:"16:20"},sunday:{enabled:false}},createdAt:new Date().toISOString()}]; } generateId() {
      return "cls_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
  };

  // js/models/StudentManager.js
  var StudentManager = class {
    constructor(storage) {
      this.storage = storage;
      this.students = [];
    }
    /**
     * Load students from storage
     */
    async load() {
      this.students = this.storage.get("students") || this.getDefaultStudents();
    }
    /**
     * Save students to storage
     */
    save() {
      this.storage.set("students", this.students);
    }
    /**
     * Get all students
     * @returns {array}
     */
    getAll() {
      return [...this.students];
    }
    /**
     * Get students for a specific class
     * @param {string} classId 
     * @returns {array}
     */
    getByClass(classId) {
      return this.students.filter((s) => s.classId === classId);
    }
    /**
     * Get student by ID
     * @param {string} id 
     * @returns {object|null}
     */
    getById(id) {
      return this.students.find((s) => s.id === id) || null;
    }
    /**
     * Add a new student
     * @param {string} name - Student name
     * @param {string} classId - Class ID
     * @param {string} photoUrl - Optional photo URL
     */
    add(name, classId, photoUrl = null) {
      const student = {
        id: this.generateId(),
        name: name.trim(),
        classId,
        photoUrl,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.students.push(student);
      this.save();
      return student;
    }
    /**
     * Update a student
     * @param {string} id 
     * @param {object} updates 
     */
    update(id, updates) {
      const index = this.students.findIndex((s) => s.id === id);
      if (index !== -1) {
        this.students[index] = { ...this.students[index], ...updates };
        this.save();
        return this.students[index];
      }
      return null;
    }
    /**
     * Delete a student
     * @param {string} id 
     */
    delete(id) {
      this.students = this.students.filter((s) => s.id !== id);
      this.save();
    }
    /**
     * Import students from CSV
     * CSV format: name,photoUrl (optional)
     * @param {string} csvContent 
     * @param {string} classId 
     * @returns {object} - { success, imported, errors }
     */
    importFromCSV(csvContent, classId) {
      const lines = csvContent.trim().split("\n");
      const results = { success: true, imported: 0, errors: [] };
      const startIndex = lines[0].toLowerCase().includes("name") ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(",").map((p) => p.trim());
        const name = parts[0];
        const photoUrl = parts[1] || null;
        if (name) {
          this.add(name, classId, photoUrl);
          results.imported++;
        } else {
          results.errors.push(`Line ${i + 1}: Empty name`);
        }
      }
      return results;
    }
    /**
     * Get students sorted by name
     * @param {string} classId 
     * @returns {array}
     */
    getDefaultStudents() { const clsId="cls_default"; return [{id:"stu_1",name:"بتيت يوسف",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_2",name:"الابراهيمي الإدريسي",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_3",name:"نور الناصيح",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_4",name:"إسماعيل الخيدر",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_5",name:"آسية الألوسي",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_6",name:"مريم العكروط",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_7",name:"زينب الالوسي",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_8",name:"هاجر الألوسي",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_9",name:"إسراء الألوسي",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_10",name:"هبة الوردي",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_11",name:"جيداء الناصيح",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_12",name:"مريم بتيت",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_13",name:"ملاك ولال",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_14",name:"علاء الناصيح",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_15",name:"محمد الالوسي",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_16",name:"ريم بودة",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_17",name:"ريان الخيدر",classId:clsId,createdAt:new Date().toISOString()},{id:"stu_18",name:"امير",classId:clsId,createdAt:new Date().toISOString()}]; } getSortedByName(classId) {
      return this.getByClass(classId).sort(
        (a, b) => a.name.localeCompare(b.name)
      );
    }
    /**
     * Generate unique ID
     */
    getDefaultClasses() { return [{id:"cls_default",name:"2AEP",schedule:{monday:{enabled:true,startTime:"14:30",endTime:"16:20"},tuesday:{enabled:true,startTime:"14:30",endTime:"16:20"},wednesday:{enabled:true,startTime:"14:30",endTime:"16:20"},thursday:{enabled:true,startTime:"14:30",endTime:"16:20"},friday:{enabled:true,startTime:"14:30",endTime:"16:20"},saturday:{enabled:true,startTime:"14:30",endTime:"16:20"},sunday:{enabled:false}},createdAt:new Date().toISOString()}]; } generateId() {
      return "stu_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
  };

  // js/models/ArrivalTracker.js
  var ArrivalTracker = class {
    constructor(storage, classManager) {
      this.storage = storage;
      this.classManager = classManager;
      this.arrivals = [];
    }
    /**
     * Load arrivals from storage
     */
    async load() {
      this.arrivals = this.storage.get("arrivals", []);
    }
    /**
     * Save arrivals to storage
     */
    save() {
      this.storage.set("arrivals", this.arrivals);
    }
    /**
     * Get all arrivals
     * @returns {array}
     */
    getAll() {
      return [...this.arrivals];
    }
    /**
     * Get arrivals for a specific date
     * @param {string} date - ISO date string (YYYY-MM-DD)
     * @returns {array}
     */
    getByDate(date) {
      return this.arrivals.filter((a) => a.date === date);
    }
    /**
     * Get arrivals for a class on a specific date
     * @param {string} classId 
     * @param {string} date 
     * @returns {array}
     */
    getByClassAndDate(classId, date) {
      return this.arrivals.filter((a) => a.classId === classId && a.date === date);
    }
    /**
     * Mark student arrival
     * @param {string} studentId 
     * @param {string} classId 
     * @param {string} date - ISO date string
     * @param {string} time - HH:MM format (optional, defaults to now)
     * @returns {object}
     */
    markArrival(studentId, classId, date, time = null) {
      const existing = this.arrivals.find(
        (a) => a.studentId === studentId && a.date === date
      );
      if (existing) {
        return { success: false, message: "Already marked", arrival: existing };
      }
      const arrivalTime = time || (/* @__PURE__ */ new Date()).toTimeString().substr(0, 5);
      const dayOfWeek = new Date(date).getDay();
      const schedule = this.classManager.getScheduleForDay(classId, dayOfWeek);
      let minutesLate = 0;
      let status = "on-time";
      if (schedule && schedule.enabled && schedule.startTime) {
        const [scheduleHour, scheduleMin] = schedule.startTime.split(":").map(Number);
        const [arrivalHour, arrivalMin] = arrivalTime.split(":").map(Number);
        const scheduleMinutes = scheduleHour * 60 + scheduleMin;
        const arrivalMinutes = arrivalHour * 60 + arrivalMin;
        minutesLate = Math.max(0, arrivalMinutes - scheduleMinutes);
        status = minutesLate > 0 ? "late" : "on-time";
      }
      const arrival = {
        id: this.generateId(),
        studentId,
        classId,
        date,
        time: arrivalTime,
        minutesLate,
        status,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.arrivals.push(arrival);
      this.save();
      return { success: true, arrival };
    }
    /**
     * Remove arrival (undo)
     * @param {string} studentId 
     * @param {string} date 
     * @returns {boolean}
     */
    removeArrival(studentId, date) {
      const index = this.arrivals.findIndex(
        (a) => a.studentId === studentId && a.date === date
      );
      if (index !== -1) {
        this.arrivals.splice(index, 1);
        this.save();
        return true;
      }
      return false;
    }
    /**
     * Check if student has arrived
     * @param {string} studentId 
     * @param {string} date 
     * @returns {object|null}
     */
    hasArrived(studentId, date) {
      return this.arrivals.find((a) => a.studentId === studentId && a.date === date) || null;
    }
    /**
     * Get statistics for a student
     * @param {string} studentId 
     * @param {string} startDate 
     * @param {string} endDate 
     * @returns {object}
     */
    getStudentStats(studentId, startDate = null, endDate = null) {
      let filtered = this.arrivals.filter((a) => a.studentId === studentId);
      if (startDate) {
        filtered = filtered.filter((a) => a.date >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter((a) => a.date <= endDate);
      }
      const total = filtered.length;
      const tardies = filtered.filter((a) => a.status === "late").length;
      const onTime = filtered.filter((a) => a.status === "on-time").length;
      const totalMinutesLate = filtered.reduce((sum, a) => sum + a.minutesLate, 0);
      const avgMinutesLate = tardies > 0 ? Math.round(totalMinutesLate / tardies) : 0;
      return {
        totalArrivals: total,
        onTime,
        tardies,
        totalMinutesLate,
        avgMinutesLate
      };
    }
    /**
     * Get statistics for a class
     * @param {string} classId 
     * @param {string} startDate 
     * @param {string} endDate 
     * @returns {object}
     */
    getClassStats(classId, startDate = null, endDate = null) {
      let filtered = this.arrivals.filter((a) => a.classId === classId);
      if (startDate) {
        filtered = filtered.filter((a) => a.date >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter((a) => a.date <= endDate);
      }
      const tardies = filtered.filter((a) => a.status === "late").length;
      const onTime = filtered.filter((a) => a.status === "on-time").length;
      return {
        totalArrivals: filtered.length,
        onTime,
        tardies,
        latenessRate: filtered.length > 0 ? Math.round(tardies / filtered.length * 100) : 0
      };
    }
    /**
     * Generate unique ID
     */
    getDefaultClasses() { return [{id:"cls_default",name:"2AEP",schedule:{monday:{enabled:true,startTime:"14:30",endTime:"16:20"},tuesday:{enabled:true,startTime:"14:30",endTime:"16:20"},wednesday:{enabled:true,startTime:"14:30",endTime:"16:20"},thursday:{enabled:true,startTime:"14:30",endTime:"16:20"},friday:{enabled:true,startTime:"14:30",endTime:"16:20"},saturday:{enabled:true,startTime:"14:30",endTime:"16:20"},sunday:{enabled:false}},createdAt:new Date().toISOString()}]; } generateId() {
      return "arr_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
  };

  // js/models/ReportGenerator.js
  var ReportGenerator = class {
    constructor(storage, studentManager, classManager) {
      this.storage = storage;
      this.studentManager = studentManager;
      this.classManager = classManager;
    }
    /**
     * Generate monthly report for a class
     * @param {string} classId 
     * @param {number} year 
     * @param {number} month - 1-12
     * @returns {object}
     */
    generateMonthlyReport(classId, year, month) {
      const classObj = this.classManager.getById(classId);
      if (!classObj) return null;
      const students = this.studentManager.getByClass(classId);
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0).toISOString().split("T")[0];
      const report = {
        classId,
        className: classObj.name,
        year,
        month,
        monthName: new Date(year, month - 1).toLocaleString("default", { month: "long" }),
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        students: []
      };
      students.forEach((student) => {
        const arrivals = this.storage.get("arrivals", []).filter(
          (a) => a.studentId === student.id && a.date >= startDate && a.date <= endDate
        );
        const tardies = arrivals.filter((a) => a.status === "late");
        const totalMinutesLate = tardies.reduce((sum, a) => sum + a.minutesLate, 0);
        report.students.push({
          id: student.id,
          name: student.name,
          photoUrl: student.photoUrl,
          totalDays: arrivals.length,
          onTime: arrivals.filter((a) => a.status === "on-time").length,
          tardies: tardies.length,
          totalMinutesLate,
          avgMinutesLate: tardies.length > 0 ? Math.round(totalMinutesLate / tardies.length) : 0,
          arrivals: arrivals.map((a) => ({
            date: a.date,
            time: a.time,
            minutesLate: a.minutesLate
          }))
        });
      });
      report.students.sort((a, b) => a.name.localeCompare(b.name));
      return report;
    }
    /**
     * Generate CSV for a report
     * @param {object} report 
     * @returns {string}
     */
    generateCSV(report) {
      const lines = [];
      lines.push(`Rapport de retards - ${report.className} - ${report.monthName} ${report.year}`);
      lines.push("");
      lines.push("Nom,D\xE9lais,Retards,Minutes de retard, Moyenne");
      report.students.forEach((s) => {
        lines.push(`${s.name},${s.totalDays},${s.tardies},${s.totalMinutesLate},${s.avgMinutesLate}`);
      });
      const totalDays = report.students.reduce((sum, s) => sum + s.totalDays, 0);
      const totalTardies = report.students.reduce((sum, s) => sum + s.tardies, 0);
      const totalMinutes = report.students.reduce((sum, s) => sum + s.totalMinutesLate, 0);
      lines.push("");
      lines.push(`Total,${totalDays},${totalTardies},${totalMinutes},${totalTardies > 0 ? Math.round(totalMinutes / totalTardies) : 0}`);
      return lines.join("\n");
    }
    /**
     * Generate daily attendance sheet
     * @param {string} classId 
     * @param {string} date 
     * @returns {object}
     */
    generateDailySheet(classId, date) {
      const classObj = this.classManager.getById(classId);
      if (!classObj) return null;
      const students = this.studentManager.getSortedByName(classId);
      const arrivals = this.storage.get("arrivals", []).filter(
        (a) => a.classId === classId && a.date === date
      );
      return {
        classId,
        className: classObj.name,
        date,
        students: students.map((s) => {
          const arrival = arrivals.find((a) => a.studentId === s.id);
          return {
            id: s.id,
            name: s.name,
            photoUrl: s.photoUrl,
            arrived: !!arrival,
            time: arrival ? arrival.time : null,
            minutesLate: arrival ? arrival.minutesLate : 0,
            status: arrival ? arrival.status : "absent"
          };
        })
      };
    }
    /**
     * Export all data as JSON
     * @returns {string}
     */
    exportJSON() {
      return JSON.stringify(this.storage.exportAll(), null, 2);
    }
    /**
     * Import data from JSON
     * @param {string} jsonData 
     */
    importJSON(jsonData) {
      try {
        const data = JSON.parse(jsonData);
        this.storage.importAll(data);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };

  // js/views/UI.js
  var UI = class {
    constructor(app) {
      this.app = app;
      this.currentClassId = null;
      this.currentDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
      const app = document.getElementById("app");
      app.innerHTML = `
            <header class="app-header">
                <h1>\u{1F4DA} Lateness Tracker</h1>
                <div class="header-controls">
                    <input type="date" id="datePicker" value="${this.currentDate}">
                    <button id="menuBtn" class="icon-btn">\u2630</button>
                </div>
            </header>
            
            <nav id="classNav" class="class-nav"></nav>
            
            <main id="mainContent" class="main-content">
                <div class="welcome-screen">
                    <p>Select a class to start tracking</p>
                </div>
            </main>
            
            <nav id="bottomNav" class="bottom-nav">
                <button class="nav-btn active" data-view="tracker">\u{1F44B} Arrival</button>
                <button class="nav-btn" data-view="students">\u{1F465} Students</button>
                <button class="nav-btn" data-view="schedule">\u{1F4C5} Schedule</button>
                <button class="nav-btn" data-view="reports">\u{1F4CA} Reports</button>
            </nav>

            <div id="modal" class="modal hidden"></div>
            <div id="sidebar" class="sidebar hidden"></div>
        `;
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
      document.getElementById("datePicker").addEventListener("change", (e) => {
        this.currentDate = e.target.value;
        this.refreshCurrentView();
      });
      document.getElementById("bottomNav").addEventListener("click", (e) => {
        if (e.target.classList.contains("nav-btn")) {
          const view = e.target.dataset.view;
          this.switchView(view);
        }
      });
      document.getElementById("menuBtn").addEventListener("click", () => {
        this.toggleSidebar();
      });
      document.getElementById("modal").addEventListener("click", (e) => {
        if (e.target.id === "modal") this.closeModal();
      });
    }
    /**
     * Show class selector
     */
    showClassSelector() {
      const classes = this.app.classManager.getAll();
      const nav = document.getElementById("classNav");
      if (classes.length === 0) {
        nav.innerHTML = `
                <button class="add-class-btn" onclick="window.app.ui.showAddClassModal()">
                    + Add Class
                </button>
            `;
      } else {
        nav.innerHTML = classes.map((c) => `
                <button class="class-btn ${this.currentClassId === c.id ? "active" : ""}" 
                        data-class-id="${c.id}">
                    ${c.name}
                </button>
            `).join("");
        nav.querySelectorAll(".class-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            this.selectClass(btn.dataset.classId);
          });
        });
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
      document.querySelectorAll(".class-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.classId === classId);
      });
      this.refreshCurrentView();
    }
    /**
     * Switch between views
     */
    switchView(viewName) {
      document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.view === viewName);
      });
      const main = document.getElementById("mainContent");
      switch (viewName) {
        case "tracker":
          this.renderTrackerView(main);
          break;
        case "students":
          this.renderStudentsView(main);
          break;
        case "schedule":
          this.renderScheduleView(main);
          break;
        case "reports":
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
      const dayOfWeek = new Date(this.currentDate).getDay();
      const schedule = this.app.classManager.getScheduleForDay(this.currentClassId, dayOfWeek);
      container.innerHTML = `
            <div class="tracker-view">
                <div class="tracker-header">
                    <h2>${classObj.name}</h2>
                    <p class="date-display">${this.formatDate(this.currentDate)}</p>
                    ${schedule && schedule.enabled ? `<p class="schedule-info">Class: ${schedule.startTime} - ${schedule.endTime}</p>` : '<p class="no-class">No class scheduled</p>'}
                </div>
                
                <div class="students-grid">
                    ${students.map((s) => {
        const arrival = arrivals.find((a) => a.studentId === s.id);
        return this.renderStudentCard(s, arrival);
      }).join("")}
                </div>
                
                <div class="tracker-stats">
                    <span>Present: ${arrivals.length}</span>
                    <span>Absent: ${students.length - arrivals.length}</span>
                </div>
            </div>
        `;
      container.querySelectorAll(".student-card").forEach((card) => {
        card.addEventListener("click", () => {
          this.toggleArrival(card.dataset.studentId);
        });
      });
    }
    /**
     * Render student card
     */
    renderStudentCard(student, arrival) {
      const hasArrived = !!arrival;
      const statusClass = hasArrived ? arrival.status : "absent";
      const statusText = hasArrived ? arrival.minutesLate > 0 ? `${arrival.minutesLate}min late` : "On time" : "Absent";
      return `
            <div class="student-card ${statusClass}" data-student-id="${student.id}">
                <div class="student-photo">
                    ${student.photoUrl ? `<img src="${student.photoUrl}" alt="${student.name}">` : '<div class="photo-placeholder">\u{1F464}</div>'}
                </div>
                <div class="student-name">${student.name}</div>
                <div class="student-status">${statusText}</div>
                ${hasArrived ? `<div class="arrival-time">${arrival.time}</div>` : ""}
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
                        \u{1F4E5} Import CSV
                    </button>
                </div>
                
                <ul class="student-list">
                    ${students.map((s) => `
                        <li class="student-item">
                            <span>${s.name}</span>
                            <button class="icon-btn danger" onclick="window.app.ui.deleteStudent('${s.id}')">\u{1F5D1}\uFE0F</button>
                        </li>
                    `).join("")}
                </ul>
                
                ${students.length === 0 ? '<p class="empty-state">No students yet</p>' : ""}
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
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      container.innerHTML = `
            <div class="schedule-view">
                <h2>Schedule - ${classObj.name}</h2>
                
                <div class="schedule-grid">
                    ${days.map((day, i) => {
        const schedule = classObj.schedule[day] || { enabled: false };
        return `
                            <div class="schedule-day ${schedule.enabled ? "enabled" : ""}">
                                <label class="day-name">
                                    <input type="checkbox" ${schedule.enabled ? "checked" : ""} 
                                           onchange="window.app.ui.toggleDay('${day}')">
                                    ${dayNames[i]}
                                </label>
                                ${schedule.enabled ? `
                                    <div class="time-inputs">
                                        <input type="time" value="${schedule.startTime || "08:00"}"
                                               onchange="window.app.ui.updateSchedule('${day}', 'startTime', this.value)">
                                        <span>to</span>
                                        <input type="time" value="${schedule.endTime || "12:00"}"
                                               onchange="window.app.ui.updateSchedule('${day}', 'endTime', this.value)">
                                    </div>
                                ` : '<span class="no-class">No class</span>'}
                            </div>
                        `;
      }).join("")}
                </div>
            </div>
        `;
    }
    /**
     * Render reports view
     */
    renderReportsView(container) {
      const classObj = this.app.classManager.getById(this.currentClassId);
      const now = /* @__PURE__ */ new Date();
      container.innerHTML = `
            <div class="reports-view">
                <h2>Reports - ${classObj?.name || "Select Class"}</h2>
                
                <div class="report-options">
                    <label>
                        Month:
                        <select id="reportMonth">
                            ${Array.from(
        { length: 12 },
        (_, i) => `<option value="${i + 1}" ${i + 1 === now.getMonth() + 1 ? "selected" : ""}>
                                    ${new Date(0, i).toLocaleString("default", { month: "long" })}
                                </option>`
      ).join("")}
                        </select>
                    </label>
                    
                    <label>
                        Year:
                        <select id="reportYear">
                            ${Array.from(
        { length: 3 },
        (_, i) => `<option value="${now.getFullYear() - i}" ${i === 0 ? "selected" : ""}>
                                    ${now.getFullYear() - i}
                                </option>`
      ).join("")}
                        </select>
                    </label>
                </div>
                
                <div class="report-actions">
                    <button class="btn btn-primary" onclick="window.app.ui.generatePDFReport()">
                        \u{1F4C4} Generate PDF
                    </button>
                    <button class="btn btn-secondary" onclick="window.app.ui.generateCSVReport()">
                        \u{1F4CA} Export CSV
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
      alert(`Imported ${result.imported} students${result.errors.length > 0 ? ". Errors: " + result.errors.join(", ") : ""}`);
      this.refreshCurrentView();
      this.closeModal();
    }
    /**
     * Delete student
     */
    deleteStudent(studentId) {
      if (confirm("Delete this student?")) {
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
          [day]: current ? { enabled: false } : { enabled: true, startTime: "08:00", endTime: "12:00" }
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
      const month = parseInt(document.getElementById("reportMonth").value);
      const year = parseInt(document.getElementById("reportYear").value);
      const report = this.app.reportGenerator.generateMonthlyReport(
        this.currentClassId,
        year,
        month
      );
      const html = this.generateReportHTML(report);
      const printWindow = window.open("", "_blank");
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
    /**
     * Generate CSV report
     */
    generateCSVReport() {
      const month = parseInt(document.getElementById("reportMonth").value);
      const year = parseInt(document.getElementById("reportYear").value);
      const report = this.app.reportGenerator.generateMonthlyReport(
        this.currentClassId,
        year,
        month
      );
      const csv = this.app.reportGenerator.generateCSV(report);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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
                            <th>\xC9l\xE8ve</th>
                            <th class="text-center">Jours</th>
                            <th class="text-center">\xC0 l'heure</th>
                            <th class="text-center">Retards</th>
                            <th class="text-right">Minutes</th>
                            <th class="text-right">Moyenne</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.students.map((s) => `
                            <tr>
                                <td>${s.name}</td>
                                <td class="text-center">${s.totalDays}</td>
                                <td class="text-center">${s.onTime}</td>
                                <td class="text-center">${s.tardies}</td>
                                <td class="text-right">${s.totalMinutesLate}</td>
                                <td class="text-right">${s.avgMinutesLate}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                <p style="margin-top: 20px; text-align: right;">
                    G\xE9n\xE9r\xE9 le ${(/* @__PURE__ */ new Date()).toLocaleDateString()}
                </p>
            </body>
            </html>
        `;
    }
    /**
     * Show modal
     */
    showModal(content) {
      const modal = document.getElementById("modal");
      modal.innerHTML = `<div class="modal-content">${content}</div>`;
      modal.classList.remove("hidden");
    }
    /**
     * Close modal
     */
    closeModal() {
      document.getElementById("modal").classList.add("hidden");
    }
    /**
     * Toggle sidebar
     */
    toggleSidebar() {
      document.getElementById("sidebar").classList.toggle("hidden");
    }
    /**
     * Refresh current view
     */
    refreshCurrentView() {
      this.switchView(this.currentView || "tracker");
    }
    /**
     * Format date
     */
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
  };

  // js/utils/Storage.js
  var Storage = class {
    constructor(namespace = "lateness-tracker") {
      this.namespace = namespace;
    }
    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     */
    set(key, data) {
      try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(`${this.namespace}:${key}`, serialized);
        return true;
      } catch (error) {
        console.error(`Storage error: ${key}`, error);
        return false;
      }
    }
    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default if not found
     * @returns {any}
     */
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(`${this.namespace}:${key}`);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error(`Storage read error: ${key}`, error);
        return defaultValue;
      }
    }
    /**
     * Remove a key
     * @param {string} key - Storage key
     */
    remove(key) {
      localStorage.removeItem(`${this.namespace}:${key}`);
    }
    /**
     * Export all data as JSON
     * @returns {object}
     */
    exportAll() {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`${this.namespace}:`)) {
          const shortKey = key.replace(`${this.namespace}:`, "");
          data[shortKey] = this.get(shortKey);
        }
      }
      return data;
    }
    /**
     * Import data from JSON
     * @param {object} data - Data to import
     */
    importAll(data) {
      Object.entries(data).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
    /**
     * Clear all app data
     */
    clearAll() {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`${this.namespace}:`)) {
          keys.push(key);
        }
      }
      keys.forEach((key) => localStorage.removeItem(key));
    }
  };

  // js/app.js
  var App = class {
    constructor() {
      this.storage = new Storage();
      this.classManager = new ClassManager(this.storage);
      this.studentManager = new StudentManager(this.storage);
      this.arrivalTracker = new ArrivalTracker(this.storage, this.classManager);
      this.reportGenerator = new ReportGenerator(this.storage, this.studentManager, this.classManager);
      this.ui = new UI(this);
      this.init();
    }
    async init() {
      console.log("\u{1F4F1} Lateness Tracker starting...");
      await this.classManager.load();
      await this.studentManager.load();
      await this.arrivalTracker.load();
      this.ui.init();
      console.log("\u2705 App initialized");
    }
    // Get current app state
    getState() {
      return {
        classes: this.classManager.getAll(),
        students: this.studentManager.getAll(),
        arrivals: this.arrivalTracker.getAll(),
        currentClassId: this.ui.currentClassId,
        currentDate: this.ui.currentDate
      };
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    window.app = new App();
  });
})();
