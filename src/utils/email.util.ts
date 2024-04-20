import nodeMailer from "nodemailer";
export const sendEmail = async (
  email: string,
  subject: string,
  text: string
) => {
  try {
    const transporter = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions).then(() => {
      return { message: "Email sent successfully", otpSend: true };
    });
  } catch (error: any) {
  }
};
