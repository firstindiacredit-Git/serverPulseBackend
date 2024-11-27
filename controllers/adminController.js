const User = require('../models/User');

exports.createAdmin = async (req, res) => {
    try {
        const { email, password, secretKey } = req.body;

        // Verify secret key
        if (secretKey !== process.env.ADMIN_SECRET_KEY) {
            return res.status(401).json({ message: 'Invalid secret key' });
        }

        // Check if admin already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create new admin user
        const user = new User({ 
            email, 
            role: 'admin'
        });
        user.setPassword(password);
        await user.save();

        res.status(201).json({ 
            message: 'Admin created successfully',
            credentials: {
                email,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Admin creation error:', error);
        res.status(500).json({ message: 'Error creating admin', error: error.message });
    }
};
