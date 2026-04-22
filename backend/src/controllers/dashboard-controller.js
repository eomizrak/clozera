const dashboardService = require('../services/dashboard-service')

async function getDashboard(req, res, next) {
  try {
    return res.json({ data: await dashboardService.getDashboard(req.user, req.params.slug) })
  } catch (error) {
    next(error)
  }
}

async function getMyDashboard(req, res, next) {
  try {
    return res.json({ data: await dashboardService.getMyDashboard(req.user) })
  } catch (error) {
    next(error)
  }
}

module.exports = { getDashboard, getMyDashboard }
