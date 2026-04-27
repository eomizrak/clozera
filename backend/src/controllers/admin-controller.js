const adminService = require('../services/admin-service')

async function importLanguages(req, res, next) {
  try {
    res.status(201).json({ data: await adminService.importLanguages(req.body.languages || []) })
  } catch (error) {
    next(error)
  }
}

async function importLanguagePairs(req, res, next) {
  try {
    res.status(201).json({ data: await adminService.importLanguagePairs(req.body.languagePairs || []) })
  } catch (error) {
    next(error)
  }
}

async function importCollections(req, res, next) {
  try {
    const result = await adminService.importCollections({
      ...req.body,
      ownerId: req.user.id,
    })

    if (!result) {
      return res.status(404).json({ error: { code: 'NOT_FOUND' } })
    }

    res.status(201).json({ data: result })
  } catch (error) {
    next(error)
  }
}

async function importCollectionSentences(req, res, next) {
  try {
    const sentences = await adminService.importCollectionSentences(req.params.id, req.body.sentences || [], req.user.id)
    res.status(201).json({ data: sentences })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  importLanguages,
  importLanguagePairs,
  importCollections,
  importCollectionSentences,
}
