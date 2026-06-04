package com.library.web;

import com.library.domain.*;
import java.util.Collections;
import java.util.stream.Collectors;

public class Mapper {

    public static UserDto toDto(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .location(user.getLocation())
                .age(user.getAge())
                .isActive(user.getIsActive())
                .emailVerified(user.getEmailVerified())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                .build();
    }

    public static BookDto toDto(Book book) {
        if (book == null) return null;
        return BookDto.builder()
                .id(book.getId())
                .isbn(book.getIsbn())
                .title(book.getTitle())
                .author(book.getAuthor())
                .publisher(book.getPublisher())
                .yearOfPublication(book.getYearOfPublication())
                .description(book.getDescription())
                .pageCount(book.getPageCount())
                .language(book.getLanguage())
                .maturityRating(book.getMaturityRating())
                .imageUrlSmall(book.getImageUrlSmall())
                .imageUrlMedium(book.getImageUrlMedium())
                .imageUrlLarge(book.getImageUrlLarge())
                .stockTotal(book.getStockTotal())
                .stockAvailable(book.getStockAvailable())
                .categories(book.getCategories() != null ? 
                        book.getCategories().stream().map(Category::getName).collect(Collectors.toList()) : 
                        Collections.emptyList())
                .build();
    }

    public static BorrowingDto toDto(Borrowing borrowing) {
        if (borrowing == null) return null;
        return BorrowingDto.builder()
                .id(borrowing.getId())
                .userId(borrowing.getUser().getId())
                .username(borrowing.getUser().getUsername())
                .bookId(borrowing.getBook().getId())
                .bookTitle(borrowing.getBook().getTitle())
                .bookIsbn(borrowing.getBook().getIsbn())
                .borrowedAt(borrowing.getBorrowedAt())
                .dueDate(borrowing.getDueDate())
                .returnedAt(borrowing.getReturnedAt())
                .status(borrowing.getStatus())
                .fineAmount(borrowing.getFineAmount())
                .build();
    }

    public static ReservationDto toDto(Reservation reservation) {
        if (reservation == null) return null;
        return ReservationDto.builder()
                .id(reservation.getId())
                .userId(reservation.getUser().getId())
                .username(reservation.getUser().getUsername())
                .bookId(reservation.getBook().getId())
                .bookTitle(reservation.getBook().getTitle())
                .bookIsbn(reservation.getBook().getIsbn())
                .reservedAt(reservation.getReservedAt())
                .expiresAt(reservation.getExpiresAt())
                .status(reservation.getStatus())
                .build();
    }
}
