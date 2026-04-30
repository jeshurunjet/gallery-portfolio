package com.jeshurun.portfolio.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private static final String UPLOAD_DIR =
            System.getProperty("user.dir") + "/uploads";

    @PostMapping("/image")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            File directory = new File(UPLOAD_DIR);

            if (!directory.exists()) {
                directory.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();

            if (originalFilename == null || originalFilename.isBlank()) {
                return ResponseEntity.badRequest().body("File name is missing");
            }

            String filename = UUID.randomUUID() + "_" + originalFilename;
            File destination = new File(directory, filename);

            file.transferTo(destination);

            String fileUrl = "http://localhost:8080/uploads/" + filename;

            return ResponseEntity.ok(fileUrl);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(500)
                    .body("Upload failed: " + e.getMessage());
        }
    }
}