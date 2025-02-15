const express = require('express');
const router = express.Router();
const {
  getAllFoods,
  getFoodById,
  purchaseFood,
  getTopSellingFoods
} = require('../controllers/foodController');

router.get('/foods', getAllFoods);
router.get('/foods/:id', getFoodById);
router.post('/foods/:id/purchase', purchaseFood);
router.post('/purchase', purchaseFood);
router.get('/top-foods', getTopSellingFoods); 

module.exports = router;