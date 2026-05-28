const express = require('express');
const router = express.Router();
const {
  analyzeProfile,
  getAllProfiles,
  getSingleProfile,
  deleteProfile,
  compareProfiles,
} = require('../controllers/profileController');

router.post('/analyze/:username', analyzeProfile);
router.get('/compare', compareProfiles);
router.get('/', getAllProfiles);
router.get('/:username', getSingleProfile);
router.delete('/:username', deleteProfile);

module.exports = router;