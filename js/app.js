/**
 * Lateness Tracker - Main Application
 * Modular PWA for tracking student arrivals
 * 
 * @author Ono (for Boss)
 * @description Track student lateness, generate reports
 */

import { ClassManager } from './js/models/ClassManager.js';
import { StudentManager } from './js/models/StudentManager.js';
import { ArrivalTracker } from './js/models/ArrivalTracker.js';
import { ReportGenerator } from './js/models/ReportGenerator.js';
import { UI } from './js/views/UI.js';
import { Storage } from './js/utils/Storage.js';

class App {
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
        console.log('📱 Lateness Tracker starting...');
        
        // Load data from storage
        await this.classManager.load();
        await this.studentManager.load();
        await this.arrivalTracker.load();
        
        // Initialize UI
        this.ui.init();
        
        console.log('✅ App initialized');
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
