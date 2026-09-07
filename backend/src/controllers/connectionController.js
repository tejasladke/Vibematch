import { Connection } from '../models/Connection.js';
import { Message } from '../models/Message.js';

export const getMyConnections = async (req, res) => {
  try {
    const connections = await Connection.find({ users: req.user._id })
      .populate('users', 'name avatar age location bio interests')
      .populate('plan', 'title category date time location image')
      .sort({ lastMessageAt: -1 });

    const formatted = await Promise.all(
      connections.map(async (c) => {
        const unreadCount = await Message.countDocuments({
          connection: c._id,
          receiver: req.user._id,
          isRead: false,
        });

        const lastMessage = await Message.findOne({ connection: c._id }).sort({ createdAt: -1 });

        return {
          id: c._id,
          users: c.users,
          userIds: c.users.map((u) => u._id),
          planId: c.plan ? c.plan._id : null,
          plan: c.plan,
          status: c.status,
          blockedBy: c.blockedBy,
          unreadCount,
          lastMessage,
          lastMessageAt: c.lastMessageAt,
          createdAt: c.createdAt,
        };
      })
    );

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getConnectionById = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id)
      .populate('users', 'name avatar age location bio interests')
      .populate('plan', 'title category date time location image');

    if (!connection) return res.status(404).json({ success: false, error: 'Connection not found' });

    if (!connection.users.some((u) => u._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this connection' });
    }

    res.json({ success: true, data: connection });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleBlockConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection || !connection.users.includes(req.user._id)) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    if (connection.status === 'blocked') {
      connection.status = 'active';
      connection.blockedBy = undefined;
    } else {
      connection.status = 'blocked';
      connection.blockedBy = req.user._id;
    }

    await connection.save();
    res.json({ success: true, data: connection });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
