require('dotenv').config();
const mongoose = require('mongoose');
const Food = require('./models/Food');
const connectDB = require('./config/db');

// 6 initial food items with name, price, category, isVeg flag and image.
const foods = [
  {
    name: 'Classic Margherita Pizza',
    description: 'Wood-fired pizza with mozzarella, fresh basil and tangy tomato sauce.',
    price: 650,
    category: 'Pizza',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&q=80'
  },
  {
    name: 'Smoky Beef Burger',
    description: 'Juicy grilled beef patty with cheddar, lettuce and house sauce.',
    price: 320,
    category: 'Burger',
    isVeg: false,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80'
  },
  {
    name: 'Creamy Alfredo Pasta',
    description: 'Fettuccine tossed in a rich creamy alfredo sauce with parmesan.',
    price: 420,
    category: 'Pasta',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80'
  },
  {
    name: 'Spicy Paneer Tikka',
    description: 'Char-grilled cottage cheese cubes marinated in yogurt and spices.',
    price: 380,
    category: 'Paneer',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80'
  },
  {
    name: 'Crispy Chicken Wings',
    description: 'Crunchy fried wings glazed with hot buffalo sauce, served with dip.',
    price: 350,
    category: 'Wings',
    isVeg: false,
    imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80'
  },
  {
    name: 'Chilled Soft Drinks',
    description: 'Ice-cold refreshing soft drink to complement your meal.',
    price: 60,
    category: 'Drinks',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80'
  }
];

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing foods so seeding is idempotent.
    await Food.deleteMany({});
    console.log('Cleared existing food items. 🧹');

    const inserted = await Food.insertMany(foods);
    console.log(`Seeded ${inserted.length} food items into MongoDB! 🌱`);

    inserted.forEach(f => {
      console.log(`  • ${f.name} — ৳${f.price} [${f.category}] ${f.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}`);
    });

    await mongoose.connection.close();
    console.log('Database connection closed. Seeding complete. ✅');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDB();
