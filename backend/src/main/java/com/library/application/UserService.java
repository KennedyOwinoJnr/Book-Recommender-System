package com.library.application;

import com.library.domain.Role;
import com.library.domain.User;
import com.library.infrastructure.RoleRepository;
import com.library.infrastructure.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, AuditLogService auditLogService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Page<User> searchUsers(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "username"));
        return userRepository.searchUsers(search == null ? "" : search.trim(), pageable);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + username));
    }

    @Transactional
    public User updateUserProfile(Long id, String email, String firstName, String lastName, String location, Integer age) {
        User user = getUserById(id);
        
        if (email != null && !email.trim().isEmpty() && !email.equalsIgnoreCase(user.getEmail())) {
            String trimmedEmail = email.trim();
            if (userRepository.existsByEmail(trimmedEmail)) {
                throw new IllegalArgumentException("Email Address is already in use by another account!");
            }
            user.setEmail(trimmedEmail);
            user.setEmailVerified(false);
        }
        
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setLocation(location);
        user.setAge(age);
        
        User updated = userRepository.save(user);
        auditLogService.log(updated.getId(), updated.getEmail(), "USER_UPDATE", "User", updated.getId(), "User profile details updated");
        return updated;
    }

    @Transactional
    public User setUserActivation(Long id, boolean active, Long actorId, String actorEmail) {
        User user = getUserById(id);
        user.setIsActive(active);
        User updated = userRepository.save(user);
        
        String action = active ? "USER_ACTIVATE" : "USER_DEACTIVATE";
        auditLogService.log(actorId, actorEmail, action, "User", updated.getId(), "User account status set to " + active);
        return updated;
    }

    @Transactional
    public User assignRoles(Long id, List<String> roleNames, Long actorId, String actorEmail) {
        User user = getUserById(id);
        Set<Role> roles = roleNames.stream()
                .map(name -> roleRepository.findByName(name)
                        .orElseThrow(() -> new IllegalArgumentException("Role not found: " + name)))
                .collect(Collectors.toSet());
        
        user.setRoles(roles);
        User updated = userRepository.save(user);
        
        auditLogService.log(actorId, actorEmail, "USER_ROLES_ASSIGN", "User", updated.getId(), 
                "Assigned roles: " + String.join(", ", roleNames));
        return updated;
    }

    @Transactional
    public User changePassword(Long id, String newPassword) {
        User user = getUserById(id);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        User updated = userRepository.save(user);
        auditLogService.log(updated.getId(), updated.getEmail(), "PASSWORD_CHANGE", "User", updated.getId(), "User password updated manually");
        return updated;
    }
}
