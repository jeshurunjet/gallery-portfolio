package com.jeshurun.portfolio.controller;

import com.jeshurun.portfolio.entity.PageContent;
import com.jeshurun.portfolio.repository.PageContentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://www.jesh.nz/",
        "https://jesh.nz/",
        "https://gallery-portfolio-orpin.vercel.app/"
})
@RestController
public class PageContentController {

    private final PageContentRepository pageContentRepository;

    public PageContentController(PageContentRepository pageContentRepository) {
        this.pageContentRepository = pageContentRepository;
    }

    @GetMapping("/api/pages/{pageKey}")
    public PageContent getPageContent(@PathVariable String pageKey) {
        return pageContentRepository.findByPageKey(normalizePageKey(pageKey))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Page content not found"
                ));
    }

    @PutMapping("/api/pages/{pageKey}")
    public PageContent updatePageContent(
            @PathVariable String pageKey,
            @RequestBody PageContent updatedContent
    ) {
        String normalizedPageKey = normalizePageKey(pageKey);

        PageContent existingContent = pageContentRepository.findByPageKey(normalizedPageKey)
                .orElseGet(() -> new PageContent(normalizedPageKey, "{}"));

        existingContent.setContent(updatedContent.getContent());

        return pageContentRepository.save(existingContent);
    }

    private String normalizePageKey(String pageKey) {
        String normalized = pageKey == null ? "" : pageKey.trim().toLowerCase();

        if (!normalized.equals("about") && !normalized.equals("resume")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown page");
        }

        return normalized;
    }
}
