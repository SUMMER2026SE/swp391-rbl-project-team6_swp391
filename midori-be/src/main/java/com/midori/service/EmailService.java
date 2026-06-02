package com.midori.service;

import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.SocketTimeoutException;
import java.net.ConnectException;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@midori.local}")
    private String fromAddress;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Async
    public void sendVerificationOtp(String to, String otp) {
        if (!mailEnabled) {
            log.info("[Email] Verification email queued for {} (mail disabled)", to);
            return;
        }

        String subject = "[MIDORI] Your verification code";
        String body = buildOtpEmailBody(otp);

        sendHtmlEmail(to, subject, body);
    }

    @Async
    public void sendPasswordResetEmail(String to, String resetToken) {
        if (!mailEnabled) {
            log.info("[Email] Password reset email queued for {} (mail disabled)", to);
            return;
        }

        String resetLink = frontendBaseUrl + "/reset-password?token=" + resetToken;
        String subject = "[MIDORI] Reset your password";
        String body = buildPasswordResetEmailBody(resetLink);

        sendHtmlEmail(to, subject, body);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("[Email] Sent '{}' to {}", subject, to);
        } catch (AuthenticationFailedException e) {
            log.error("[Email] Failed to send '{}' to {} — Mail authentication failed. Check Gmail App Password.", subject, to);
        } catch (MessagingException e) {
            Throwable cause = e.getCause();
            if (cause instanceof SocketTimeoutException || cause instanceof ConnectException) {
                log.error("[Email] Failed to send '{}' to {} — Mail server timed out. Check SMTP/network or increase timeout.", subject, to);
            } else {
                log.error("[Email] Failed to send '{}' to {} — Messaging error: {}", subject, to, e.getMessage());
                log.debug("[Email] Stack trace for {} to {}", subject, to, e);
            }
        } catch (Exception e) {
            log.error("[Email] Failed to send '{}' to {} — {}: {}", subject, to, e.getClass().getSimpleName(), e.getMessage());
            log.debug("[Email] Stack trace for {} to {}", subject, to, e);
        }
    }

    private String buildOtpEmailBody(String otp) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 480px; margin: 40px auto; background: #ffffff;
                             border-radius: 12px; overflow: hidden;
                             box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #8B5CF6, #EC4899);
                          padding: 32px; text-align: center; color: white; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
                .body { padding: 32px; text-align: center; }
                .otp-code { font-size: 40px; font-weight: bold; letter-spacing: 8px;
                            color: #8B5CF6; margin: 24px 0; }
                .note { color: #6b7280; font-size: 13px; line-height: 1.6; margin-top: 16px; }
                .footer { padding: 16px 32px; background: #f9fafb;
                          border-top: 1px solid #e5e7eb; text-align: center; }
                .footer p { margin: 0; color: #9ca3af; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>MIDORI</h1>
                  <p>Japanese Learning Platform</p>
                </div>
                <div class="body">
                  <p style="color: #374151; font-size: 16px; margin-bottom: 8px;">
                    Enter this code to verify your email address:
                  </p>
                  <div class="otp-code">%s</div>
                  <p class="note">
                    This code expires in 1 minute. If you did not create a MIDORI account,
                    you can safely ignore this email.
                  </p>
                </div>
                <div class="footer">
                  <p>MIDORI — Learn Japanese with AI</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(otp);
    }

    private String buildPasswordResetEmailBody(String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 480px; margin: 40px auto; background: #ffffff;
                             border-radius: 12px; overflow: hidden;
                             box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #8B5CF6, #EC4899);
                          padding: 32px; text-align: center; color: white; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
                .body { padding: 32px; text-align: center; }
                .btn { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #EC4899);
                       color: white; padding: 14px 32px; border-radius: 8px;
                       text-decoration: none; font-weight: bold; font-size: 16px;
                       margin: 24px 0; }
                .note { color: #6b7280; font-size: 13px; line-height: 1.6; margin-top: 16px; }
                .link { word-break: break-all; color: #8B5CF6; font-size: 12px; }
                .footer { padding: 16px 32px; background: #f9fafb;
                          border-top: 1px solid #e5e7eb; text-align: center; }
                .footer p { margin: 0; color: #9ca3af; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>MIDORI</h1>
                  <p>Japanese Learning Platform</p>
                </div>
                <div class="body">
                  <p style="color: #374151; font-size: 16px; margin-bottom: 8px;">
                    Click the button below to reset your password:
                  </p>
                  <a href="%s" class="btn">Reset Password</a>
                  <p class="note">
                    This link expires in 1 hour. If you did not request a password reset,
                    you can safely ignore this email — your password will not be changed.
                  </p>
                  <p class="note" style="margin-top: 8px;">
                    Or copy this link into your browser:<br>
                    <span class="link">%s</span>
                  </p>
                </div>
                <div class="footer">
                  <p>MIDORI — Learn Japanese with AI</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(resetLink, resetLink);
    }
}
