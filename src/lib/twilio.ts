import twilio from "twilio";

if (!process.env.TWILIO_ACCOUNT_SID) {
  throw new Error("Missing TWILIO_ACCOUNT_SID environment variable");
}

if (!process.env.TWILIO_AUTH_TOKEN) {
  throw new Error("Missing TWILIO_AUTH_TOKEN environment variable");
}

if (!process.env.TWILIO_PHONE_NUMBER) {
  throw new Error("Missing TWILIO_PHONE_NUMBER environment variable");
}

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Format phone number to E.164 format
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  // Add US country code if not present
  return cleaned.startsWith("1") ? `+${cleaned}` : `+1${cleaned}`;
};

interface TwilioError extends Error {
  code?: number;
}

export const sendOTP = async (phoneNumber: string, otp: string) => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const message = await twilioClient.messages.create({
      body: `Your State Restaurant login code is: ${otp}`,
      to: formattedPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    return message.sid;
  } catch (error: unknown) {
    const twilioError = error as TwilioError;
    console.error("Error sending OTP:", twilioError);

    if (twilioError.code === 21211) {
      throw new Error("Invalid phone number format");
    }
    if (twilioError.code === 21608) {
      throw new Error("Unverified phone number");
    }
    throw twilioError;
  }
};

// General purpose SMS sender for any type of message
export const sendSMS = async (
  phoneNumber: string,
  message: string,
  media?: string[]
) => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const smsMessage = await twilioClient.messages.create({
      body: message,
      to: formattedPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      mediaUrl: media,
    });

    return smsMessage.sid;
  } catch (error: unknown) {
    const twilioError = error as TwilioError;
    console.error("Error sending SMS:", twilioError);

    if (twilioError.code === 21211) {
      throw new Error("Invalid phone number format");
    }
    if (twilioError.code === 21608) {
      throw new Error("Unverified phone number");
    }
    throw twilioError;
  }
};
