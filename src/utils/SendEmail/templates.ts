export const emailTemplateGeneric = (verificationCode: number) => {
  return `<h2>Hi there,</h2>
    ${`<h4>Thank you for using our service. Please use the following code.</h4>`}
    <h1>${verificationCode}</h1>
    <p>If you did not request this, please ignore this email. This Code will expire in 10 minutes</p>
    `;
};

export const emailTemplatePremiumAccess = (
  email: string,
  password: string,
  trialWeeks: number,
) => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f5f7fb; padding:30px;">
    
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:30px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.08);">
      
      <h2 style="color:#2c3e50;">Welcome to Doctor Speech 🎉</h2>
      
      <p style="font-size:15px; color:#555;">
        We're excited to give you access to <b>Doctor Speech Premium</b> so you can explore and test all the features of our app.
      </p>

      <p style="font-size:15px; color:#555;">
        Your <b>Premium trial</b> is activated for <b>${trialWeeks} weeks</b>.
      </p>

      <div style="background:#f1f5ff; padding:15px; border-radius:8px; margin:20px 0;">
        <p style="margin:5px 0;"><b>Email:</b> ${email}</p>
        <p style="margin:5px 0;"><b>Password:</b> ${password}</p>
      </div>

      <p style="font-size:15px; color:#555;">
        Use these credentials to log in and start exploring the app.
      </p>

      <h3 style="margin-top:30px; color:#2c3e50;">Download the App</h3>

      <div style="margin-top:15px;">
        <a href="https://play.google.com/store/apps/details?id=com.doctorspeech.doctorspeech" 
           style="display:inline-block; margin-right:10px; text-decoration:none;">
           <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
           width="160"/>
        </a>

        <a href="https://apps.apple.com/app/id6752412124" 
           style="display:inline-block; text-decoration:none;">
           <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
           width="140"/>
        </a>
      </div>

      <p style="margin-top:25px; font-size:14px; color:#777;">
        If you have any questions or feedback while testing Doctor Speech, feel free to reach out.  
        We would love to hear your thoughts.
      </p>

      <p style="margin-top:20px; font-size:14px; color:#777;">
        Best Regards,<br/>
        <b>Doctor Speech Team</b>
      </p>

    </div>

  </div>
  `;
};

export const purchasedTemplate = (name: string) => {
  return `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2c7be5;">New Subscription Purchased</h2>
      <p style="font-size: 16px;">
        <strong>${name}</strong> has just purchased a subscription.
      </p>
    </div>`;
};
