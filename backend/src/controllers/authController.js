import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'planmate_super_secret_jwt_key_2025_genz',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

export const register = async (req, res) => {
  try {
    const {
      name,
      phone,
      password,
      age,
      bio,
      interests,
      location,
      socialLinks,
      avatar,
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, phone, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const userExists = await User.findOne({ phone: cleanPhone });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is already registered.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      phone: cleanPhone,
      password: hashedPassword,
      avatar:
        avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      age: age ? parseInt(age, 10) : 21,
      bio: bio || 'Excited to plan spontaneous activities! ⚡',
      interests: interests || ['Café', 'Movie', 'Food'],
      location: location || 'Bengaluru, India',
      socialLinks: socialLinks || {},
    });

    const safeUser = {
      id: user._id,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      age: user.age,
      bio: user.bio,
      interests: user.interests,
      location: user.location,
      socialLinks: user.socialLinks,
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to PlanMate.',
      token: generateToken(user._id),
      user: safeUser,
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed.',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and password are required.',
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        error:
          'No account found with this phone number. Please register first.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please try again.',
      });
    }

    // Direct login: no OTP, SMS, WhatsApp, or verification service.
    const safeUser = {
      id: user._id,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      age: user.age,
      bio: user.bio,
      interests: user.interests,
      location: user.location,
      socialLinks: user.socialLinks,
    };

    return res.json({
      success: true,
      message: 'Login successful! Welcome back.',
      token: generateToken(user._id),
      user: safeUser,
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Login failed.',
    });
  }
};
