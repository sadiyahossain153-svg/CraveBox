const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const GroupOrder = require('../models/GroupOrder');

// Generate a short human-friendly order code, e.g. CB-4F9K2A
const generateOrderCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CB-${code}`;
};

// POST /api/orders — place a new order (solo or group split-bill checkout).
router.post('/', async (req, res) => {
  try {
    const { address, phone, paymentMethod, groupId } = req.body;

    // Basic validation for graceful error handling.
    if (!address || !String(address).trim()) {
      return res.status(400).json({ message: 'Delivery address is required.' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }
    const validPayments = ['cod', 'bkash', 'card'];
    if (!paymentMethod || !validPayments.includes(paymentMethod)) {
      return res.status(400).json({ message: 'A valid payment method is required (cod / bkash / card).' });
    }

    let order;

    if (groupId) {
      // ---- Group / split-bill checkout ----
      const group = await GroupOrder.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group order not found.' });
      }

      const members = group.members
        .map(m => ({
          userName: m.userName,
          items: m.items.map(it => ({
            foodId: it.foodId,
            foodName: it.foodName,
            price: it.price,
            quantity: it.quantity
          })),
          individualTotal: m.individualTotal
        }))
        .filter(m => m.items.length > 0);

      if (members.length === 0) {
        return res.status(400).json({ message: 'No items have been added to this group order yet.' });
      }

      const grandTotal = members.reduce((acc, m) => acc + m.individualTotal, 0);

      order = new Order({
        groupName: group.groupName,
        members,
        items: [],
        grandTotal,
        delivery: { address, phone, paymentMethod },
        status: 'placed',
        orderCode: generateOrderCode()
      });

      const savedOrder = await order.save();

      // Lock the group so no new items can be added after checkout.
      group.status = 'completed';
      await group.save();

      return res.status(201).json({ message: 'Group order placed successfully!', order: savedOrder });
    }

    // ---- Solo checkout (items sent directly from the cart) ----
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your order is empty. Add at least one item.' });
    }

    const cleanItems = items.map(it => ({
      foodId: it.foodId,
      foodName: it.foodName,
      price: Number(it.price),
      quantity: Number(it.quantity) || 1,
      isVeg: !!it.isVeg
    }));

    const grandTotal = cleanItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

    order = new Order({
      groupName: null,
      members: [],
      items: cleanItems,
      grandTotal,
      delivery: { address, phone, paymentMethod },
      status: 'placed',
      orderCode: generateOrderCode()
    });

    const savedOrder = await order.save();
    return res.status(201).json({ message: 'Order placed successfully!', order: savedOrder });
  } catch (err) {
    res.status(500).json({ message: 'Could not place order.', error: err.message });
  }
});

// GET /api/orders/:id — fetch a single order (used for status checks).
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch order.', error: err.message });
  }
});

module.exports = router;
