const express = require('express')
const dashboardController = require('../controllers/dashboard-controller')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/users/me/dashboard', requireAuth, dashboardController.getMyDashboard)
router.get('/language-pairs/:slug/dashboard', requireAuth, dashboardController.getDashboard)

module.exports = router
