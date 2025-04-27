import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { Student } from '../models/index.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Set up multer storage for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Get all students (with filtering options)
router.get('/', auth, async (req, res) => {
  try {
    const { grade, status, search } = req.query;
    const query = { createdBy: req.coordinator.id };

    // Apply filters if provided
    if (grade) query.grade = grade;
    if (status) query.vaccinationStatus = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query).sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      createdBy: req.coordinator.id
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new student
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      studentId,
      grade,
      class: className,
      dateOfBirth,
      parentName,
      contactNumber,
      vaccinationStatus,
      vaccines
    } = req.body;

    // Validate required fields
    if (!name || !studentId || !grade) {
      return res.status(400).json({ message: 'Name, student ID, and grade are required' });
    }

    // Check if student with the same ID already exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this ID already exists' });
    }

    // Create new student
    const newStudent = new Student({
      name,
      studentId,
      grade,
      class: className,
      dateOfBirth,
      parentName,
      contactNumber,
      vaccinationStatus: vaccinationStatus || 'not_vaccinated',
      vaccines: vaccines || [],
      createdBy: req.coordinator.id
    });

    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a student
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      studentId,
      grade,
      class: className,
      dateOfBirth,
      parentName,
      contactNumber,
      vaccinationStatus,
      vaccines
    } = req.body;

    // Find and update student
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.coordinator.id },
      {
        name,
        studentId,
        grade,
        class: className,
        dateOfBirth,
        parentName,
        contactNumber,
        vaccinationStatus,
        vaccines
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a student
router.delete('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.coordinator.id
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student removed' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk import students from CSV
router.post('/import', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const results = [];
    let errors = [];
    let success = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (data) => {
        results.push(data);
      })
      .on('end', async () => {
        // Process each row
        for (const row of results) {
          try {
            // Check for required fields
            if (!row.name || !row.studentId || !row.grade) {
              errors.push(`Missing required fields for student: ${row.studentId || 'unknown'}`);
              continue;
            }

            // Check if student already exists
            const existingStudent = await Student.findOne({ studentId: row.studentId });
            if (existingStudent) {
              errors.push(`Student with ID ${row.studentId} already exists`);
              continue;
            }

            // Create new student
            const newStudent = new Student({
              name: row.name,
              studentId: row.studentId,
              grade: row.grade,
              class: row.class || '',
              dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
              parentName: row.parentName || '',
              contactNumber: row.contactNumber || '',
              vaccinationStatus: row.vaccinationStatus || 'not_vaccinated',
              createdBy: req.coordinator.id
            });

            await newStudent.save();
            success++;
          } catch (error) {
            errors.push(`Error importing student ${row.studentId}: ${error.message}`);
          }
        }

        // Delete the uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          message: `Imported ${success} students successfully`,
          errors: errors.length > 0 ? errors : null,
          successCount: success,
          totalCount: results.length
        });
      });
  } catch (error) {
    // Make sure to delete the file if an error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error importing students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export students to CSV
router.get('/export', auth, async (req, res) => {
  try {
    const { grade, status } = req.query;
    const query = { createdBy: req.coordinator.id };

    // Apply filters if provided
    if (grade) query.grade = grade;
    if (status) query.vaccinationStatus = status;

    const students = await Student.find(query);

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found matching the criteria' });
    }

    // Create CSV headers
    const fields = [
      'Name',
      'Student ID',
      'Grade',
      'Class',
      'Date of Birth',
      'Parent Name',
      'Contact Number',
      'Vaccination Status'
    ];

    // Create CSV content
    let csv = fields.join(',') + '\n';
    
    students.forEach(student => {
      const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '';
      const row = [
        student.name.replace(/,/g, ' '),
        student.studentId,
        student.grade,
        student.class || '',
        dob,
        (student.parentName || '').replace(/,/g, ' '),
        student.contactNumber || '',
        student.vaccinationStatus
      ];
      csv += row.join(',') + '\n';
    });

    // Set the headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    
    res.send(csv);
  } catch (error) {
    console.error('Error exporting students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;