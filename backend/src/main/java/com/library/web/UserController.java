package com.library.web;

import com.library.application.UserService;
import com.library.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByUsername(userDetails.getUsername());
        return ResponseEntity.ok(Mapper.toDto(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                                 @RequestBody Map<String, Object> body) {
        User user = userService.getUserByUsername(userDetails.getUsername());
        String email = (String) body.get("email");
        String firstName = (String) body.get("firstName");
        String lastName = (String) body.get("lastName");
        String location = (String) body.get("location");
        Integer age = body.get("age") != null ? ((Number) body.get("age")).intValue() : null;

        User updated = userService.updateUserProfile(user.getId(), email, firstName, lastName, location, age);
        return ResponseEntity.ok(Mapper.toDto(updated));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                                              @RequestBody Map<String, String> body) {
        User user = userService.getUserByUsername(userDetails.getUsername());
        String newPassword = body.get("password");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password cannot be empty"));
        }
        userService.changePassword(user.getId(), newPassword);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<UserDto>> getUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<UserDto> result = userService.searchUsers(search, page, size)
                .map(Mapper::toDto);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UserDto> setActivation(@PathVariable("id") Long id,
                                                 @RequestBody Map<String, Boolean> body,
                                                 @AuthenticationPrincipal UserDetails actorPrincipal) {
        User actor = userService.getUserByUsername(actorPrincipal.getUsername());
        boolean active = body.getOrDefault("active", true);
        User updated = userService.setUserActivation(id, active, actor.getId(), actor.getEmail());
        return ResponseEntity.ok(Mapper.toDto(updated));
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UserDto> assignRoles(@PathVariable("id") Long id,
                                               @RequestBody Map<String, List<String>> body,
                                               @AuthenticationPrincipal UserDetails actorPrincipal) {
        User actor = userService.getUserByUsername(actorPrincipal.getUsername());
        List<String> roles = body.get("roles");
        User updated = userService.assignRoles(id, roles, actor.getId(), actor.getEmail());
        return ResponseEntity.ok(Mapper.toDto(updated));
    }
}
