const express = require('express')
const adminController = require('../controllers/admin-controller')
const { requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.post('/admin/languages/import', requireAdmin, adminController.importLanguages)
router.post('/admin/language-pairs/import', requireAdmin, adminController.importLanguagePairs)
router.post('/admin/collections/import', requireAdmin, adminController.importCollections)
router.post('/admin/collections/:id/sentences/import', requireAdmin, adminController.importCollectionSentences)

module.exports = router
