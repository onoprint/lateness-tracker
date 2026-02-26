/**
 * ArrivalTracker - Track student arrivals
 */

export class ArrivalTracker {
    constructor(storage, classManager) {
        this.storage = storage;
        this.classManager = classManager;
        this.arrivals = [];
    }

    /**
     * Load arrivals from storage
     */
    async load() {
        this.arrivals = this.storage.get('arrivals', []);
    }

    /**
     * Save arrivals to storage
     */
    save() {
        this.storage.set('arrivals', this.arrivals);
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
        return this.arrivals.filter(a => a.date === date);
    }

    /**
     * Get arrivals for a class on a specific date
     * @param {string} classId 
     * @param {string} date 
     * @returns {array}
     */
    getByClassAndDate(classId, date) {
        return this.arrivals.filter(a => a.classId === classId && a.date === date);
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
        // Check if already arrived
        const existing = this.arrivals.find(a => 
            a.studentId === studentId && a.date === date
        );
        
        if (existing) {
            return { success: false, message: 'Already marked', arrival: existing };
        }

        // Calculate minutes late
        const arrivalTime = time || new Date().toTimeString().substr(0, 5);
        const dayOfWeek = new Date(date).getDay();
        const schedule = this.classManager.getScheduleForDay(classId, dayOfWeek);
        
        let minutesLate = 0;
        let status = 'on-time';
        
        if (schedule && schedule.enabled && schedule.startTime) {
            const [scheduleHour, scheduleMin] = schedule.startTime.split(':').map(Number);
            const [arrivalHour, arrivalMin] = arrivalTime.split(':').map(Number);
            
            const scheduleMinutes = scheduleHour * 60 + scheduleMin;
            const arrivalMinutes = arrivalHour * 60 + arrivalMin;
            
            minutesLate = Math.max(0, arrivalMinutes - scheduleMinutes);
            status = minutesLate > 0 ? 'late' : 'on-time';
        }

        const arrival = {
            id: this.generateId(),
            studentId,
            classId,
            date,
            time: arrivalTime,
            minutesLate,
            status,
            createdAt: new Date().toISOString()
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
        const index = this.arrivals.findIndex(a => 
            a.studentId === studentId && a.date === date
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
        return this.arrivals.find(a => a.studentId === studentId && a.date === date) || null;
    }

    /**
     * Get statistics for a student
     * @param {string} studentId 
     * @param {string} startDate 
     * @param {string} endDate 
     * @returns {object}
     */
    getStudentStats(studentId, startDate = null, endDate = null) {
        let filtered = this.arrivals.filter(a => a.studentId === studentId);
        
        if (startDate) {
            filtered = filtered.filter(a => a.date >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(a => a.date <= endDate);
        }

        const total = filtered.length;
        const tardies = filtered.filter(a => a.status === 'late').length;
        const onTime = filtered.filter(a => a.status === 'on-time').length;
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
        let filtered = this.arrivals.filter(a => a.classId === classId);
        
        if (startDate) {
            filtered = filtered.filter(a => a.date >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(a => a.date <= endDate);
        }

        const tardies = filtered.filter(a => a.status === 'late').length;
        const onTime = filtered.filter(a => a.status === 'on-time').length;

        return {
            totalArrivals: filtered.length,
            onTime,
            tardies,
            latenessRate: filtered.length > 0 ? Math.round((tardies / filtered.length) * 100) : 0
        };
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'arr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}
