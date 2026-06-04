package com.library.web;

import com.library.application.RecommendationService;
import com.library.application.UserService;
import com.library.domain.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserService userService;

    public RecommendationController(RecommendationService recommendationService, UserService userService) {
        this.recommendationService = recommendationService;
        this.userService = userService;
    }

    @GetMapping("/hybrid")
    public ResponseEntity<List<Map<String, Object>>> getHybridRecs(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(name = "limit", defaultValue = "6") int limit) {
        
        User user = userService.getUserByUsername(principal.getUsername());
        
        // Wait, the ML model user IDs are large numbers (e.g. from Users.csv).
        // If they are a newly registered user (e.g. ID is small like 1, 2, etc.), 
        // they won't match the historical ratings, which is handled gracefully by ML service fallback.
        // Let's pass the database user ID.
        List<Map<String, Object>> recs = recommendationService.getHybridRecommendations(user.getId(), limit);
        return ResponseEntity.ok(recs);
    }

    @GetMapping("/collaborative")
    public ResponseEntity<List<Map<String, Object>>> getCollaborativeRecs(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(name = "limit", defaultValue = "5") int limit) {
        
        User user = userService.getUserByUsername(principal.getUsername());
        List<Map<String, Object>> recs = recommendationService.getCollaborativeRecommendations(user.getId(), limit);
        return ResponseEntity.ok(recs);
    }

    @GetMapping("/popular")
    public ResponseEntity<List<Map<String, Object>>> getPopularRecs(
            @RequestParam(name = "limit", defaultValue = "6") int limit) {
        List<Map<String, Object>> recs = recommendationService.getPopularBooks(limit);
        return ResponseEntity.ok(recs);
    }
}
