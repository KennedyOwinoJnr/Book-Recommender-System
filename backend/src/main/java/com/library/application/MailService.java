package com.library.application;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    private static final Logger logger = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String toEmail, String token) {
        String verificationUrl = "http://localhost:3000/verify-email?token=" + token;
        String subject = "Verify your Tomrec Library account";
        String htmlContent = "<h3>Welcome to Tomrec Library!</h3>"
                + "<p>Please verify your email address by clicking the link below:</p>"
                + "<p><a href=\"" + verificationUrl + "\">Verify Account</a></p>"
                + "<br/>"
                + "<p>If you did not request this, please ignore this email.</p>";

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetUrl = "http://localhost:3000/reset-password?token=" + token;
        String subject = "Reset your Tomrec Library password";
        String htmlContent = "<h3>Reset Password Request</h3>"
                + "<p>Click the link below to set a new password for your account:</p>"
                + "<p><a href=\"" + resetUrl + "\">Reset Password</a></p>"
                + "<br/>"
                + "<p>If you did not request this, please ignore this email.</p>";

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    public void sendReservationExpiredEmail(String toEmail, String bookTitle) {
        String subject = "Your reservation hold has expired";
        String htmlContent = "<h3>Reservation Expired</h3>"
                + "<p>We wanted to let you know that your reservation hold on the book <strong>\"" + bookTitle + "\"</strong> has expired.</p>"
                + "<p>Since the book was not collected or borrowed, it has been returned to circulation or assigned to the next reader in queue.</p>"
                + "<br/>"
                + "<p>Thank you for using Tomrec Library!</p>";

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    public void sendBorrowingDueReminder(String toEmail, String bookTitle, long daysRemaining) {
        String subject = "Reminder: Book due in " + daysRemaining + " days";
        String htmlContent = "<h3>Borrowing Due Reminder</h3>"
                + "<p>This is a reminder that the book <strong>\"" + bookTitle + "\"</strong> you borrowed is due in <strong>" + daysRemaining + " days</strong>.</p>"
                + "<p>Please return it to the library by the due date to avoid any late fees.</p>"
                + "<br/>"
                + "<p>Thank you for using Tomrec Library!</p>";

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("noreply@tomrec-library.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email successfully sent to {}", to);
        } catch (MessagingException e) {
            logger.error("Failed to send email to {}", to, e);
        }
    }
}
