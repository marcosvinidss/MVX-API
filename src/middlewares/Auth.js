const User = require('../models/User');

module.exports = {
    private: async (req, res, next) => {
        try {
            const token = req.headers['authorization'] || req.query.token || req.body.token;

            if (!token) {
                return res.status(401).json({ message: 'Token not provided' });
            }

            const user = await User.findOne({ token });

            if (!user) {
                return res.status(401).json({ message: 'Unauthorized: Invalid token' });
            }

            req.user = user;

            next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};
