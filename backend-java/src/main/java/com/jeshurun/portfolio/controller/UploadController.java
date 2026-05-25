package com.jeshurun.portfolio.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://www.jesh.nz/",
        "https://jesh.nz/",
        "https://gallery-portfolio-orpin.vercel.app/"
})
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
            Map<String, Object> uploadResult =
                    (Map<String, Object>) cloudinary.uploader().upload(
                            file.getBytes(),
                            ObjectUtils.asMap(
                                    "folder", "portfolio",
                                    "resource_type", "image"
                            )
                    );
                String imageUrl = (String) uploadResult.get("secure_url");
                String publicId = (String) uploadResult.get("public_id");

                return ResponseEntity.ok(ObjectUtils.asMap(
                    "url", imageUrl,
                    "public_id", publicId
                ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    @PostMapping("/video")
    public ResponseEntity<?> uploadVideo(@RequestParam("file") MultipartFile file) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult =
                    (Map<String, Object>) cloudinary.uploader().upload(
                            file.getBytes(),
                            ObjectUtils.asMap(
                                    "folder", "portfolio",
                                    "resource_type", "video"
                            )
                    );
            String videoUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            return ResponseEntity.ok(ObjectUtils.asMap(
                    "url", videoUrl,
                    "public_id", publicId
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteMedia(@RequestBody Map<String, String> body) {
        try {
            String url = body.get("url");
            String publicId = body.get("publicId");
            String resourceType = body.get("resourceType");

            if ((url == null || url.isEmpty()) && (publicId == null || publicId.isEmpty())) {
                return ResponseEntity.badRequest().body("Missing url or publicId");
            }

            if (publicId == null) {
                publicId = derivePublicId(url);
            }

            if (publicId == null || publicId.isBlank()) {
                return ResponseEntity.status(400).body("Could not derive public_id from url");
            }

            if (resourceType == null || resourceType.isBlank()) {
                resourceType = url != null && url.contains("/video/") ? "video" : "image";
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> result = (Map<String, Object>) cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("resource_type", resourceType)
            );

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Delete failed: " + e.getMessage());
        }
    }

    private String derivePublicId(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }

        try {
            java.net.URI parsed = java.net.URI.create(url);
            String path = parsed.getPath();

            int idx = path.indexOf("/portfolio/");
            if (idx < 0) {
                return null;
            }

            String after = path.substring(idx + 1);
            String[] parts = after.split("/");
            java.util.List<String> filtered = new java.util.ArrayList<>();

            for (String p : parts) {
                if (!p.matches("v[0-9]+")) {
                    filtered.add(p);
                }
            }

            String joined = String.join("/", filtered);
            int dot = joined.lastIndexOf('.');

            return dot > 0 ? joined.substring(0, dot) : joined;
        } catch (Exception ignored) {
            return null;
        }
    }
}
