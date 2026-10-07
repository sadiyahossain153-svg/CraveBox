const mongoose = require('mongoose');

// A single item within an order.
const orderItemSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  foodName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  isVeg: { type: Boolean, default: false }
}, { _id: false });

// Per-member breakdown for group / split-bill orders.
const memberSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  items: [orderItemSchema],
  individualTotal: { type: Number, default: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  groupName: { type: String, default: null },
  members: { type: [memberSchema], default: [] },
  items: { type: [orderItemSchema], default: [] },
  grandTotal: { type: Number, required: true, default: 0 },
  delivery: {
    address: { type: String, required: true },
    phone: { type: String, required: true },
    paymentMethod: {
      type: String,
      enum: ['cod', 'bkash', 'card'],
      default: 'cod'
    }
  },
  status: {
    type: String,
    enum: ['placed', 'preparing', 'on-the-way', 'delivered', 'cancelled'],
    default: 'placed'
  },
  orderCode: { type: String },
  placedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
