const express = require('express');
const {addTool,getAllTools,getMyTools,deleteTool} = require('../controllers/toolController');
const protect = require('../middlewares/user.middlewares');

const router = express.Router();

router.post('/',protect,addTool);
router.get('/',getAllTools);
router.get('/me',protect,getMyTools);
router.delete('/:id',protect,deleteTool);

module.exports = router;
