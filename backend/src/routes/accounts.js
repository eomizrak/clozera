const express = require('express')
const accountsController = require('../controllers/accounts-controller')

const router = express.Router()

router.post('/register', accountsController.register)
router.post('/session', accountsController.login)
router.get('/session', accountsController.getSession)
router.delete('/session', accountsController.logout)

module.exports = router
