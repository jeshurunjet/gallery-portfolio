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

            if (url == null || url.isEmpty()) {
                return ResponseEntity.badRequest().body("Missing url");
            }

            // Attempt to extract public_id from the URL by removing the extension and folders before the portfolio folder
            // Example secure_url: https://res.cloudinary.com/<cloud>/video/upload/v162.../portfolio/my-video.mp4
            String publicId = null;

            try {
                java.net.URI parsed = java.net.URI.create(url);
                String path = parsed.getPath();

                // find /portfolio/ in the path
                int idx = path.indexOf("/portfolio/");
                if (idx >= 0) {
                    String after = path.substring(idx + 1); // remove leading '/'
                    // remove version segments (v12345) and file extension
                    // split by '/' and drop the v* segment if present
                    String[] parts = after.split("/");
                    java.util.List<String> filtered = new java.util.ArrayList<>();
                    for (String p : parts) {
                        if (!p.matches("v[0-9]+")) filtered.add(p);
                    }

                    String joined = String.join("/", filtered);
                    // remove extension
                    int dot = joined.lastIndexOf('.');
                    publicId = dot > 0 ? joined.substring(0, dot) : joined;
                }
            } catch (Exception ignored) {
            }

            if (publicId == null) {
                return ResponseEntity.status(400).body("Could not derive public_id from url");
            }

            String resourceType = url.contains("/video/") ? "video" : "image";

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
}
