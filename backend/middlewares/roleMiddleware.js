const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: rol no autorizado' });
    }
    next();
  };
};

module.exports = allowRoles;
