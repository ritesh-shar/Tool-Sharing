const express = require('express');
const {startRental,endRental} = require('../controllers/rentalController');
const protect = require('../middlewares/user.middlewares');

const router = express.Router();

router.post('/:id/rent',protect,startRental);
router.post('/:id/end',protect,endRental);

module.exports = router;
