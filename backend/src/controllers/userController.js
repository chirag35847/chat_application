import { userService } from '../services/userService.js';

export const userController = {
    async register(req, res) {
        try {
            const { email, username, password } = req.body;
            if (!email || !username || !password) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: "either of email, username or password was not provided"
                });
            }

            const user = await userService.registerUser({ email, username, password });
            res.status(200).json({ success: true, data: user, error: null });
        } catch (error) {
            res.status(500).json({ success: false, data: null, error: error.message });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).send({
                    success: false,
                    data: null,
                    error: "email and password are required"
                });
            }

            const data = await userService.loginUser({ email, password });
            res.status(200).send({ success: true, data });
        } catch (error) {
            const status = error.message.includes('not find') ? 404 : (error.message.includes('incorrect') ? 401 : 500);
            res.status(status).send({ success: false, data: null, error: error.message });
        }
    },

    async generateRefreshToken(req, res) {
        try {
            const refreshToken = req.headers['refreshToken'];
            if (!refreshToken) {
                res.status(400).send({ success: false, data: null, error: "refresh token not provided" });
            }
            const tokenResponse = await userService.generateRefreshToken({ refreshToken })
            if (tokenResponse.success) {
                return res.status(200).send({
                    success: true, data: {
                        accessToken: tokenResponse.token
                    }, error: error.message
                });
            }
            return res.status(401).send({
                success: false, data: null, error: error.message
            });
        } catch (error) {
            res.status(500).send({ success: false, data: null, error: error.message });
        }
    },

    async logout(req,res) {
        try {
            const response = await userService.logout(req.user.userId)
            res.status(200).send({ success: true, data: null, error: null });
        } catch (error) {
            res.status(500).send({ success: false, data: null, error: error.message });
        }
    },

    async search(req, res) {
        try {
            const { email, username } = req.query;
            if (!email && !username) {
                return res.status(400).send({
                    success: false,
                    data: null,
                    error: "search parameters are required"
                });
            }

            const users = await userService.searchUsers({ email, username }, req.user.userId);
            res.status(200).send({ success: true, data: users, error: null });
        } catch (error) {
            res.status(500).send({ success: false, data: null, error: error.message });
        }
    },

    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).send({
                    success: false,
                    data: null,
                    error: "refresh token is required"
                });
            }

            const data = await userService.refreshAccessToken(refreshToken);
            res.status(200).send({ success: true, data });
        } catch (error) {
            res.status(401).send({
                success: false,
                data: null,
                error: error.message
            });
        }
    },

    async logout(req, res) {
        try {
            await userService.logout(req.user.userId);
            res.status(200).send({ success: true, message: "Logged out successfully" });
        } catch (error) {
            res.status(500).send({ success: false, data: null, error: error.message });
        }
    }
};


