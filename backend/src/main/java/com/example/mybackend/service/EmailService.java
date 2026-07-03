package com.example.mybackend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    @Value("${spring.mail.username:noreply@petmanager.com}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async("emailTaskExecutor")
    public void sendVerificationEmail(String to, String token) {
        String link = appBaseUrl + "/verify-email?token=" + token;
        String subject = "Verify your Pet Manager account";
        String body = "Please verify your email address by clicking the link below:\n\n"
                + link + "\n\nThis link expires in 24 hours.\n\n"
                + "If you did not register, please ignore this email.";
        sendEmail(to, subject, body);
    }

    @Async("emailTaskExecutor")
    public void sendPasswordResetEmail(String to, String token) {
        String link = appBaseUrl + "/reset-password?token=" + token;
        String subject = "Reset your Pet Manager password";
        String body = "You requested a password reset. Click the link below to set a new password:\n\n"
                + link + "\n\nThis link expires in 1 hour and can only be used once.\n\n"
                + "If you did not request a password reset, please ignore this email.";
        sendEmail(to, subject, body);
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (MailException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
