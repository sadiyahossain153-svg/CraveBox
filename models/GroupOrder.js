const mongoose = require('mongoose');

const groupOrderSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  hostUser: { type: String, required: true },
  members: [{
    userName: String,
    items: [{
      foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
      foodName: String,
      price: Number,
      quantity: Number
    }],
    individualTotal: { type: Number, default: 0 }
  }],
  grandTotal: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'locked', 'completed'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('GroupOrder', groupOrderSchema);