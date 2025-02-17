const { client } = require('../config/db');
const { ObjectId } = require('mongodb');

async function getAllFoods(req, res) {
  try {
    const { category, priceRange } = req.query;
    const database = client.db('food_info');
    const foods = database.collection('food');
    const filters = {};
    if (category) {
      filters.category = category;
    }
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      filters.price = { $gte: parseFloat(min), $lte: parseFloat(max) };
    }
    const foodItems = await foods.find(filters).toArray();
    res.status(200).json(foodItems);
  } catch (error) {
    console.error('Error fetching foods:', error.message);
    res.status(500).json({ message: 'Failed to retrieve food items', error });
  }
}

async function getFoodById(req, res) {
  try {
    const { id } = req.params;
    const database = client.db('food_info');
    const foods = database.collection('food');
    const food = await foods.findOne({ _id: new ObjectId(id) });
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    res.status(200).json(food);
  } catch (error) {
    console.error('Error fetching food by ID:', error.message);
    res.status(500).json({ message: 'Failed to retrieve food item', error });
  }
}

async function purchaseFood(req, res) {
  try {
    const { foodId, foodName, price, quantity, buyerName, buyerEmail } = req.body;
    const database = client.db('food_info');
    const purchases = database.collection('purchases');
    const newPurchase = {
      foodId: new ObjectId(foodId),
      foodName,
      price: parseFloat(price),
      quantity,
      buyerName,
      buyerEmail,
      buyingDate: new Date().toISOString(),
    };
    await purchases.insertOne(newPurchase);
    const updateResult = await database.collection('food').updateOne(
      { _id: new ObjectId(foodId) },
      {
        $inc: { quantity: -quantity, purchaseCount: quantity },
        $push: { orders: newPurchase },
      }
    );
    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: 'Food not found' });
    }
    res.status(201).json({ message: 'Purchase successful' });
  } catch (error) {
    console.error('Error processing purchase:', error.message);
    res.status(500).json({ message: 'Failed to process purchase', error });
  }
}

async function getTopSellingFoods(req, res) {
  try {
    const database = client.db('food_info');
    const foods = database.collection('food');
    const topFoods = await foods.find().sort({ purchaseCount: -1 }).limit(6).toArray();
    res.status(200).json(topFoods);
  } catch (error) {
    console.error('Error fetching top-selling foods:', error.message);
    res.status(500).json({ message: 'Failed to retrieve top-selling foods', error });
  }
}

async function getMyFoods(req, res) {
  try {
    const email = req.user.email;
    const database = client.db('food_info');
    const foods = database.collection('food');
    const userFoods = await foods.find({ 'addedBy.email': email }).toArray();
    res.status(200).json(userFoods);
  } catch (error) {
    console.error('Error fetching user foods:', error.message);
    res.status(500).json({ message: 'Failed to retrieve user foods', error });
  }
}

async function updateFood(req, res) {
  try {
    const { id } = req.params;
    const email = req.user.email;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid food ID' });
    }

    const updateData = {
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      quantity: parseInt(req.body.quantity, 10),
      price: parseFloat(req.body.price),
      description: {
        shortDescription: req.body.description.shortDescription,
        foodOrigin: req.body.description.foodOrigin,
      },
    };

    const database = client.db('food_info');
    const foods = database.collection('food');

    const updatedFood = await foods.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!updatedFood.value) {
      return res.status(404).json({ message: 'Food not found' });
    }

    res.status(200).json(updatedFood.value);
  } catch (error) {
    console.error('Failed to update food item:', error.message);
    res.status(500).json({ message: 'Failed to update food item', error });
  }
}

async function addFood(req, res) {
  try {
    const { name, image, category, quantity, price, addedBy, email, origin, description } = req.body;
    if (!name || !image || !category || !quantity || !price || !addedBy || !email || !origin || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const newFood = {
      name,
      image,
      category,
      quantity: parseInt(quantity, 10),
      price: parseFloat(price),
      addedBy: { name: addedBy, email },
      description: {
        shortDescription: description,
        ingredients: [],
        makingProcedure: '',
        foodOrigin: origin,
      },
      purchaseCount: 0,
      orders: [],
      addedDate: new Date().toISOString(),
    };
    const database = client.db('food_info');
    const foods = database.collection('food');
    await foods.insertOne(newFood);
    res.status(201).json(newFood);
  } catch (error) {
    console.error('Failed to add food item:', error.message);
    res.status(500).json({ message: 'Failed to add food item', error });
  }
}

module.exports = {
  getAllFoods,
  getFoodById,
  purchaseFood,
  getTopSellingFoods,
  getMyFoods,
  updateFood,
  addFood,
};