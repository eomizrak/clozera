const express = require('express')
const languagesController = require('../controllers/languages-controller')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/languages', languagesController.listLanguages)
router.get('/language-pairs', languagesController.listLanguagePairs)
router.patch('/users/me/language-pair', requireAuth, languagesController.selectLanguagePair)

module.exports = router
