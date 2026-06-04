package com.library.application;

import com.library.domain.Role;
import com.library.domain.User;
import com.library.infrastructure.RoleRepository;
import com.library.infrastructure.UserRepository;
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

    public UserService(UserRepository userRepository, RoleRepository roleRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogService = auditLogService;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
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
    public User updateUserProfile(Long id, String firstName, String lastName, String location, Integer age) {
        User user = getUserById(id);
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
}
