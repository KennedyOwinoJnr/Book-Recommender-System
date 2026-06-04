package com.library.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.Duration;
import java.util.*;

@Service
public class RecommendationService {
    private static final Logger logger = LoggerFactory.getLogger(RecommendationService.class);

    private final RestTemplate restTemplate;
    private final String mlServiceUrl;

    public RecommendationService(RestTemplateBuilder restTemplateBuilder,
                                 @Value("${app.ml-service-url}") String mlServiceUrl) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
        this.mlServiceUrl = mlServiceUrl;
    }

    public List<Map<String, Object>> getHybridRecommendations(Long userId, int limit) {
        String url = mlServiceUrl + "/recommend/hybrid";
        return fetchRecommendations(url, userId, limit);
    }

    public List<Map<String, Object>> getCollaborativeRecommendations(Long userId, int limit) {
        String url = mlServiceUrl + "/recommend/collaborative";
        return fetchRecommendations(url, userId, limit);
    }

    public List<Map<String, Object>> getPopularBooks(int limit) {
        String url = mlServiceUrl + "/recommend/popular?n=" + limit;
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            logger.error("Failed to fetch popular books from ML service", e);
            return getLocalPopularFallback(limit);
        }
    }

    private List<Map<String, Object>> fetchRecommendations(String url, Long userId, int limit) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("user_id", userId);
            requestBody.put("n_recommendations", limit);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Object recs = body.get("recommendations");
                if (recs instanceof List) {
                    return (List<Map<String, Object>>) recs;
                }
            }
            return Collections.emptyList();
        } catch (Exception e) {
            logger.error("Failed to fetch recommendations from ML service", e);
            // Fallback: return popular books if microservice fails
            return getPopularBooks(limit);
        }
    }

    private List<Map<String, Object>> getLocalPopularFallback(int limit) {
        // High-level fallback mapping
        List<Map<String, Object>> fallback = new ArrayList<>();
        String[] popularTitles = {
            "The Da Vinci Code", "Harry Potter and the Sorcerer's Stone", 
            "Angels & Demons", "The Fellowship of the Ring", "To Kill a Mockingbird"
        };
        for (int i = 0; i < Math.min(limit, popularTitles.length); i++) {
            Map<String, Object> bookMap = new HashMap<>();
            bookMap.put("title", popularTitles[i]);
            bookMap.put("image_url", "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop");
            bookMap.put("reason", "Popular Choice");
            fallback.add(bookMap);
        }
        return fallback;
    }
}
