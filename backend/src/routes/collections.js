const express = require('express')
const collectionsController = require('../controllers/collections-controller')
const { requireAuth } = require('../middleware/auth')

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

module.exports = router
