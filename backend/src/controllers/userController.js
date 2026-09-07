import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Plan } from '../models/Plan.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const createdPlans = await Plan.find({ creator: user._id, status: { $ne: 'cancelled' } });
    const joinedPlans = await Plan.find({ members: user._id, creator: { $ne: user._id } });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
          age: user.age,
          bio: user.bio,
          interests: user.interests,
          location: user.location,
          socialLinks: user.socialLinks,
          createdAt: user.createdAt,
        },
        createdPlans,
        joinedPlans,
        stats: {
          createdCount: createdPlans.length,
          joinedCount: joinedPlans.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const { name, avatar, age, bio, interests, location, socialLinks } = req.body;
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (age) user.age = age;
    if (bio !== undefined) user.bio = bio;
    if (interests) user.interests = interests;
    if (location) user.location = location;
    if (socialLinks) user.socialLinks = socialLinks;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        age: user.age,
        bio: user.bio,
        interests: user.interests,
        location: user.location,
        socialLinks: user.socialLinks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...req.body.preferences,
    };
    await user.save();

    res.json({ success: true, data: user.notificationPreferences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
