/**
 * ClassManager - Manage classes and schedules
 */

export class ClassManager {
    constructor(storage) {
        this.storage = storage;
        this.classes = [];
    }

    /**
     * Load classes from storage
     */
    async load() {
        this.classes = this.storage.get('classes', []);
    }

    /**
     * Save classes to storage
     */
    save() {
        this.storage.set('classes', this.classes);
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
        return this.classes.find(c => c.id === id) || null;
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
            createdAt: new Date().toISOString()
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
        const index = this.classes.findIndex(c => c.id === id);
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
        this.classes = this.classes.filter(c => c.id !== id);
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
        
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        
        return classObj.schedule[dayName] || null;
    }

    /**
     * Default weekly schedule template
     */
    defaultSchedule() {
        return {
            monday: { enabled: true, startTime: '12:30', endTime: '14:20' },
            tuesday: { enabled: true, startTime: '12:30', endTime: '14:20' },
            wednesday: { enabled: true, startTime: '12:30', endTime: '14:20' },
            thursday: { enabled: true, startTime: '12:30', endTime: '14:20' },
            friday: { enabled: true, startTime: '12:30', endTime: '14:20' },
            saturday: { enabled: true, startTime: '12:30', endTime: '14:20' },
            sunday: { enabled: false }
        };
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'cls_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}
