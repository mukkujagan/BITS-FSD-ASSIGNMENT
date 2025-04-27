import express from 'express';
import { VaccinationDrive, Student } from '../models/index.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all vaccination drives
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { createdBy: req.coordinator.id };

    // Apply status filter if provided
    if (status) {
      query.status = status;
    }

    const drives = await VaccinationDrive.find(query)
      .sort({ date: 1 })
      .populate('students.student', 'name studentId grade class');

    res.json(drives);
  } catch (error) {
    console.error('Error fetching vaccination drives:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single vaccination drive by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const drive = await VaccinationDrive.findOne({
      _id: req.params.id,
      createdBy: req.coordinator.id
    }).populate('students.student', 'name studentId grade class vaccinationStatus');

    if (!drive) {
      return res.status(404).json({ message: 'Vaccination drive not found' });
    }

    res.json(drive);
  } catch (error) {
    console.error('Error fetching vaccination drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new vaccination drive
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      date,
      location,
      vaccineType,
      description,
      targetCount,
      students
    } = req.body;

    // Validate required fields
    if (!name || !date || !location || !vaccineType || !targetCount) {
      return res.status(400).json({ 
        message: 'Name, date, location, vaccine type, and target count are required' 
      });
    }

    const driveDate = new Date(date);

    // Check for schedule conflicts (drives on the same day at the same location)
    const existingDrive = await VaccinationDrive.findOne({
      createdBy: req.coordinator.id,
      location,
      date: {
        $gte: new Date(driveDate.setHours(0, 0, 0, 0)),
        $lt: new Date(driveDate.setHours(23, 59, 59, 999))
      }
    });

    if (existingDrive) {
      return res.status(400).json({ 
        message: `There is already a vaccination drive scheduled at ${location} on the selected date` 
      });
    }

    // Create new vaccination drive
    const newDrive = new VaccinationDrive({
      name,
      date,
      location,
      vaccineType,
      description,
      targetCount,
      vaccinatedCount: 0,
      status: 'scheduled',
      createdBy: req.coordinator.id,
      students: students || []
    });

    await newDrive.save();
    res.status(201).json(newDrive);
  } catch (error) {
    console.error('Error creating vaccination drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a vaccination drive
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      date,
      location,
      vaccineType,
      description,
      targetCount,
      status
    } = req.body;

    // Find the drive first
    const drive = await VaccinationDrive.findOne({
      _id: req.params.id,
      createdBy: req.coordinator.id
    });

    if (!drive) {
      return res.status(404).json({ message: 'Vaccination drive not found' });
    }

    // Check if we can still modify this drive
    if (drive.status === 'completed' || drive.status === 'cancelled') {
      return res.status(400).json({ 
        message: `Cannot modify a ${drive.status} vaccination drive` 
      });
    }

    // Check for schedule conflicts, but exclude the current drive
    if (date && location && (new Date(date).getTime() !== new Date(drive.date).getTime() || location !== drive.location)) {
      const driveDate = new Date(date);
      
      const existingDrive = await VaccinationDrive.findOne({
        _id: { $ne: req.params.id },
        createdBy: req.coordinator.id,
        location,
        date: {
          $gte: new Date(driveDate.setHours(0, 0, 0, 0)),
          $lt: new Date(driveDate.setHours(23, 59, 59, 999))
        }
      });

      if (existingDrive) {
        return res.status(400).json({ 
          message: `There is already a vaccination drive scheduled at ${location} on the selected date` 
        });
      }
    }

    // Update the drive
    drive.name = name || drive.name;
    drive.date = date || drive.date;
    drive.location = location || drive.location;
    drive.vaccineType = vaccineType || drive.vaccineType;
    drive.description = description || drive.description;
    drive.targetCount = targetCount || drive.targetCount;
    
    // Only update status if provided and it's a valid transition
    if (status) {
      const validTransitions = {
        scheduled: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled']
      };

      if (validTransitions[drive.status] && validTransitions[drive.status].includes(status)) {
        drive.status = status;
      } else {
        return res.status(400).json({ 
          message: `Invalid status transition from ${drive.status} to ${status}` 
        });
      }
    }

    await drive.save();
    res.json(drive);
  } catch (error) {
    console.error('Error updating vaccination drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a vaccination drive
router.delete('/:id', auth, async (req, res) => {
  try {
    const drive = await VaccinationDrive.findOne({
      _id: req.params.id,
      createdBy: req.coordinator.id
    });

    if (!drive) {
      return res.status(404).json({ message: 'Vaccination drive not found' });
    }

    // Only allow deletion of scheduled drives
    if (drive.status !== 'scheduled') {
      return res.status(400).json({ 
        message: `Cannot delete a ${drive.status} vaccination drive` 
      });
    }

    await drive.remove();
    res.json({ message: 'Vaccination drive removed' });
  } catch (error) {
    console.error('Error deleting vaccination drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add students to a vaccination drive
router.post('/:id/students', auth, async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs are required' });
    }

    const drive = await VaccinationDrive.findOne({
      _id: req.params.id,
      createdBy: req.coordinator.id
    });

    if (!drive) {
      return res.status(404).json({ message: 'Vaccination drive not found' });
    }

    // Only allow adding students to scheduled or in-progress drives
    if (drive.status !== 'scheduled' && drive.status !== 'in_progress') {
      return res.status(400).json({ 
        message: `Cannot add students to a ${drive.status} vaccination drive` 
      });
    }

    // Get existing student IDs in the drive
    const existingStudentIds = drive.students.map(s => s.student.toString());

    // Fetch students by their IDs
    const students = await Student.find({
      _id: { $in: studentIds },
      createdBy: req.coordinator.id
    });

    if (students.length === 0) {
      return res.status(404).json({ message: 'No valid students found' });
    }

    // Add new students to the drive
    let addedCount = 0;
    for (const student of students) {
      if (!existingStudentIds.includes(student._id.toString())) {
        drive.students.push({
          student: student._id,
          attended: false
        });
        addedCount++;
      }
    }

    if (addedCount === 0) {
      return res.status(400).json({ message: 'All selected students are already in this drive' });
    }

    await drive.save();
    res.json({
      message: `Added ${addedCount} students to the vaccination drive`,
      drive
    });
  } catch (error) {
    console.error('Error adding students to vaccination drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark student attendance and update vaccination status
router.put('/:driveId/students/:studentId', auth, async (req, res) => {
  try {
    const { attended, notes } = req.body;

    const drive = await VaccinationDrive.findOne({
      _id: req.params.driveId,
      createdBy: req.coordinator.id
    });

    if (!drive) {
      return res.status(404).json({ message: 'Vaccination drive not found' });
    }

    // Only allow attendance updates for in-progress drives
    if (drive.status !== 'in_progress') {
      return res.status(400).json({ 
        message: `Cannot update attendance for a ${drive.status} vaccination drive` 
      });
    }

    // Find the student in the drive
    const studentEntry = drive.students.find(
      s => s.student.toString() === req.params.studentId
    );

    if (!studentEntry) {
      return res.status(404).json({ message: 'Student not found in this vaccination drive' });
    }

    // Update attendance status
    const wasAttendedBefore = studentEntry.attended;
    studentEntry.attended = attended;
    studentEntry.notes = notes;

    // Update vaccinated count
    if (!wasAttendedBefore && attended) {
      drive.vaccinatedCount += 1;
    } else if (wasAttendedBefore && !attended) {
      drive.vaccinatedCount = Math.max(0, drive.vaccinatedCount - 1);
    }

    await drive.save();

    // If student attended, update their vaccination record
    if (attended) {
      const student = await Student.findOne({
        _id: req.params.studentId,
        createdBy: req.coordinator.id
      });

      if (student) {
        // Find if student has this vaccine already
        const existingVaccine = student.vaccines.find(v => v.name === drive.vaccineType);

        if (existingVaccine) {
          // Increment doses
          existingVaccine.doses += 1;
          existingVaccine.date = new Date();
          
          // Check if vaccination is complete based on the type
          // This is a simplified logic. In a real app, this would depend on vaccine type
          if (existingVaccine.doses >= 2) {
            existingVaccine.completed = true;
          }
        } else {
          // Add new vaccine record
          student.vaccines.push({
            name: drive.vaccineType,
            date: new Date(),
            doses: 1,
            completed: false
          });
        }

        // Update overall vaccination status
        const allCompleted = student.vaccines.every(v => v.completed);
        const someCompleted = student.vaccines.some(v => v.completed);

        if (allCompleted && student.vaccines.length > 0) {
          student.vaccinationStatus = 'vaccinated';
        } else if (someCompleted || student.vaccines.length > 0) {
          student.vaccinationStatus = 'partially_vaccinated';
        }

        await student.save();
      }
    }

    res.json({
      message: `Student attendance updated`,
      drive
    });
  } catch (error) {
    console.error('Error updating student attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard statistics for upcoming drives
router.get('/stats/upcoming', auth, async (req, res) => {
  try {
    // Get upcoming scheduled drives
    const upcomingDrives = await VaccinationDrive.find({
      createdBy: req.coordinator.id,
      status: 'scheduled',
      date: { $gte: new Date() }
    })
    .sort({ date: 1 })
    .limit(3);

    res.json(upcomingDrives);
  } catch (error) {
    console.error('Error fetching upcoming drives:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;