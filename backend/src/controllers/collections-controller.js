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

async function updateCollection(req, res, next) {
  try {
    res.json({ data: await collectionsService.updateCollection(req.params.id, req.body, req.user) })
  } catch (error) {
    next(error)
  }
}

async function deleteCollection(req, res, next) {
  try {
    await collectionsService.deleteCollection(req.params.id, req.user)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

async function listDashboardCollections(req, res, next) {
  try {
    const result = await collectionsService.listDashboardCollections({
      languagePair: req.query.languagePair,
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

async function pinDashboardCollection(req, res, next) {
  try {
    res.json({ data: await collectionsService.pinDashboardCollection(req.body.collectionId, req.user) })
  } catch (error) {
    next(error)
  }
}

async function unpinDashboardCollection(req, res, next) {
  try {
    const collection = await collectionsService.unpinDashboardCollection(req.params.collectionId, req.user)

    if (!collection) {
      res.status(204).send()
      return
    }

    res.json({ data: collection })
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

async function updateSentence(req, res, next) {
  try {
    res.json({
      data: await collectionsService.updateSentence(req.params.id, req.params.sentenceId, req.body, req.user),
    })
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
  deleteCollection,
  listDashboardCollections,
  pinDashboardCollection,
  unpinDashboardCollection,
  updateCollection,
  updateSentence,
  listCollections,
  getCollection,
  listSentences,
}
