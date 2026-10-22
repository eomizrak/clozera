import express from 'express'
import * as adminController from '../controllers/admin-controller.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.post('/admin/languages/import', requireAdmin, adminController.importLanguages)
router.post('/admin/language-pairs/import', requireAdmin, adminController.importLanguagePairs)
router.post('/admin/collections/import', requireAdmin, adminController.importCollections)
router.post('/admin/collections/:id/sentences/import', requireAdmin, adminController.importCollectionSentences)

export default router
