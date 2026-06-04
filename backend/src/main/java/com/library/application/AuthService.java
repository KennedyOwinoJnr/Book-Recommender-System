package com.library.application;

import com.library.config.JwtTokenProvider;
import com.library.domain.Role;
import com.library.domain.User;
import com.library.infrastructure.RoleRepository;
import com.library.infrastructure.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final MailService mailService;
    private final AuditLogService auditLogService;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider,
                       AuthenticationManager authenticationManager, MailService mailService,
                       AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
        this.mailService = mailService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public User registerUser(String username, String email, String password, String firstName, String lastName, String location, Integer age) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken!");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email Address already in use!");
        }

        Role memberRole = roleRepository.findByName("ROLE_MEMBER")
                .orElseThrow(() -> new IllegalStateException("Default member role not configured."));

        String token = UUID.randomUUID().toString();

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .firstName(firstName)
                .lastName(lastName)
                .location(location)
                .age(age)
                .verificationToken(token)
                .emailVerified(false)
                .isActive(true)
                .roles(Set.of(memberRole))
                .build();

        User savedUser = userRepository.save(user);

        // Send verification email
        mailService.sendVerificationEmail(email, token);

        auditLogService.log(savedUser.getId(), email, "USER_REGISTER", "User", savedUser.getId(), "User registered successfully");

        return savedUser;
    }

    public String loginUser(String usernameOrEmail, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(usernameOrEmail, password)
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new IllegalArgumentException("User not found after authentication"));

        auditLogService.log(user.getId(), user.getEmail(), "USER_LOGIN", "User", user.getId(), "User logged in successfully");

        return token;
    }

    @Transactional
    public boolean verifyEmail(String token) {
        Optional<User> userOpt = userRepository.findByVerificationToken(token);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setEmailVerified(true);
            user.setVerificationToken(null);
            userRepository.save(user);
            auditLogService.log(user.getId(), user.getEmail(), "EMAIL_VERIFY", "User", user.getId(), "Email verified successfully");
            return true;
        }
        return false;
    }

    @Transactional
    public boolean requestPasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = UUID.randomUUID().toString();
            user.setVerificationToken(token); // Reusing verificationToken column for simplicity
            userRepository.save(user);

            mailService.sendPasswordResetEmail(email, token);
            auditLogService.log(user.getId(), user.getEmail(), "PASSWORD_RESET_REQUEST", "User", user.getId(), "Password reset requested");
            return true;
        }
        return false;
    }

    @Transactional
    public boolean executePasswordReset(String token, String newPassword) {
        Optional<User> userOpt = userRepository.findByVerificationToken(token);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            user.setVerificationToken(null);
            userRepository.save(user);
            auditLogService.log(user.getId(), user.getEmail(), "PASSWORD_RESET_COMPLETE", "User", user.getId(), "Password reset executed successfully");
            return true;
        }
        return false;
    }
}
