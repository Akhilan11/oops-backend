module.exports = (order) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #000;">OOPS Fashion</h2>
  <h3>Order Delivered!</h3>
  <p>Hi ${order.shipping.fullName},</p>
  <p>Your order <strong>${order.orderId}</strong> has been delivered successfully.</p>
  <p>We hope you love your purchase!</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Thank you for shopping with OOPS!</p>
</body>
</html>`;
