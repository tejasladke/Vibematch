import { Message } from '../models/Message.js';
import { Connection } from '../models/Connection.js';
import { Notification } from '../models/Notification.js';

export const getMessages = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = await Connection.findById(connectionId);

    if (!connection || !connection.users.includes(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this conversation' });
    }

    const messages = await Message.find({ connection: connectionId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: messages.map((m) => ({
        id: m._id,
        connectionId: m.connection,
        senderId: m.sender._id,
        sender: m.sender,
        receiverId: m.receiver,
        content: m.content,
        imageUrl: m.imageUrl,
        isRead: m.isRead,
        readAt: m.readAt,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { content, imageUrl } = req.body;

    const connection = await Connection.findById(connectionId);
    if (!connection || !connection.users.includes(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Unauthorized to send message in this connection' });
    }

    if (connection.status === 'blocked') {
      return res.status(403).json({ success: false, error: 'Cannot send message in blocked connection' });
    }

    const receiverId = connection.users.find((u) => u.toString() !== req.user._id.toString());

    const message = await Message.create({
      connection: connectionId,
      sender: req.user._id,
      receiver: receiverId,
      content,
      imageUrl,
    });

    connection.lastMessageAt = new Date();
    await connection.save();

    await Notification.create({
      recipient: receiverId,
      sender: req.user._id,
      type: 'new_message',
      title: `Message from ${req.user.name}`,
      message: content || '📷 Sent an image',
      data: { connectionId, senderId: req.user._id },
    });

    res.status(201).json({
      success: true,
      data: {
        id: message._id,
        connectionId: message.connection,
        senderId: req.user._id,
        receiverId,
        content: message.content,
        imageUrl: message.imageUrl,
        isRead: false,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { connectionId } = req.params;
    await Message.updateMany(
      { connection: connectionId, receiver: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
