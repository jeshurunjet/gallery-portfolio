package com.jeshurun.portfolio.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private final Cloudinary cloudinary;

    public UploadController(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
        @SuppressWarnings("unchecked")
Map<String, Object> uploadResult = (Map<String, Object>) cloudinary.uploader().upload(
        file.getBytes(),
        ObjectUtils.emptyMap()
);
            String imageUrl = (String) uploadResult.get("secure_url");

            return ResponseEntity.ok(imageUrl);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }
}