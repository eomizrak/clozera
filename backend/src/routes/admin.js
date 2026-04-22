const express = require('express')
const adminController = require('../controllers/admin-controller')
const { requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.post('/admin/languages/import', requireAdmin, adminController.importLanguages)
router.post('/admin/collections/import', requireAdmin, adminController.importCollections)
router.post('/admin/collections/:id/sentences/import', requireAdmin, adminController.importCollectionSentences)
router.post('/admin/seed/deu-eng', requireAdmin, adminController.seedGermanEnglish)

module.exports = router
