module.exports = (order) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #000;">OOPS Fashion</h2>
  <h3>Your Order Has Shipped!</h3>
  <p>Hi ${order.shipping.fullName},</p>
  <p>Great news! Your order <strong>${order.orderId}</strong> has been shipped.</p>
  <p>It will be delivered to:</p>
  <p style="background: #f4f4f4; padding: 12px; border-radius: 6px;">
    ${order.shipping.address1}${order.shipping.address2 ? ', ' + order.shipping.address2 : ''}<br>
    ${order.shipping.city}${order.shipping.state ? ', ' + order.shipping.state : ''} - ${order.shipping.pincode}
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Thank you for shopping with OOPS!</p>
</body>
</html>`;
