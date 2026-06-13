package com.jeshurun.portfolio.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://www.jesh.nz",
        "https://jesh.nz",
        "https://gallery-portfolio-orpin.vercel.app"
})
@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private static final Path UPLOAD_ROOT = Paths.get("uploads");
    private final Cloudinary cloudinary;

    public UploadController(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (useLocalStorage()) {
                return ResponseEntity.ok(storeLocally(file, "image"));
            }

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
            if (useLocalStorage()) {
                return ResponseEntity.ok(storeLocally(file, "video"));
            }

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

    @PostMapping("/pdf")
    public ResponseEntity<?> uploadPdf(@RequestParam("file") MultipartFile file) {
        try {
            String originalName = file.getOriginalFilename();

            if (originalName == null || !originalName.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
                return ResponseEntity.badRequest().body("Only PDF files are supported.");
            }

            if (useLocalStorage()) {
                Map<String, Object> localResult = storeLocally(file, "pdf");
                localResult.put("storage", "local");
                return ResponseEntity.ok(localResult);
            }

            String sanitizedBaseName = sanitizePdfBaseName(originalName);
            Map<String, Object> uploadResult = uploadPdfToCloudinary(file, originalName, sanitizedBaseName);
            String pdfUrl = (String) uploadResult.get("secure_url");
            String returnedPublicId = (String) uploadResult.get("public_id");

            return ResponseEntity.ok(ObjectUtils.asMap(
                    "url", pdfUrl,
                    "public_id", returnedPublicId,
                    "storage", "cloudinary"
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

            if (isLocalUpload(url, publicId)) {
                return ResponseEntity.ok(deleteLocalFile(url, publicId));
            }

            if (publicId == null) {
                publicId = derivePublicId(url);
            }

            if (publicId == null || publicId.isBlank()) {
                return ResponseEntity.status(400).body("Could not derive public_id from url");
            }

            if (resourceType == null || resourceType.isBlank()) {
                if (url != null && url.contains("/video/")) {
                    resourceType = "video";
                } else {
                    resourceType = "image";
                }
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

    private boolean useLocalStorage() {
        Object cloudName = cloudinary.config.cloudName;

        if (!(cloudName instanceof String name)) {
            return true;
        }

        return !StringUtils.hasText(name) || "test".equalsIgnoreCase(name);
    }

    private String sanitizePdfBaseName(String originalName) {
        String withoutExtension = originalName.replaceFirst("(?i)\\.pdf$", "");
        String sanitized = withoutExtension
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9-_]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");

        if (sanitized.isBlank()) {
            return "document";
        }

        return sanitized;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> uploadPdfToCloudinary(
            MultipartFile file,
            String originalName,
            String sanitizedBaseName
    ) throws Exception {
        String primaryPublicId = "portfolio/pdfs/" + sanitizedBaseName;

        try {
            return (Map<String, Object>) cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "resource_type", "image",
                            "public_id", primaryPublicId,
                            "format", "pdf",
                            "overwrite", false,
                            "use_filename", true,
                            "unique_filename", false,
                            "filename_override", originalName
                    )
            );
        } catch (Exception exception) {
            String fallbackPublicId = primaryPublicId + "-" + UUID.randomUUID().toString().substring(0, 8);

            return (Map<String, Object>) cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "resource_type", "image",
                            "public_id", fallbackPublicId,
                            "format", "pdf",
                            "overwrite", false,
                            "use_filename", true,
                            "unique_filename", false,
                            "filename_override", originalName
                    )
            );
        }
    }

    private Map<String, Object> storeLocally(MultipartFile file, String resourceType) throws Exception {
        Files.createDirectories(UPLOAD_ROOT);

        String originalName = file.getOriginalFilename();
        String extension = "";

        if (originalName != null) {
            int extensionIndex = originalName.lastIndexOf(".");

            if (extensionIndex >= 0) {
                extension = originalName.substring(extensionIndex);
            }
        }

        String publicId = "local/" + resourceType + "/" + UUID.randomUUID();
        String filename = publicId.replace("/", "_") + extension;
        Path destination = UPLOAD_ROOT.resolve(filename);

        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(filename)
                .toUriString();

        Map<String, Object> result = new HashMap<>();
        result.put("url", url);
        result.put("public_id", publicId);

        return result;
    }

    private boolean isLocalUpload(String url, String publicId) {
        return (url != null && url.contains("/uploads/")) ||
                (publicId != null && publicId.startsWith("local/"));
    }

    private Map<String, Object> deleteLocalFile(String url, String publicId) throws Exception {
        Files.createDirectories(UPLOAD_ROOT);

        String filename = null;

        if (url != null && url.contains("/uploads/")) {
            filename = url.substring(url.lastIndexOf("/uploads/") + "/uploads/".length());
        } else if (publicId != null && publicId.startsWith("local/")) {
            try (var stream = Files.list(UPLOAD_ROOT)) {
                filename = stream
                        .map(path -> path.getFileName().toString())
                        .filter(name -> name.startsWith(publicId.replace("/", "_")))
                        .findFirst()
                        .orElse(null);
            }
        }

        if (filename == null) {
            return Map.of("result", "not found");
        }

        Files.deleteIfExists(UPLOAD_ROOT.resolve(filename));
        return Map.of("result", "ok");
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
