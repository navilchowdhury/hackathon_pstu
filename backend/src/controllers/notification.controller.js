const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const [items, unread] = await Promise.all([
    notificationService.listNotifications(req.user._id),
    notificationService.unreadCount(req.user._id),
  ]);
  res.json({ success: true, data: { items, unread } });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user._id, req.params.id);
  res.json({ success: true, data: { notification } });
});

const markAll = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { list, markRead, markAll };
