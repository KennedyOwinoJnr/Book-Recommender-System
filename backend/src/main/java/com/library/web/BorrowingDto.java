package com.library.web;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowingDto {
    private Long id;
    private Long userId;
    private String username;
    private Long bookId;
    private String bookTitle;
    private String bookIsbn;
    private Instant borrowedAt;
    private Instant dueDate;
    private Instant returnedAt;
    private String status;
    private BigDecimal fineAmount;
}
