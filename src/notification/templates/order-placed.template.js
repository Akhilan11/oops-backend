module.exports = (order) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #000;">OOPS Fashion</h2>
  <h3>Order Confirmed!</h3>
  <p>Hi ${order.shipping.fullName},</p>
  <p>Your order <strong>${order.orderId}</strong> has been placed successfully.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr style="background: #f4f4f4;">
      <th style="padding: 8px; text-align: left;">Item</th>
      <th style="padding: 8px; text-align: center;">Size</th>
      <th style="padding: 8px; text-align: center;">Qty</th>
      <th style="padding: 8px; text-align: right;">Price</th>
    </tr>
    ${order.items.map(item => `
    <tr>
      <td style="padding: 8px;">${item.name}</td>
      <td style="padding: 8px; text-align: center;">${item.size}</td>
      <td style="padding: 8px; text-align: center;">${item.qty}</td>
      <td style="padding: 8px; text-align: right;">₹${item.price * item.qty}</td>
    </tr>`).join('')}
  </table>
  <p><strong>Subtotal:</strong> ₹${order.subtotal}</p>
  ${order.codFee > 0 ? `<p><strong>COD Fee:</strong> ₹${order.codFee}</p>` : ''}
  <p style="font-size: 18px;"><strong>Total: ₹${order.total}</strong></p>
  <p><strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Thank you for shopping with OOPS!</p>
</body>
</html>`;
