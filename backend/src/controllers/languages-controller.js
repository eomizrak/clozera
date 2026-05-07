const languagesService = require('../services/languages-service')

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

module.exports = {
  listLanguages,
  listLanguagePairs,
}
