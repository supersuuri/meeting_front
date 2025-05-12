// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP configuration error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify Your Email Address for Let's Talk",
    text: `Please verify your email address by clicking the following link: ${verificationUrl}`,
    html: `<p>Welcome to Let's Talk!</p><p>Please click this link to verify your email address:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p><p>This link will expire in 1 hour.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent: %s", info.messageId);
    if (
      process.env.NODE_ENV !== "production" &&
      nodemailer.getTestMessageUrl(info)
    ) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Could not send verification email.");
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { username, email, password, firstName, lastName } = await req.json();

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      if (!userExists.isEmailVerified) {
        return NextResponse.json(
          {
            success: false,
            message: "User already exists, email not verified.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return NextResponse.json(
        { success: false, message: "Username already exists" },
        { status: 400 }
      );
    }

    // Generate email verification token
    const emailVerificationTokenValue = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpiresValue = new Date(Date.now() + 3600000); // 1 hour

    console.log(
      `DEBUG: Generated emailVerificationToken: ${emailVerificationTokenValue}`
    );

    const userPayload = {
      username,
      email,
      password,
      firstName,
      lastName,
      emailVerificationToken: emailVerificationTokenValue,
      emailVerificationExpires: emailVerificationExpiresValue,
      isEmailVerified: false,
    };
    console.log("DEBUG: Payload for User.create:", userPayload);

    const user = await User.create(userPayload);

    console.log(
      "Saved user (raw object from create):",
      JSON.parse(JSON.stringify(user))
    );
    console.log("Saved user (direct access):", {
      _id: user._id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      retrievedEmailVerificationToken: user.emailVerificationToken,
      retrievedEmailVerificationExpires: user.emailVerificationExpires,
    });

    // Send verification email
    await sendVerificationEmail(user.email, emailVerificationTokenValue);

    // Create JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("Server configuration error: JWT_SECRET not set.");
    }
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "1h" });

    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful. Please check your email to verify your account.",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          isEmailVerified: user.isEmailVerified,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error: Could not send verification email.",
      },
      { status: 500 }
    );
  }
}
