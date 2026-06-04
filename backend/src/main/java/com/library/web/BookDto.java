package com.library.web;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookDto {
    private Long id;
    private String isbn;
    private String title;
    private String author;
    private String publisher;
    private Integer yearOfPublication;
    private String description;
    private Integer pageCount;
    private String language;
    private String maturityRating;
    private String imageUrlSmall;
    private String imageUrlMedium;
    private String imageUrlLarge;
    private Integer stockTotal;
    private Integer stockAvailable;
    private List<String> categories;
}
