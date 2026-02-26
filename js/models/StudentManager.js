/**
 * StudentManager - Manage students per class
 */

export class StudentManager {
    constructor(storage) {
        this.storage = storage;
        this.students = [];
    }

    /**
     * Load students from storage
     */
    async load() {
        this.students = this.storage.get('students', []);
    }

    /**
     * Save students to storage
     */
    save() {
        this.storage.set('students', this.students);
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
        return this.students.filter(s => s.classId === classId);
    }

    /**
     * Get student by ID
     * @param {string} id 
     * @returns {object|null}
     */
    getById(id) {
        return this.students.find(s => s.id === id) || null;
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
            createdAt: new Date().toISOString()
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
        const index = this.students.findIndex(s => s.id === id);
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
        this.students = this.students.filter(s => s.id !== id);
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
        const lines = csvContent.trim().split('\n');
        const results = { success: true, imported: 0, errors: [] };
        
        // Skip header if present
        const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(',').map(p => p.trim());
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
    getSortedByName(classId) {
        return this.getByClass(classId).sort((a, b) => 
            a.name.localeCompare(b.name)
        );
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'stu_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}
