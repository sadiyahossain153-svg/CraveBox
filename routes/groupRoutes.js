const express = require('express');
const router = express.Router();
const GroupOrder = require('../models/GroupOrder');

// Recalculate a member's individual total and the group grand total.
const recalcTotals = (group) => {
  group.members.forEach(m => {
    m.individualTotal = m.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  });
  group.grandTotal = group.members.reduce((acc, m) => acc + m.individualTotal, 0);
};

// 1. Create a brand new group order (host becomes the first member).
router.post('/create', async (req, res) => {
  try {
    const { groupName, hostUser } = req.body;
    if (!groupName || !hostUser) {
      return res.status(400).json({ message: 'Group name and your name are required.' });
    }

    const newGroup = new GroupOrder({
      groupName,
      hostUser,
      members: [{ userName: hostUser, items: [], individualTotal: 0 }]
    });
    const savedGroup = await newGroup.save();
    res.status(201).json({ message: 'Group created!', group: savedGroup });
  } catch (err) {
    res.status(500).json({ message: 'Could not create group.', error: err.message });
  }
});

// 2. Join an existing group by name (case-insensitive). Creates it if not found.
router.post('/join', async (req, res) => {
  try {
    const { groupName, userName } = req.body;
    if (!groupName || !userName) {
      return res.status(400).json({ message: 'Group name and your name are required.' });
    }

    let group = await GroupOrder.findOne({
      groupName: { $regex: new RegExp(`^${groupName.trim()}$`, 'i') },
      status: 'active'
    });

    if (!group) {
      // No such active group — create one with this user as host.
      group = new GroupOrder({
        groupName,
        hostUser: userName,
        members: [{ userName, items: [], individualTotal: 0 }]
      });
    } else if (!group.members.some(m => m.userName === userName)) {
      group.members.push({ userName, items: [], individualTotal: 0 });
    }

    const saved = await group.save();
    res.status(200).json({ message: `Joined "${saved.groupName}"!`, group: saved });
  } catch (err) {
    res.status(500).json({ message: 'Could not join group.', error: err.message });
  }
});

// 3. Fetch the full current state of a group (for live bill rendering).
router.get('/:id', async (req, res) => {
  try {
    const group = await GroupOrder.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch group.', error: err.message });
  }
});

// 4. Add an item for a member and recalculate the split bill.
router.post('/add-item', async (req, res) => {
  try {
    const { groupId, userName, item } = req.body; // item = { foodId, foodName, price, quantity }
    if (!groupId || !userName || !item) {
      return res.status(400).json({ message: 'groupId, userName and item are required.' });
    }

    const group = await GroupOrder.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.status === 'completed') {
      return res.status(400).json({ message: 'This group order is already completed and locked.' });
    }

    // Find the member subdocument, or add a new one and re-fetch it from the array.
    let member = group.members.find(m => m.userName === userName);
    if (!member) {
      group.members.push({ userName, items: [], individualTotal: 0 });
      member = group.members.find(m => m.userName === userName);
    }

    // Merge quantity if the same item is added twice.
    const existing = member.items.find(it => String(it.foodId) === String(item.foodId));
    if (existing) {
      existing.quantity += (item.quantity || 1);
    } else {
      member.items.push({
        foodId: item.foodId,
        foodName: item.foodName,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1
      });
    }

    recalcTotals(group);
    await group.save();

    res.status(200).json({ message: 'Item added and bill calculated!', group });
  } catch (err) {
    res.status(500).json({ message: 'Could not add item.', error: err.message });
  }
});

// 5. Remove an item for a member and recalculate the split bill.
router.post('/remove-item', async (req, res) => {
  try {
    const { groupId, userName, foodId } = req.body;
    const group = await GroupOrder.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const member = group.members.find(m => m.userName === userName);
    if (!member) return res.status(404).json({ message: 'Member not found.' });

    member.items = member.items.filter(it => String(it.foodId) !== String(foodId));
    recalcTotals(group);
    await group.save();

    res.status(200).json({ message: 'Item removed.', group });
  } catch (err) {
    res.status(500).json({ message: 'Could not remove item.', error: err.message });
  }
});

module.exports = router;
