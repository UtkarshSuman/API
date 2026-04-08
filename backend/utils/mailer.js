import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendCommentEmail = async ({ to, name, content, comment }) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject: "New Comment on Your Joke 😂",
      html: `
        <h3>Hey ${name}!</h3>
        <p>Someone commented on your joke:</p>
        <blockquote>${content}</blockquote>
        <p><b>Comment:</b> ${comment}</p>
      `,
    });

    console.log("Email sent via Resend");
  } catch (err) {
    console.error("Resend error:", err);
  }
};