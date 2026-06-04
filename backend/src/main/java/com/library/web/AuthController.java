package com.library.web;

import com.library.application.AuthService;
import com.library.application.UserService;
import com.library.config.CustomUserDetailsService;
import com.library.domain.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final CustomUserDetailsService customUserDetailsService;

    public AuthController(AuthService authService, UserService userService, 
                          CustomUserDetailsService customUserDetailsService) {
        this.authService = authService;
        this.userService = userService;
        this.customUserDetailsService = customUserDetailsService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest req) {
        User user = authService.registerUser(
                req.getUsername(),
                req.getEmail(),
                req.getPassword(),
                req.getFirstName(),
                req.getLastName(),
                req.getLocation(),
                req.getAge()
        );
        return ResponseEntity.ok(Mapper.toDto(user));
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody AuthRequest req) {
        String token = authService.loginUser(req.getUsernameOrEmail(), req.getPassword());
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(req.getUsernameOrEmail());
        
        List<String> roles = userDetails.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .collect(Collectors.toList());

        User user = userService.getUserByUsername(userDetails.getUsername());

        return ResponseEntity.ok(JwtResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(roles)
                .build());
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verify(@RequestParam("token") String token) {
        boolean verified = authService.verifyEmail(token);
        if (verified) {
            return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can now login."));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired verification token."));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<Map<String, String>> requestReset(@Valid @RequestBody ResetPasswordRequest req) {
        boolean sent = authService.requestPasswordReset(req.getEmail());
        if (sent) {
            return ResponseEntity.ok(Map.of("message", "Password reset link sent to your email."));
        }
        // Return 200 even if user not found for security purposes to avoid email enumeration
        return ResponseEntity.ok(Map.of("message", "If the email is registered, a password reset link has been sent."));
    }

    @PostMapping("/password-reset/execute")
    public ResponseEntity<Map<String, String>> executeReset(@Valid @RequestBody ResetPasswordExecuteRequest req) {
        boolean completed = authService.executePasswordReset(req.getToken(), req.getNewPassword());
        if (completed) {
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired reset token."));
    }
}
