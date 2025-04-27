import mongoose from 'mongoose';

// Coordinator Schema
const coordinatorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  school: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Student Schema
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  grade: {
    type: String,
    required: true
  },
  class: String,
  dateOfBirth: Date,
  parentName: String,
  contactNumber: String,
  vaccinationStatus: {
    type: String,
    enum: ['vaccinated', 'partially_vaccinated', 'not_vaccinated'],
    default: 'not_vaccinated'
  },
  vaccines: [{
    name: String,
    date: Date,
    doses: Number,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator'
  }
});

// Vaccination Drive Schema
const vaccinationDriveSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  vaccineType: {
    type: String,
    required: true
  },
  description: String,
  targetCount: {
    type: Number,
    required: true
  },
  vaccinatedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator'
  },
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    attended: {
      type: Boolean,
      default: false
    },
    notes: String
  }]
});

// Create models
const Coordinator = mongoose.model('Coordinator', coordinatorSchema);
const Student = mongoose.model('Student', studentSchema);
const VaccinationDrive = mongoose.model('VaccinationDrive', vaccinationDriveSchema);

export { Coordinator, Student, VaccinationDrive };