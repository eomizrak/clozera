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

async function selectLanguagePair(req, res, next) {
  try {
    const result = await languagesService.selectLanguagePair(req.user.id, req.body.languagePairSlug)

    if (!result) {
      return res.status(404).json({
        error: {
          code: 'LANGUAGE_PAIR_NOT_FOUND',
          message: 'Language pair not found.',
          details: [],
        },
      })
    }

    return res.json({
      data: {
        id: result.user.id,
        selectedLanguagePair: result.pair,
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listLanguages,
  listLanguagePairs,
  selectLanguagePair,
}
