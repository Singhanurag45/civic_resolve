import https from "https";

interface SendOtpEmailArgs {
  otp: string;
  recipientEmail: string;
  recipientName: string;
}

interface SendTransactionalEmailArgs {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  htmlContent: string;
}

const brevoRequest = (body: string) =>
  new Promise<void>((resolve, reject) => {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      reject(new Error("BREVO_API_KEY is not configured"));
      return;
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!senderEmail) {
      reject(new Error("BREVO_SENDER_EMAIL is not configured"));
      return;
    }

    const request = https.request(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "api-key": apiKey,
          Accept: "application/json",
        },
      },
      (response) => {
        let responseBody = "";

        response.on("data", (chunk) => {
          responseBody += chunk;
        });

        response.on("end", () => {
          if (
            response.statusCode &&
            response.statusCode >= 200 &&
            response.statusCode < 300
          ) {
            resolve();
            return;
          }

          reject(
            new Error(
              `Brevo email request failed with status ${response.statusCode}: ${responseBody}`
            )
          );
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });

export const sendTransactionalEmail = async ({
  recipientEmail,
  recipientName,
  subject,
  htmlContent,
}: SendTransactionalEmailArgs) => {
  const senderEmail = process.env.BREVO_SENDER_EMAIL!;
  const senderName = process.env.BREVO_SENDER_NAME || "CivicResolve";

  const payload = JSON.stringify({
    sender: {
      email: senderEmail,
      name: senderName,
    },
    to: [
      {
        email: recipientEmail,
        name: recipientName,
      },
    ],
    subject,
    htmlContent,
  });

  await brevoRequest(payload);
};

export const sendCitizenSignupOtpEmail = async ({
  otp,
  recipientEmail,
  recipientName,
}: SendOtpEmailArgs) => {
  const otpExpiryMinutes = Number(
    process.env.CITIZEN_SIGNUP_OTP_EXPIRY_MINUTES || "10"
  );

  await sendTransactionalEmail({
    recipientEmail,
    recipientName,
    subject: "Your CivicResolve signup OTP",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Verify your email</h2>
        <p>Hello ${recipientName},</p>
        <p>Your CivicResolve one-time password is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otp}</p>
        <p>This OTP expires in ${otpExpiryMinutes} minutes.</p>
        <p>If you did not request this signup, you can safely ignore this email.</p>
      </div>
    `,
  });
};

export const sendCitizenWelcomeEmail = async ({
  recipientEmail,
  recipientName,
}: Omit<SendOtpEmailArgs, "otp">) => {
  await sendTransactionalEmail({
    recipientEmail,
    recipientName,
    subject: "Welcome to CivicResolve",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Registration successful</h2>
        <p>Hello ${recipientName},</p>
        <p>Your CivicResolve account has been created successfully.</p>
        <p>You can now sign in and start reporting civic issues in your area.</p>
        <p>Thanks for helping build a better community.</p>
      </div>
    `,
  });
};

interface SendIssueSubmissionEmailArgs {
  recipientEmail: string;
  recipientName: string;
  issueId: string;
  title: string;
  department: string;
  status: string;
  address?: string;
}

export const sendIssueSubmissionSuccessEmail = async ({
  recipientEmail,
  recipientName,
  issueId,
  title,
  department,
  status,
  address,
}: SendIssueSubmissionEmailArgs) => {
  await sendTransactionalEmail({
    recipientEmail,
    recipientName,
    subject: `Issue submitted successfully: ${issueId}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Issue submitted successfully</h2>
        <p>Hello ${recipientName},</p>
        <p>Your issue has been recorded in CivicResolve.</p>
        <p><strong>Issue ID:</strong> ${issueId}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Status:</strong> ${status}</p>
        ${
          address
            ? `<p><strong>Location:</strong> ${address}</p>`
            : ""
        }
        <p>We will keep working on it through the platform.</p>
      </div>
    `,
  });
};
