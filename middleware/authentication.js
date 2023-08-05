const { isTokenValid } = require("../utils");
const { UnauthenticatedError, UnauthorizedError } = require("../errors");

const authenticateUser = async (req, res, next) => {
    const token = req.signedCookies.token;

    if (!token) throw new UnauthenticatedError("Authentication invalid");

    try {
        const { name, userId, role } = isTokenValid({ token });
        req.user = { name, role, userId };
        next();
    } catch (error) {
        throw new UnauthenticatedError("Authentication invalid");
    }
};

const authorizePermissions = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role))
            throw new UnauthorizedError("Access to route is forbidden");

        next();
    };
};

module.exports = { authenticateUser, authorizePermissions };
