module.exports = (otp, purposeLabel) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #000;">OOPS Fashion</h2>
  <p>Your OTP for <strong>${purposeLabel}</strong> is:</p>
  <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
    <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #000;">${otp}</span>
  </div>
  <p style="color: #666; font-size: 14px;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
</body>
</html>`;
