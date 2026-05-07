const collectionsService = require('../services/collections-service')

async function listCollections(req, res, next) {
  try {
    const result = await collectionsService.listCollections({
      languagePair: req.query.languagePair,
      owner: req.query.owner,
      page: req.query.page,
      perPage: req.query.perPage,
      user: req.user,
    })

    res.json({
      data: {
        collections: result.collections,
      },
      meta: result.meta,
    })
  } catch (error) {
    next(error)
  }
}

async function createCollection(req, res, next) {
  try {
    res.status(201).json({ data: await collectionsService.createCollection(req.body, req.user) })
  } catch (error) {
    next(error)
  }
}

async function getCollection(req, res, next) {
  try {
    res.json({ data: await collectionsService.getCollection(req.params.id, req.user) })
  } catch (error) {
    next(error)
  }
}

async function createSentence(req, res, next) {
  try {
    res.status(201).json({ data: await collectionsService.createSentence(req.params.id, req.body, req.user) })
  } catch (error) {
    next(error)
  }
}

async function listSentences(req, res, next) {
  try {
    const result = await collectionsService.listSentences({
      collectionId: req.params.id,
      query: req.query.query,
      context: req.query.context,
      page: req.query.page,
      perPage: req.query.perPage,
      user: req.user,
    })

    return res.json({
      data: {
        sentences: result.sentences,
      },
      meta: result.meta,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createCollection,
  createSentence,
  listCollections,
  getCollection,
  listSentences,
}
