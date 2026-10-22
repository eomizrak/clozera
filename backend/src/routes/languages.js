import express from 'express'
import * as languagesController from '../controllers/languages-controller.js'

const router = express.Router()

router.get('/languages', languagesController.listLanguages)
router.get('/language-pairs', languagesController.listLanguagePairs)

export default router
