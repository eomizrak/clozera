const collectionsService = require('../services/collections-service')

async function listCollections(req, res, next) {
  try {
    res.json({ data: await collectionsService.listCollectionsBySlug(req.params.slug, req.user) })
  } catch (error) {
    next(error)
  }
}

async function listMyCollections(req, res, next) {
  try {
    res.json({ data: await collectionsService.listCollectionsForUser(req.user) })
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
  listCollections,
  listMyCollections,
  getCollection,
  listSentences,
}
