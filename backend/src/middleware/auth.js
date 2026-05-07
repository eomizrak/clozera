function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next()
  }

  return res.status(401).json({
    error: {
      code: 'UNAUTHENTICATED',
      message: 'Authentication is required.',
      details: [],
    },
  })
}

function requireAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required.',
        details: [],
      },
    })
  }

  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin privileges are required.',
        details: [],
      },
    })
  }

  return next()
}

module.exports = {
  requireAuth,
  requireAdmin,
}
