import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'madebyalgerians@gmail.com';
const fromEmail = process.env.SMTP_FROM || 'noreply@madebyalgerians.com';

export async function sendNewOrderNotification(order: {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  total: string;
}) {
  try {
    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      subject: `Nouvelle commande #${order.id} - ${order.customerName}`,
      html: `
        <h2>Nouvelle commande reçue</h2>
        <p><strong>Commande #${order.id}</strong></p>
        <ul>
          <li><strong>Client :</strong> ${order.customerName}</li>
          <li><strong>Email :</strong> ${order.email}</li>
          <li><strong>Téléphone :</strong> ${order.phone}</li>
          <li><strong>Total :</strong> ${order.total} DZD</li>
        </ul>
        <p>Connectez-vous au panneau d'administration pour traiter cette commande.</p>
      `,
    });
  } catch (err) {
    console.error('Email notification error:', err);
  }
}
