const express = require('express')
const languagesController = require('../controllers/languages-controller')

const router = express.Router()

router.get('/languages', languagesController.listLanguages)
router.get('/language-pairs', languagesController.listLanguagePairs)

module.exports = router
