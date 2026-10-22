import express from 'express'
import * as collectionsController from '../controllers/collections-controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/dashboard/collections', requireAuth, collectionsController.listDashboardCollections)
router.post('/dashboard/collections', requireAuth, collectionsController.pinDashboardCollection)
router.delete('/dashboard/collections/:collectionId', requireAuth, collectionsController.unpinDashboardCollection)
router.get('/collections', requireAuth, collectionsController.listCollections)
router.post('/collections', requireAuth, collectionsController.createCollection)
router.get('/collections/:id', requireAuth, collectionsController.getCollection)
router.patch('/collections/:id', requireAuth, collectionsController.updateCollection)
router.delete('/collections/:id', requireAuth, collectionsController.deleteCollection)
router.get('/collections/:id/sentences', requireAuth, collectionsController.listSentences)
router.post('/collections/:id/sentences', requireAuth, collectionsController.createSentence)
router.patch('/collections/:id/sentences/:sentenceId', requireAuth, collectionsController.updateSentence)

export default router
