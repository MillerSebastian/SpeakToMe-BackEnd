import nodemailer from "nodemailer";
import { config } from "@/config";

// Configuración del transporter de email
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465, // true para 465, false para otros puertos
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

// Interfaz para opciones de email
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Función para enviar email
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"SpeakToMe - Universidad RIWI" <${config.email.user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado exitosamente:", result.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    return false;
  }
};

// Función para enviar email de bienvenida
export const sendWelcomeEmail = async (
  email: string,
  firstName: string,
  role: string
): Promise<boolean> => {
  const subject = "¡Bienvenido a SpeakToMe!";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">¡Hola ${firstName}!</h2>
      <p>Te damos la bienvenida a <strong>SpeakToMe</strong>, la plataforma de salud mental de la Universidad RIWI.</p>
      
      <p>Tu cuenta ha sido creada exitosamente como <strong>${role}</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">¿Qué puedes hacer ahora?</h3>
        <ul>
          <li>Completar tu perfil profesional</li>
          <li>Explorar las funcionalidades disponibles</li>
          <li>Contactar con el equipo de soporte si necesitas ayuda</li>
        </ul>
      </div>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      
      <p>Saludos cordiales,<br>
      <strong>Equipo SpeakToMe</strong><br>
      Universidad RIWI</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

// Función para enviar email de confirmación de cita
export const sendAppointmentConfirmationEmail = async (
  email: string,
  firstName: string,
  appointmentDate: string,
  appointmentTime: string,
  psychologistName?: string
): Promise<boolean> => {
  const subject = "Confirmación de Cita - SpeakToMe";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">¡Cita Confirmada!</h2>
      <p>Hola ${firstName},</p>
      
      <p>Tu cita ha sido confirmada exitosamente.</p>
      
      <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">Detalles de la Cita</h3>
        <p><strong>Fecha:</strong> ${appointmentDate}</p>
        <p><strong>Hora:</strong> ${appointmentTime}</p>
        ${
          psychologistName
            ? `<p><strong>Psicólogo:</strong> ${psychologistName}</p>`
            : ""
        }
      </div>
      
      <p>Recuerda:</p>
      <ul>
        <li>Llegar 10 minutos antes de la cita</li>
        <li>Traer identificación</li>
        <li>Si necesitas cancelar, hazlo con al menos 24 horas de anticipación</li>
      </ul>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      
      <p>Saludos cordiales,<br>
      <strong>Equipo SpeakToMe</strong><br>
      Universidad RIWI</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

// Función para enviar email de cancelación de cita
export const sendAppointmentCancellationEmail = async (
  email: string,
  firstName: string,
  appointmentDate: string,
  appointmentTime: string,
  reason?: string
): Promise<boolean> => {
  const subject = "Cita Cancelada - SpeakToMe";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">Cita Cancelada</h2>
      <p>Hola ${firstName},</p>
      
      <p>Tu cita ha sido cancelada.</p>
      
      <div style="background-color: #fdf2f2; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #e74c3c; margin-top: 0;">Detalles de la Cita Cancelada</h3>
        <p><strong>Fecha:</strong> ${appointmentDate}</p>
        <p><strong>Hora:</strong> ${appointmentTime}</p>
        ${reason ? `<p><strong>Razón:</strong> ${reason}</p>` : ""}
      </div>
      
      <p>Si necesitas reagendar tu cita, puedes hacerlo a través de la plataforma.</p>
      
      <p>Saludos cordiales,<br>
      <strong>Equipo SpeakToMe</strong><br>
      Universidad RIWI</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

// Función para enviar email de recordatorio de cita
export const sendAppointmentReminderEmail = async (
  email: string,
  firstName: string,
  appointmentDate: string,
  appointmentTime: string,
  psychologistName?: string
): Promise<boolean> => {
  const subject = "Recordatorio de Cita - SpeakToMe";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3498db;">Recordatorio de Cita</h2>
      <p>Hola ${firstName},</p>
      
      <p>Te recordamos que tienes una cita programada.</p>
      
      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">Detalles de la Cita</h3>
        <p><strong>Fecha:</strong> ${appointmentDate}</p>
        <p><strong>Hora:</strong> ${appointmentTime}</p>
        ${
          psychologistName
            ? `<p><strong>Psicólogo:</strong> ${psychologistName}</p>`
            : ""
        }
      </div>
      
      <p>Recuerda:</p>
      <ul>
        <li>Llegar 10 minutos antes de la cita</li>
        <li>Traer identificación</li>
        <li>Si necesitas cancelar, hazlo con al menos 24 horas de anticipación</li>
      </ul>
      
      <p>Saludos cordiales,<br>
      <strong>Equipo SpeakToMe</strong><br>
      Universidad RIWI</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

// Función para enviar email de notificación
export const sendNotificationEmail = async (
  email: string,
  firstName: string,
  title: string,
  message: string
): Promise<boolean> => {
  const subject = `Notificación - ${title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">${title}</h2>
      <p>Hola ${firstName},</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p>${message}</p>
      </div>
      
      <p>Saludos cordiales,<br>
      <strong>Equipo SpeakToMe</strong><br>
      Universidad RIWI</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

// Función para verificar la configuración de email
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Configuración de email verificada correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error en la configuración de email:", error);
    return false;
  }
};
