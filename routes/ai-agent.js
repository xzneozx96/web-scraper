const express = require('express');
const router = express.Router();

const aiAgentController = require('../controllers/ai-agent');

router.post('/generate-answer', aiAgentController.generateAnswer);
router.post('/:action', aiAgentController.interactWithGPT);
// router.post('/optimize-question', aiAgentController.optimizeQuestion);

module.exports = router;
