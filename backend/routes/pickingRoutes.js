const express = require('express');
const pickingController = require('../controllers/pickingController');

const router = express.Router();

router.get('/so-list', pickingController.getPendingSOs);
router.get('/so-details/:so', pickingController.getSODetails);
router.get('/sku-master',pickingController.getSKUMaster);
router.post('/start-picking/:so', pickingController.startPicking);
router.post('/submit/:so', pickingController.submitSO);


module.exports = router;