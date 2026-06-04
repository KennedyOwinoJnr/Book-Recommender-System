package com.library.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String isbn;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 255)
    private String author;

    @Column(length = 255)
    private String publisher;

    @Column(name = "year_of_publication")
    private Integer yearOfPublication;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(length = 10)
    private String language;

    @Column(name = "maturity_rating", length = 50)
    private String maturityRating;

    @Column(name = "image_url_small", length = 500)
    private String imageUrlSmall;

    @Column(name = "image_url_medium", length = 500)
    private String imageUrlMedium;

    @Column(name = "image_url_large", length = 500)
    private String imageUrlLarge;

    @Column(name = "stock_total")
    @Builder.Default
    private Integer stockTotal = 1;

    @Column(name = "stock_available")
    @Builder.Default
    private Integer stockAvailable = 1;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "book_categories",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<Category> categories = new HashSet<>();

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
