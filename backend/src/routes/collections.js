const express = require('express')
const collectionsController = require('../controllers/collections-controller')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/users/me/collections', requireAuth, collectionsController.listMyCollections)
router.get('/language-pairs/:slug/collections', requireAuth, collectionsController.listCollections)
router.post('/collections', requireAuth, collectionsController.createCollection)
router.get('/collections/:id', requireAuth, collectionsController.getCollection)
router.get('/collections/:id/sentences', requireAuth, collectionsController.listSentences)
router.post('/collections/:id/sentences', requireAuth, collectionsController.createSentence)

module.exports = router
