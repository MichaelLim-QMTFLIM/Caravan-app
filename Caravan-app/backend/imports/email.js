const nodemailer = require("nodemailer");

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Order email is not configured on the server");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

async function sendOrderConfirmation({
  customerEmail,
  customerName,
  orderId,
  items,
  productCost,
  discount,
  shippingName,
  shippingFee,
  totalCost,
}) {
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHTML(item.productName)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHTML(item.productSize)} oz</td>
      <td style="padding:8px;border-bottom:1px solid #ddd">${Number(item.quantity)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd">₱${Number(item.unitPrice).toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd">₱${Number(item.unitPrice * item.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Caravan" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: `Caravan Order Confirmation #${orderId}`,
    html: `
      <div style="max-width:650px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#333">
        <h2 style="color:#6F4E37">Order Confirmed</h2>
        <p>Hello ${escapeHTML(customerName || "Customer")},</p>
        <p>Your order has been placed successfully.</p>
        <p><strong>Order number:</strong> #${escapeHTML(orderId)}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:20px">
          <thead><tr style="background:#F4EDE5">
            <th style="padding:8px;text-align:left">Product</th>
            <th style="padding:8px;text-align:left">Size</th>
            <th style="padding:8px;text-align:left">Quantity</th>
            <th style="padding:8px;text-align:left">Unit Price</th>
            <th style="padding:8px;text-align:left">Subtotal</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="margin-top:24px;text-align:right;line-height:1.8">
          <div>Products: ₱${Number(productCost).toFixed(2)}</div>
          <div>Shipping (${escapeHTML(shippingName)}): ₱${Number(shippingFee).toFixed(2)}</div>
          <div>Discount: -₱${Number(discount).toFixed(2)}</div>
          <div style="font-size:18px;font-weight:bold;color:#6F4E37">Total: ₱${Number(totalCost).toFixed(2)}</div>
        </div>
        <p style="margin-top:30px;color:#777;font-size:13px">Thank you for shopping with Caravan.</p>
      </div>
    `,
  });
}

function escapeHTML(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

module.exports = { sendOrderConfirmation };
