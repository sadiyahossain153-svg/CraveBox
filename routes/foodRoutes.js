const express = require('express');
const router = express.Router();
const Food = require('../models/Food');

// ১. নতুন খাবার যোগ করার লিঙ্ক (Add Food)
router.post('/add', async (req, res) => {
  try {
    const newFood = new Food(req.body);
    const savedFood = await newFood.save();
    res.status(201).json(savedFood);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ২. সব খাবার দেখার লিঙ্ক + Veg / Non-Veg ফিল্টার
router.get('/', async (req, res) => {
  try {
    const { vegOnly } = req.query;
    let query = {};
    
    // যদি কেউ শুধু Veg খাবার দেখতে চায় (?vegOnly=true)
    if (vegOnly === 'true') {
      query.isVeg = true;
    }

    const foods = await Food.find(query);
    res.status(200).json(foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;