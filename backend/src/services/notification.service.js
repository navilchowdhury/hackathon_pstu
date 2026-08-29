const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');

async function createNotification({ userId, type, message, metadata = {}, session = null }) {
  const docs = [{ user: userId, type, message, metadata }];
  const options = session ? { session } : {};
  const [notification] = await Notification.create(docs, options);
  return notification;
}

async function listNotifications(userId, { unreadOnly = false } = {}) {
  const filter = { user: userId };
  if (unreadOnly) filter.read = false;

  return Notification.find(filter).sort({ createdAt: -1 }).limit(50);
}

async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  return notification;
}

async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
}

async function unreadCount(userId) {
  return Notification.countDocuments({ user: userId, read: false });
}

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
  markAllRead,
  unreadCount,
};
