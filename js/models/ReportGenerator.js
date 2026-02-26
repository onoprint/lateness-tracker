/**
 * ReportGenerator - Generate reports (PDF/CSV)
 */

export class ReportGenerator {
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
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

        const report = {
            classId,
            className: classObj.name,
            year,
            month,
            monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
            generatedAt: new Date().toISOString(),
            students: []
        };

        students.forEach(student => {
            const arrivals = this.storage.get('arrivals', []).filter(a => 
                a.studentId === student.id && 
                a.date >= startDate && 
                a.date <= endDate
            );

            const tardies = arrivals.filter(a => a.status === 'late');
            const totalMinutesLate = tardies.reduce((sum, a) => sum + a.minutesLate, 0);

            report.students.push({
                id: student.id,
                name: student.name,
                photoUrl: student.photoUrl,
                totalDays: arrivals.length,
                onTime: arrivals.filter(a => a.status === 'on-time').length,
                tardies: tardies.length,
                totalMinutesLate,
                avgMinutesLate: tardies.length > 0 ? Math.round(totalMinutesLate / tardies.length) : 0,
                arrivals: arrivals.map(a => ({
                    date: a.date,
                    time: a.time,
                    minutesLate: a.minutesLate
                }))
            });
        });

        // Sort by name
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
        
        // Header
        lines.push(`Rapport de retards - ${report.className} - ${report.monthName} ${report.year}`);
        lines.push('');
        
        // Column headers
        lines.push('Nom,Délais,Retards,Minutes de retard, Moyenne');
        
        // Student rows
        report.students.forEach(s => {
            lines.push(`${s.name},${s.totalDays},${s.tardies},${s.totalMinutesLate},${s.avgMinutesLate}`);
        });
        
        // Summary
        const totalDays = report.students.reduce((sum, s) => sum + s.totalDays, 0);
        const totalTardies = report.students.reduce((sum, s) => sum + s.tardies, 0);
        const totalMinutes = report.students.reduce((sum, s) => sum + s.totalMinutesLate, 0);
        
        lines.push('');
        lines.push(`Total,${totalDays},${totalTardies},${totalMinutes},${totalTardies > 0 ? Math.round(totalMinutes / totalTardies) : 0}`);

        return lines.join('\n');
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
        const arrivals = this.storage.get('arrivals', []).filter(a => 
            a.classId === classId && a.date === date
        );

        return {
            classId,
            className: classObj.name,
            date,
            students: students.map(s => {
                const arrival = arrivals.find(a => a.studentId === s.id);
                return {
                    id: s.id,
                    name: s.name,
                    photoUrl: s.photoUrl,
                    arrived: !!arrival,
                    time: arrival ? arrival.time : null,
                    minutesLate: arrival ? arrival.minutesLate : 0,
                    status: arrival ? arrival.status : 'absent'
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
}
