import express from 'express';
import { Student, VaccinationDrive } from '../models/index.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Count total students
    const totalStudents = await Student.countDocuments({
      createdBy: req.coordinator.id
    });

    // Count vaccinated students
    const vaccinatedStudents = await Student.countDocuments({
      createdBy: req.coordinator.id,
      vaccinationStatus: 'vaccinated'
    });

    // Count partially vaccinated students
    const partiallyVaccinatedStudents = await Student.countDocuments({
      createdBy: req.coordinator.id,
      vaccinationStatus: 'partially_vaccinated'
    });

    // Count upcoming drives
    const upcomingDrives = await VaccinationDrive.countDocuments({
      createdBy: req.coordinator.id,
      status: 'scheduled',
      date: { $gte: new Date() }
    });

    // Calculate vaccination rate
    const vaccinationRate = totalStudents > 0 
      ? Math.round((vaccinatedStudents / totalStudents) * 100 * 10) / 10
      : 0;

    // Get recent vaccination data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDrives = await VaccinationDrive.find({
      createdBy: req.coordinator.id,
      status: { $in: ['in_progress', 'completed'] },
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });

    // Group by date and count vaccinations
    const recentVaccinationData = [];
    const dateMap = new Map();

    recentDrives.forEach(drive => {
      const date = new Date(drive.date).toISOString().split('T')[0];
      const count = drive.vaccinatedCount || 0;
      
      if (dateMap.has(date)) {
        dateMap.set(date, dateMap.get(date) + count);
      } else {
        dateMap.set(date, count);
      }
    });

    // Fill in missing dates
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      recentVaccinationData.unshift({
        date: dateStr,
        count: dateMap.get(dateStr) || 0
      });
    }

    // Get upcoming drives
    const upcomingDrivesList = await VaccinationDrive.find({
      createdBy: req.coordinator.id,
      status: 'scheduled',
      date: { $gte: new Date() }
    })
    .sort({ date: 1 })
    .limit(3);

    res.json({
      totalStudents,
      vaccinatedStudents,
      pendingVaccinations: totalStudents - vaccinatedStudents,
      upcomingDrives,
      vaccinationRate,
      recentVaccinationData,
      upcomingDrivesList
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vaccination reports data
router.get('/data', auth, async (req, res) => {
  try {
    const { startDate, endDate, grade, vaccineType } = req.query;
    
    // Prepare query filters
    const studentQuery = { createdBy: req.coordinator.id };
    const driveQuery = { createdBy: req.coordinator.id };
    
    if (grade) studentQuery.grade = grade;
    
    if (startDate || endDate) {
      driveQuery.date = {};
      if (startDate) driveQuery.date.$gte = new Date(startDate);
      if (endDate) driveQuery.date.$lte = new Date(endDate);
    }
    
    if (vaccineType) driveQuery.vaccineType = vaccineType;

    // Get vaccination status distribution
    const allStudents = await Student.find(studentQuery);
    
    const vaccinationStatusDistribution = [
      {
        status: 'Fully Vaccinated',
        count: allStudents.filter(s => s.vaccinationStatus === 'vaccinated').length
      },
      {
        status: 'Partially Vaccinated',
        count: allStudents.filter(s => s.vaccinationStatus === 'partially_vaccinated').length
      },
      {
        status: 'Not Vaccinated',
        count: allStudents.filter(s => s.vaccinationStatus === 'not_vaccinated').length
      }
    ];

    // Get vaccination rate by grade
    const grades = ['9th', '10th', '11th', '12th'];
    
    const vaccinationRateByGrade = await Promise.all(
      grades.map(async (grade) => {
        const gradeStudents = allStudents.filter(s => s.grade === grade);
        const totalInGrade = gradeStudents.length;
        const vaccinatedInGrade = gradeStudents.filter(
          s => s.vaccinationStatus === 'vaccinated'
        ).length;
        
        const rate = totalInGrade > 0 
          ? Math.round((vaccinatedInGrade / totalInGrade) * 100)
          : 0;
          
        return { grade, rate };
      })
    );

    // Get vaccine type distribution
    const vaccineTypes = new Map();
    
    allStudents.forEach(student => {
      student.vaccines.forEach(vaccine => {
        const count = vaccineTypes.get(vaccine.name) || 0;
        vaccineTypes.set(vaccine.name, count + 1);
      });
    });
    
    const vaccineTypeDistribution = Array.from(vaccineTypes.entries()).map(
      ([type, count]) => ({ type, count })
    );

    // Get vaccination rate by month
    const drives = await VaccinationDrive.find(driveQuery)
      .sort({ date: 1 });
    
    const monthlyData = new Map();
    
    drives.forEach(drive => {
      const date = new Date(drive.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })}`;
      
      const existing = monthlyData.get(monthYear) || { total: 0, vaccinated: 0 };
      existing.total += drive.targetCount;
      existing.vaccinated += drive.vaccinatedCount;
      monthlyData.set(monthYear, existing);
    });
    
    const vaccinationRateByMonth = Array.from(monthlyData.entries()).map(
      ([month, data]) => ({ 
        month, 
        rate: data.total > 0 
          ? Math.round((data.vaccinated / data.total) * 100) 
          : 0
      })
    );

    // Get recent vaccination data (for charts)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentDrives = await VaccinationDrive.find({
      createdBy: req.coordinator.id,
      status: { $in: ['in_progress', 'completed'] },
      date: { $gte: last30Days }
    }).sort({ date: 1 });
    
    const recentVaccinations = [];
    const dailyMap = new Map();
    
    recentDrives.forEach(drive => {
      const date = new Date(drive.date).toISOString().split('T')[0];
      const count = drive.vaccinatedCount || 0;
      
      if (dailyMap.has(date)) {
        dailyMap.set(date, dailyMap.get(date) + count);
      } else {
        dailyMap.set(date, count);
      }
    });
    
    // Convert map to array
    for (const [date, count] of dailyMap.entries()) {
      recentVaccinations.push({ date, count });
    }
    
    // Sort by date
    recentVaccinations.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      vaccinationStatusDistribution,
      vaccinationRateByGrade,
      vaccineTypeDistribution,
      vaccinationRateByMonth,
      recentVaccinations
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;