const mongoose = require('mongoose');

// Define the schema for measurement details (if needed)
const MeasurementDetailSchema = new mongoose.Schema({
  circumference: { type: String, required: true },
  width: { type: String, required: true },
  depth: { type: String, required: true }
}, { _id: false });


const MeasurementSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',       
    required: true 
  },
  height: { type: String, required: true },
  neck: { type: MeasurementDetailSchema, required: true },
  shoulder: { type: MeasurementDetailSchema, required: true },
  chest: { type: MeasurementDetailSchema, required: true },
  waist: { type: MeasurementDetailSchema, required: true },
  hip: { type: MeasurementDetailSchema, required: true },
  thigh: { type: MeasurementDetailSchema, required: true },
  knee: { type: MeasurementDetailSchema, required: true },
  ankle: { type: MeasurementDetailSchema, required: true },
  shirtSize: { type: String },
  pantSize: { type: String }
});

module.exports = mongoose.model('Measurement', MeasurementSchema);
