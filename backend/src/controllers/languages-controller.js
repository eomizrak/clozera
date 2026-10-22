import * as languagesService from '../services/languages-service.js'

async function listLanguages(req, res, next) {
  try {
    res.json({ data: await languagesService.listLanguages() })
  } catch (error) {
    next(error)
  }
}

async function listLanguagePairs(req, res, next) {
  try {
    res.json({ data: await languagesService.listLanguagePairs() })
  } catch (error) {
    next(error)
  }
}

export { listLanguages, listLanguagePairs }
