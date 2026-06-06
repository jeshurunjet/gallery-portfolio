package com.jeshurun.portfolio.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.jeshurun.portfolio.entity.Project;
import com.jeshurun.portfolio.repository.ProjectRepository;
import com.jeshurun.portfolio.repository.TagRepository;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://www.jesh.nz/",
        "https://jesh.nz/",
        "https://gallery-portfolio-orpin.vercel.app/"
})
@RestController
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final TagRepository tagRepository;
    private final Cloudinary cloudinary;

    public ProjectController(
            ProjectRepository projectRepository,
            TagRepository tagRepository,
            Cloudinary cloudinary
    ) {
        this.projectRepository = projectRepository;
        this.tagRepository = tagRepository;
        this.cloudinary = cloudinary;
    }

    @GetMapping("/api/projects")
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @PostMapping("/api/projects")
    public Project createProject(@RequestBody Project project) {
        syncTags(project.getTags());
        return projectRepository.save(project);
    }

    @PutMapping("/api/projects/{id}")
    public Project updateProject(
            @PathVariable("id") Long id,
            @RequestBody Project updatedProject
    ) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        deleteRemovedAssets(existingProject, updatedProject);

        existingProject.setTitle(updatedProject.getTitle());
        existingProject.setCategory(updatedProject.getCategory());
        existingProject.setDescription(updatedProject.getDescription());
        existingProject.setContent(updatedProject.getContent());
        existingProject.setCover(updatedProject.getCover());
        existingProject.setCoverPublicId(updatedProject.getCoverPublicId());
        existingProject.setCoverDisplayMode(updatedProject.getCoverDisplayMode());
        existingProject.setCoverPositionX(updatedProject.getCoverPositionX());
        existingProject.setCoverPositionY(updatedProject.getCoverPositionY());
        existingProject.setImages(updatedProject.getImages());
        existingProject.setImagesPublicIds(updatedProject.getImagesPublicIds());
        existingProject.setGalleryImagesJson(updatedProject.getGalleryImagesJson());
        existingProject.setGalleryShowThumbnails(updatedProject.getGalleryShowThumbnails());
        existingProject.setGalleryAutoScroll(updatedProject.getGalleryAutoScroll());
        existingProject.setVideoUrl(updatedProject.getVideoUrl());
        existingProject.setVideoPublicId(updatedProject.getVideoPublicId());
        existingProject.setAudioUrl(updatedProject.getAudioUrl());
        existingProject.setAudioPublicId(updatedProject.getAudioPublicId());
        existingProject.setPdfUrl(updatedProject.getPdfUrl());
        existingProject.setPdfPublicId(updatedProject.getPdfPublicId());
        existingProject.setCodeContent(updatedProject.getCodeContent());
        existingProject.setLiveUrl(updatedProject.getLiveUrl());
        existingProject.setGithubUrl(updatedProject.getGithubUrl());
        existingProject.setExternalUrl(updatedProject.getExternalUrl());
        existingProject.setTags(updatedProject.getTags());
        existingProject.setLikes(updatedProject.getLikes());
        existingProject.setViews(updatedProject.getViews());
        existingProject.setPinned(updatedProject.getPinned());
        existingProject.setTypes(updatedProject.getTypes());

        syncTags(updatedProject.getTags());

        return projectRepository.save(existingProject);
    }

    @PutMapping("/api/projects/{id}/view")
    public Project incrementProjectView(@PathVariable("id") Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        Integer currentViews = project.getViews();

        if (currentViews == null) {
            currentViews = 0;
        }

        project.setViews(currentViews + 1);

        return projectRepository.save(project);
    }

    @PutMapping("/api/projects/{id}/like")
    public Project incrementProjectLike(@PathVariable("id") Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        Integer currentLikes = project.getLikes();

        if (currentLikes == null) {
            currentLikes = 0;
        }

        project.setLikes(currentLikes + 1);

        return projectRepository.save(project);
    }

    @DeleteMapping("/api/projects/{id}")
    @Transactional
    public ResponseEntity<Void> deleteProject(@PathVariable("id") Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        try {
            // prefer public ids when available
            if (project.getCoverPublicId() != null && !project.getCoverPublicId().isBlank()) {
                deleteCloudinaryAssetById(project.getCoverPublicId(), "image");
            } else {
                deleteCloudinaryAsset(project.getCover(), "image");
            }

            if (project.getImagesPublicIds() != null && !project.getImagesPublicIds().isEmpty()) {
                for (String publicId : project.getImagesPublicIds()) {
                    deleteCloudinaryAssetById(publicId, "image");
                }
            } else if (project.getImages() != null) {
                for (String imageUrl : project.getImages()) {
                    deleteCloudinaryAsset(imageUrl, "image");
                }
            }

            if (project.getVideoPublicId() != null && !project.getVideoPublicId().isBlank()) {
                deleteCloudinaryAssetById(project.getVideoPublicId(), "video");
            } else {
                deleteCloudinaryAsset(project.getVideoUrl(), "video");
            }

            if (project.getPdfPublicId() != null && !project.getPdfPublicId().isBlank()) {
                deleteCloudinaryAssetById(project.getPdfPublicId(), "image");
            } else {
                deleteCloudinaryAsset(project.getPdfUrl(), "image");
            }

            deleteContentAssets(project.getContent());
        } catch (Exception error) {
            System.out.println("Project asset cleanup failed for id: " + id);
            error.printStackTrace();
        }

        projectRepository.delete(project);
        return ResponseEntity.noContent().build();
    }

    private void deleteCloudinaryAsset(String assetUrl, String resourceType) {
        try {
            String publicId = extractPublicId(assetUrl);

            if (publicId == null) return;

            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("resource_type", resourceType)
            );
        } catch (Exception error) {
            System.out.println("Failed to delete Cloudinary " + resourceType + ": " + assetUrl);
            error.printStackTrace();
        }
    }

    private void deleteCloudinaryAssetById(String publicId, String resourceType) {
        try {
            if (publicId == null || publicId.isBlank()) return;

            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("resource_type", resourceType)
            );
        } catch (Exception error) {
            System.out.println("Failed to delete Cloudinary by id: " + publicId);
            error.printStackTrace();
        }
    }

    private void deleteContentAssets(String contentJson) {
        if (contentJson == null || contentJson.isBlank()) return;

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode blocks = mapper.readTree(contentJson);

            for (JsonNode block : blocks) {
                String type = block.path("type").asText();

                if ("image".equals(type)) {
                    // prefer block publicId when present
                    if (block.has("publicId") && !block.path("publicId").asText().isBlank()) {
                        deleteCloudinaryAssetById(block.path("publicId").asText(), "image");
                    } else {
                        deleteCloudinaryAsset(block.path("url").asText(), "image");
                    }
                }

                if ("video".equals(type)) {
                    if (block.has("publicId") && !block.path("publicId").asText().isBlank()) {
                        deleteCloudinaryAssetById(block.path("publicId").asText(), "video");
                    } else {
                        deleteCloudinaryAsset(block.path("url").asText(), "video");
                    }
                }

                if ("mediaText".equals(type)) {
                    String mediaType = block.path("mediaType").asText("image");

                    if (block.has("publicId") && !block.path("publicId").asText().isBlank()) {
                        deleteCloudinaryAssetById(block.path("publicId").asText(), mediaType);
                    } else {
                        deleteCloudinaryAsset(block.path("imageUrl").asText(), mediaType);
                    }

                    if (block.has("publicIdRight") && !block.path("publicIdRight").asText().isBlank()) {
                        deleteCloudinaryAssetById(block.path("publicIdRight").asText(), "image");
                    } else {
                        deleteCloudinaryAsset(block.path("imageUrlRight").asText(), "image");
                    }
                }
            }
        } catch (Exception error) {
            System.out.println("Failed parsing content blocks");
            error.printStackTrace();
        }
    }

    private void deleteRemovedAssets(Project existingProject, Project updatedProject) {
        deleteRemovedAsset(existingProject.getCover(), updatedProject.getCover(), "image");
        deleteRemovedAsset(existingProject.getVideoUrl(), updatedProject.getVideoUrl(), "video");
        deleteRemovedAsset(existingProject.getPdfUrl(), updatedProject.getPdfUrl(), "image");

        deleteRemovedListAssets(existingProject.getImages(), updatedProject.getImages(), "image");
        deleteRemovedContentAssets(existingProject.getContent(), updatedProject.getContent());
    }

    private void deleteRemovedAsset(String existingUrl, String updatedUrl, String resourceType) {
        if (existingUrl == null || existingUrl.isBlank()) return;
        if (existingUrl.equals(updatedUrl)) return;

        deleteCloudinaryAsset(existingUrl, resourceType);
    }

    private void deleteRemovedListAssets(
            List<String> existingUrls,
            List<String> updatedUrls,
            String resourceType
    ) {
        if (existingUrls == null || existingUrls.isEmpty()) return;

        Set<String> updatedUrlSet = new HashSet<>();

        if (updatedUrls != null) {
            updatedUrlSet.addAll(updatedUrls);
        }

        for (String existingUrl : existingUrls) {
            if (existingUrl == null || existingUrl.isBlank()) continue;
            if (updatedUrlSet.contains(existingUrl)) continue;

            deleteCloudinaryAsset(existingUrl, resourceType);
        }
    }

    private void deleteRemovedContentAssets(String existingContentJson, String updatedContentJson) {
        List<CloudinaryAssetRef> existingAssets = extractContentAssets(existingContentJson);
        List<CloudinaryAssetRef> updatedAssets = extractContentAssets(updatedContentJson);

        Set<String> updatedKeys = new HashSet<>();

        for (CloudinaryAssetRef asset : updatedAssets) {
            updatedKeys.add(asset.key());
        }

        for (CloudinaryAssetRef asset : existingAssets) {
            if (updatedKeys.contains(asset.key())) continue;

            if (asset.publicId() != null && !asset.publicId().isBlank()) {
                deleteCloudinaryAssetById(asset.publicId(), asset.resourceType());
            } else {
                deleteCloudinaryAsset(asset.url(), asset.resourceType());
            }
        }
    }

    private List<CloudinaryAssetRef> extractContentAssets(String contentJson) {
        List<CloudinaryAssetRef> assets = new ArrayList<>();

        if (contentJson == null || contentJson.isBlank()) {
            return assets;
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode blocks = mapper.readTree(contentJson);

            for (JsonNode block : blocks) {
                String type = block.path("type").asText();

                if ("image".equals(type)) {
                    addAssetRef(
                            assets,
                            block.path("url").asText(),
                            block.path("publicId").asText(null),
                            "image"
                    );
                }

                if ("video".equals(type)) {
                    addAssetRef(
                            assets,
                            block.path("url").asText(),
                            block.path("publicId").asText(null),
                            "video"
                    );
                }

                if ("mediaText".equals(type)) {
                    String mediaType = block.path("mediaType").asText("image");

                    addAssetRef(
                            assets,
                            block.path("imageUrl").asText(),
                            block.path("publicId").asText(null),
                            mediaType
                    );
                    addAssetRef(
                            assets,
                            block.path("imageUrlRight").asText(),
                            block.path("publicIdRight").asText(null),
                            "image"
                    );
                }
            }
        } catch (Exception error) {
            System.out.println("Failed parsing content blocks");
            error.printStackTrace();
        }

        return assets;
    }

    private void addAssetRef(
            List<CloudinaryAssetRef> assets,
            String url,
            String publicId,
            String resourceType
    ) {
        if ((url == null || url.isBlank()) && (publicId == null || publicId.isBlank())) return;

        assets.add(new CloudinaryAssetRef(url, publicId, resourceType));
    }

    private record CloudinaryAssetRef(String url, String publicId, String resourceType) {
        private String key() {
            if (publicId != null && !publicId.isBlank()) {
                return resourceType + "::id::" + publicId;
            }

            return resourceType + "::url::" + url;
        }
    }

    private String extractPublicId(String url) {
        if (url == null || !url.contains("/upload/")) {
            return null;
        }

        try {
            String path = url.split("/upload/")[1];

            path = path.replaceFirst("v\\d+/", "");

            int extensionIndex = path.lastIndexOf(".");

            if (extensionIndex != -1) {
                path = path.substring(0, extensionIndex);
            }

            return path;

        } catch (Exception e) {
            return null;
        }
    }

    private void syncTags(List<String> tags) {
        if (tags == null) return;

        for (String tagName : tags) {
            if (tagName == null || tagName.trim().isEmpty()) continue;

            String normalized = tagName.trim().toLowerCase();
            boolean exists = tagRepository.findByName(normalized).isPresent();

            if (!exists) continue;
        }
    }
}
