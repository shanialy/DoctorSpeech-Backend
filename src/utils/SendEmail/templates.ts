export const emailTemplateGeneric = (
  verificationCode: number,
  reason: string
) => {
  return `<h2>Hi there,</h2>
    ${
      reason === "registration"
        ? `<h4>Thank you for registering with us. Please use the following code to verify your account.</h4>`
        : `<h4>Thank you for using our service. Please use the following code to reset your password.</h4>`
    }
    <h1>${verificationCode}</h1>
    <p>If you did not request this, please ignore this email. This Code will expire in 10 minutes</p>
    `;
};

export const invitePartnerTemplate = (
  name: string,
  verificationCode: number
) => {
  return `<h2>Hi there,</h2>
    ${`<h4>${name} wants to add you as partner. Please use the below code</h4>`}
    <h1>${verificationCode}</h1>
    `;
};
