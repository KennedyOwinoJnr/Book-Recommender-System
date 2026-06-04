package com.library.web;

import com.library.application.BookService;
import com.library.application.UserService;
import com.library.domain.Book;
import com.library.domain.BookRating;
import com.library.domain.Category;
import com.library.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/books")
public class BookController {

    private final BookService bookService;
    private final UserService userService;

    public BookController(BookService bookService, UserService userService) {
        this.bookService = bookService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<Page<BookDto>> getBooks(
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Book> books = bookService.getBooks(query, category, pageable);
        Page<BookDto> dtoPage = books.map(Mapper::toDto);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDto> getBookById(@PathVariable("id") Long id) {
        Book book = bookService.getBookById(id);
        Double avgRating = bookService.getBookAverageRating(id);
        
        BookDto dto = Mapper.toDto(book);
        // We can append details if needed, let's keep it simple.
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BookDto> createBook(@RequestBody BookDto bookDto,
                                              @AuthenticationPrincipal UserDetails actorPrincipal) {
        User actor = userService.getUserByUsername(actorPrincipal.getUsername());
        Book book = Book.builder()
                .isbn(bookDto.getIsbn())
                .title(bookDto.getTitle())
                .author(bookDto.getAuthor())
                .publisher(bookDto.getPublisher())
                .yearOfPublication(bookDto.getYearOfPublication())
                .description(bookDto.getDescription())
                .pageCount(bookDto.getPageCount())
                .language(bookDto.getLanguage())
                .maturityRating(bookDto.getMaturityRating())
                .imageUrlSmall(bookDto.getImageUrlSmall())
                .imageUrlMedium(bookDto.getImageUrlMedium())
                .imageUrlLarge(bookDto.getImageUrlLarge())
                .stockTotal(bookDto.getStockTotal())
                .stockAvailable(bookDto.getStockTotal()) // initially available = total
                .build();

        Book created = bookService.createBook(book, bookDto.getCategories(), actor.getId(), actor.getEmail());
        return ResponseEntity.ok(Mapper.toDto(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BookDto> updateBook(@PathVariable("id") Long id,
                                              @RequestBody BookDto bookDto,
                                              @AuthenticationPrincipal UserDetails actorPrincipal) {
        User actor = userService.getUserByUsername(actorPrincipal.getUsername());
        Book book = Book.builder()
                .title(bookDto.getTitle())
                .author(bookDto.getAuthor())
                .publisher(bookDto.getPublisher())
                .yearOfPublication(bookDto.getYearOfPublication())
                .description(bookDto.getDescription())
                .pageCount(bookDto.getPageCount())
                .language(bookDto.getLanguage())
                .maturityRating(bookDto.getMaturityRating())
                .imageUrlSmall(bookDto.getImageUrlSmall())
                .imageUrlMedium(bookDto.getImageUrlMedium())
                .imageUrlLarge(bookDto.getImageUrlLarge())
                .stockTotal(bookDto.getStockTotal())
                .build();

        Book updated = bookService.updateBook(id, book, bookDto.getCategories(), actor.getId(), actor.getEmail());
        return ResponseEntity.ok(Mapper.toDto(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> deleteBook(@PathVariable("id") Long id,
                                                          @AuthenticationPrincipal UserDetails actorPrincipal) {
        User actor = userService.getUserByUsername(actorPrincipal.getUsername());
        bookService.deleteBook(id, actor.getId(), actor.getEmail());
        return ResponseEntity.ok(Map.of("message", "Book successfully deleted."));
    }

    @PostMapping("/{id}/ratings")
    public ResponseEntity<Map<String, Object>> rateBook(@PathVariable("id") Long id,
                                                        @RequestBody Map<String, Integer> body,
                                                        @AuthenticationPrincipal UserDetails principal) {
        User user = userService.getUserByUsername(principal.getUsername());
        Integer score = body.get("rating");
        BookRating rating = bookService.rateBook(user, id, score);
        
        return ResponseEntity.ok(Map.of(
                "message", "Book rated successfully",
                "rating", rating.getRating()
        ));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<Category> categories = bookService.getAllCategories();
        List<String> names = categories.stream().map(Category::getName).collect(Collectors.toList());
        return ResponseEntity.ok(names);
    }
}
