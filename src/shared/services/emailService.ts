import nodemailer from "nodemailer";
import { CreateEmailResponse, Resend } from "resend";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import config from "../config";
import logger from "../utils/logger";

// Initialize email provider based on config
const EMAIL_PROVIDER = config.email.provider;

// Initialize Resend if needed
const resend = new Resend(config.email.resendApiKey);

// Initialize nodemailer transport
const nodemailerTransport = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass,
  },
});

// Company and product branding info
const COMPANY_INFO = {
  name: "Jobready",
  email: config.email.from || "support@digitalagents.io",
  senderName: "Jobready",
  websiteUrl: "https://jobready.co",
  logo: {
    src: "https://placehold.co/600x150?text=Jobready",
    altText: "jobready.co",
    width: 150,
    height: 40,
  },
  colors: {
    primary: "#000000", // Black
    secondary: "#FFFFFF", // White
    accent: "#2563EB", // Vibrant blue accent
    backgroundPrimary: "#FFFFFF",
    backgroundSecondary: "#F9FAFB",
    textPrimary: "#111827",
    textSecondary: "#4B5563",
    border: "#E5E7EB",
  },
  socialLinks: {
    twitter: "https://twitter.com/digitalagents",
    linkedin: "https://www.linkedin.com/company/job-readyai",
    github: "https://github.com/digitalagents",
  },
};

/**
 * Interface for email data
 */
export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

/**
 * Interface for email template data
 */
export interface TemplateData {
  [key: string]: any;
}

/**
 * Register handlebars helpers for email templates
 */
const registerHandlebarsHelpers = (): void => {
  try {
    // Register helpers
    handlebars.registerHelper("formatDate", (date: Date | string): string => {
      if (!date) return "";

      try {
        const d = new Date(date);
        return d.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      } catch (e) {
        return String(date);
      }
    });

    handlebars.registerHelper("currentYear", (): number => {
      return new Date().getFullYear();
    });

    // Fix for the ifEquals helper - explicit this typing
    handlebars.registerHelper(
      "ifEquals",
      function (
        this: any,
        arg1: any,
        arg2: any,
        options: handlebars.HelperOptions
      ): string {
        return arg1 === arg2 ? options.fn(this) : options.inverse(this);
      }
    );
  } catch (error) {
    logger.warn("Unable to register Handlebars helpers:", error);
  }
};

// Call this at module initialization
registerHandlebarsHelpers();

/**
 * Get compiled email template
 * @param templateName - The name of the template to use
 * @param data - Data to be used in the template
 * @returns HTML string of the compiled template
 */
export const getEmailTemplate = (
  templateName: string,
  data: TemplateData
): string => {
  try {
    // Try multiple possible paths for the template
    const possiblePaths = [
      path.join(
        process.cwd(),
        "dist",
        "templates",
        "emails",
        `${templateName}.hbs`
      ),
      path.join(
        process.cwd(),
        "src",
        "templates",
        "emails",
        `${templateName}.hbs`
      ),
      path.join(
        __dirname,
        "..",
        "..",
        "templates",
        "emails",
        `${templateName}.hbs`
      ),
    ];

    let templateContent: string | null = null;
    let templatePath: string | null = null;

    // Try each path until we find the template
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          templateContent = fs.readFileSync(p, "utf-8");
          templatePath = p;
          break;
        }
      } catch (e) {
        logger.error(`Error loading email template ${templateName}:`, e);
        continue;
      }
    }

    if (!templateContent || !templatePath) {
      throw new Error(
        `Template ${templateName} not found in any of the possible locations`
      );
    }

    logger.debug(`Loading email template from: ${templatePath}`);

    // Enhance the template data with branding information
    const enhancedData = {
      ...data,
      // Replace appName or add product name if not present
      appName: "Jobready",
      productName: "Jobready",
      companyName: COMPANY_INFO.name,
      branding: COMPANY_INFO,
      year: new Date().getFullYear(),
    };

    console.log("templateContent: " + templateContent);

    const template = handlebars.compile(templateContent);
    return template(enhancedData);
  } catch (error) {
    logger.error(`Error loading email template ${templateName}:`, error);
    throw new Error(
      `Email template ${templateName} not found or could not be compiled`
    );
  }
};

/**
 * Send an email using the configured provider
 * @param emailData - The email data to send
 * @returns Promise resolving to success status
 */
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Use the branded sender name
    const formattedFrom = `${COMPANY_INFO.senderName} <${COMPANY_INFO.email}>`;
    const { to, subject, html, text, from = formattedFrom } = emailData;

    if (EMAIL_PROVIDER === "resend") {
      const response: CreateEmailResponse = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      });
      logger.debug("response: " + JSON.stringify(response));
      return !!response.data;
    } else {
      // Default to nodemailer
      const info = await nodemailerTransport.sendMail({
        from,
        to,
        subject,
        html,
        text,
      });
      logger.debug("info: " + JSON.stringify(info));
      return !!info.messageId;
    }
  } catch (error) {
    logger.error("Error sending email: " + error);
    return false;
  }
};

/**
 * Send a team invitation email
 * @param email - Recipient email
 * @param teamName - Name of the team
 * @param inviterName - Name of the person who sent the invite
 * @param inviteLink - Link to accept the invitation
 * @returns Promise resolving to success status
 */
export const sendTeamInviteEmail = async (
  email: string,
  teamName: string,
  inviterName: string,
  inviteLink: string
): Promise<boolean> => {
  try {
    const templateData = {
      teamName,
      inviterName,
      inviteLink,
      assignedDate: new Date(),
    };

    const html = getEmailTemplate("team-invite", templateData);

    return await sendEmail({
      to: email,
      subject: `Join ${teamName} on Jobready`,
      html,
    });
  } catch (error) {
    console.error("Error sending team invite email:", error);
    logger.error("Error sending team invite email:", error);
    return false;
  }
};

/**
 * Send a training assignment notification email
 * @param email - Recipient email
 * @param trainingName - Name of the training
 * @param trainingLink - Link to access the training
 * @returns Promise resolving to success status
 */
export const sendTrainingAssignmentEmail = async (
  email: string,
  trainingName: string,
  trainingLink: string
): Promise<boolean> => {
  try {
    const templateData = {
      trainingName,
      trainingLink,
      assignedDate: new Date(),
    };

    const html = getEmailTemplate("training-assignment", templateData);

    const sent = await sendEmail({
      to: email,
      subject: `New Training Assignment: ${trainingName}`,
      html,
    });
    if (!sent) {
      logger.error("Error sending training assignment email " + email);
    } else {
      logger.info("Training assignment email sent successfully " + email);
    }
    return sent;
  } catch (error) {
    console.error("Error sending training assignment email:", error);
    return false;
  }
};

/**
 * Send an evaluation assignment notification email
 * @param email - Recipient email
 * @param evaluationName - Name of the evaluation
 * @param evaluationLink - Link to access the evaluation
 * @returns Promise resolving to success status
 */
export const sendEvaluationAssignmentEmail = async (
  email: string,
  evaluationName: string,
  evaluationLink: string
): Promise<boolean> => {
  try {
    const templateData = {
      evaluationName,
      evaluationLink,
      assignedDate: new Date(),
    };

    const html = getEmailTemplate("evaluation-assignment", templateData); 

    const sent = await sendEmail({
      to: email,
      subject: `New Evaluation Assignment: ${evaluationName}`,
      html,
    });
    if (!sent) {
      logger.error("Error sending evaluation assignment email " + email);
    } else {
      logger.info("Evaluation assignment email sent successfully " + email);
    }
    return sent;
  } catch (error) {
    console.error("Error sending evaluation assignment email:", error);
    return false;
  }
};

/**
 * Send email verification email
 * @param email - Recipient email
 * @param userName - User's name
 * @param verificationLink - Link to verify email
 * @returns Promise resolving to success status
 */
export const sendEmailVerificationEmail = async (
  email: string,
  userName: string,
  verificationLink: string
): Promise<boolean> => {
  try {
    const templateData = {
      userName,
      verificationLink,
      expiryHours: 48, // Token validity in hours
    };

    const html = getEmailTemplate("email-verification", templateData);

    const sent = await sendEmail({
      to: email,
      subject: "Verify Your DigitialAgents account",
      html,
    });

    if (!sent) {
      logger.error(`Error sending email verification email to ${email}`);
    } else {
      logger.info(`Email verification sent successfully to ${email}`);
    }

    return sent;
  } catch (error) {
    logger.error(`Error sending email verification email: ${error}`);
    return false;
  }
};

/**
 * Send password reset email
 * @param email - Recipient email
 * @param userName - User's name
 * @param resetLink - Link to reset password
 * @returns Promise resolving to success status
 */
export const sendPasswordResetEmail = async (
  email: string,
  userName: string,
  resetLink: string
): Promise<boolean> => {
  try {
    const templateData = {
      userName,
      resetLink,
      expiryHours: 2, // Token validity in hours
    };

    const html = getEmailTemplate("password-reset", templateData);

    const sent = await sendEmail({
      to: email,
      subject: "Reset Your Jobready Password",
      html,
    });

    if (!sent) {
      logger.error(`Error sending password reset email to ${email}`);
    } else {
      logger.info(`Password reset email sent successfully to ${email}`);
    }

    return sent;
  } catch (error) {
    logger.error(`Error sending password reset email: ${error}`);
    return false;
  }
};

/**
 * Send temporary password email for new users
 * @param email - Recipient email
 * @param userName - User's name
 * @param temporaryPassword - Temporary password
 * @param loginLink - Link to login page
 * @returns Promise resolving to success status
 */
export const sendTemporaryPasswordEmail = async (
  email: string,
  userName: string,
  temporaryPassword: string,
  loginLink: string
): Promise<boolean> => {
  try {
    const templateData = {
      userName,
      temporaryPassword,
      loginLink,
    };

    const html = getEmailTemplate("temporary-password", templateData);

    const sent = await sendEmail({
      to: email,
      subject: "Your Temporary Jobready Password",
      html,
    });

    if (!sent) {
      logger.error(`Error sending temporary password email to ${email}`);
    } else {
      logger.info(`Temporary password email sent successfully to ${email}`);
    }

    return sent;
  } catch (error) {
    logger.error(`Error sending temporary password email: ${error}`);
    return false;
  }
};

/**
 * Send account lock notification email
 * @param email - Recipient email
 * @param userName - User's name
 * @param unlockTime - Time when account will be automatically unlocked
 * @returns Promise resolving to success status
 */
export const sendAccountLockEmail = async (
  email: string,
  userName: string,
  unlockTime: Date
): Promise<boolean> => {
  try {
    const formattedUnlockTime = unlockTime.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    const templateData = {
      userName,
      unlockTime: formattedUnlockTime,
    };

    const html = getEmailTemplate("account-locked", templateData);

    const sent = await sendEmail({
      to: email,
      subject: "Your Jobready account Has Been Locked",
      html,
    });

    if (!sent) {
      logger.error(`Error sending account lock email to ${email}`);
    } else {
      logger.info(`Account lock email sent successfully to ${email}`);
    }

    return sent;
  } catch (error) {
    logger.error(`Error sending account lock email: ${error}`);
    return false;
  }
};

/**
 * Send a training reminder email
 * @param email - Recipient email
 * @param userName - User's name
 * @param joinTrainingLink - Link to access the training
 * @returns Promise resolving to success status
 */
export const sendTrainingReminderEmail = async (
  trainingTitle: string,
  assignedDate: string,
  email: string,
  userName: string,
  joinTrainingLink: string
): Promise<boolean> => {
  try {
    // Format the date
    const formattedDate = new Date(assignedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const templateData = {
      trainingTitle,
      assignedDate: formattedDate,
      userName,
      joinTrainingLink,
      currentYear: new Date().getFullYear()
    }; 
    
    const html = getEmailTemplate("training-reminder", templateData);

    const sent = await sendEmail({
      to: email,
      subject: "Training Reminder",
      html,
    });

    if (!sent) {
      logger.error(`Error sending training reminder email to ${email}`);
    } else {
      logger.info(`Training reminder email sent successfully to ${email}`);
    }

    return sent;
  } catch (error) {
    logger.error(`Error sending training reminder email: ${error}`);
    return false;
  }
};

/**
 * Send magic link setup email for new users
 * @param email - Recipient email
 * @param userName - User's name
 * @param magicLink - Magic link to set up password
 * @returns Promise resolving to success status
 */
export const sendMagicLinkSetupEmail = async (
  email: string,
  userName: string,
  magicLink: string
): Promise<boolean> => {
  try {
    const templateData = {
      userName,
      magicLink,
    };

    const html = getEmailTemplate("magic-link-setup", templateData);

    console.log("html: " + html);

    const sent = await sendEmail({
      to: email,
      subject: "Set Up Your Jobready Account",
      html,
    });

    if (!sent) {
      logger.error(`Error sending magic link setup email to ${email}`);
    } else {
      logger.info(`Magic link setup email sent successfully to ${email}`);
    }

    return sent;
  } catch (error) {
    logger.error(`Error sending magic link setup email: ${error}`);
    return false;
  }
};

/**
 * Sends a unified email for both training and evaluation assignments.
 * @param email - Recipient's email address.
 * @param assignments - An object containing details about the training and evaluation.
 * @returns A promise that resolves to true if the email was sent successfully.
 */
export const sendUnifiedAssignmentEmail = async (
  email: string,
  assignments: {
    training?: { title: string; link: string };
    evaluation?: { title: string; link: string };
  }
): Promise<boolean> => {
  try {
    const { training, evaluation } = assignments;

    if (!training && !evaluation) {
      logger.warn("No assignments provided, skipping email.");
      return false;
    }

    const subject = "You Have New Assignments";
    const templateData = {
      trainingTitle: training?.title,
      trainingLink: training?.link,
      evaluationTitle: evaluation?.title,
      evaluationLink: evaluation?.link,
    };

    const html = getEmailTemplate("unified-assignment", templateData);

    return await sendEmail({
      to: email,
      subject,
      html,
    });
  } catch (error) {
    logger.error("Error sending unified assignment email:", error);
    return false;
  }
};
