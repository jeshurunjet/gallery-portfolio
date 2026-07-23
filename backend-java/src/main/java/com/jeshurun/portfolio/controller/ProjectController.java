package com.jeshurun.portfolio.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.jeshurun.portfolio.entity.Project;
import com.jeshurun.portfolio.repository.ProjectRepository;
import com.jeshurun.portfolio.repository.TagRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://www.jesh.nz",
        "https://jesh.nz",
        "https://gallery-portfolio-orpin.vercel.app"
})
@RestController
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final TagRepository tagRepository;
    private final Cloudinary cloudinary;
    private final ObjectMapper objectMapper;

    public ProjectController(
            ProjectRepository projectRepository,
            TagRepository tagRepository,
            Cloudinary cloudinary,
            ObjectMapper objectMapper
    ) {
        this.projectRepository = projectRepository;
        this.tagRepository = tagRepository;
        this.cloudinary = cloudinary;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/api/projects")
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @PostMapping("/api/projects")
    public Project createProject(@RequestBody Project project) {
        if (project.getContentJson() == null || project.getContentJson().isBlank()) {
            project.setContentJson("{\"type\":\"doc\",\"content\":[]}");
        }
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
        existingProject.setVideosJson(updatedProject.getVideosJson());
        existingProject.setAudiosJson(updatedProject.getAudiosJson());
        existingProject.setPdfsJson(updatedProject.getPdfsJson());
        existingProject.setCodeContent(updatedProject.getCodeContent());
        existingProject.setLiveUrl(updatedProject.getLiveUrl());
        existingProject.setGithubUrl(updatedProject.getGithubUrl());
        existingProject.setExternalUrl(updatedProject.getExternalUrl());
        existingProject.setTags(updatedProject.getTags());
        existingProject.setLikes(updatedProject.getLikes());
        existingProject.setViews(updatedProject.getViews());
        existingProject.setPinned(updatedProject.getPinned());
        existingProject.setTypes(updatedProject.getTypes());
        existingProject.setContentJson(updatedProject.getContentJson());

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

            deleteMediaAssets(project.getVideosJson(), "video");
            deleteMediaAssets(project.getAudiosJson(), "video");
            deleteMediaAssets(project.getPdfsJson(), "image");

            deleteContentAssets(project.getContentJson());
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
            JsonNode root = objectMapper.readTree(contentJson);

            for (CloudinaryAssetRef asset : extractContentAssets(root)) {
                if (asset.publicId() != null && !asset.publicId().isBlank()) {
                    deleteCloudinaryAssetById(asset.publicId(), asset.resourceType());
                } else {
                    deleteCloudinaryAsset(asset.url(), asset.resourceType());
                }
            }
        } catch (Exception error) {
            System.out.println("Failed parsing content blocks");
            error.printStackTrace();
        }
    }

    private void deleteMediaAssets(String mediaJson, String resourceType) {
        for (CloudinaryAssetRef asset : extractMediaAssets(mediaJson, resourceType)) {
            if (asset.publicId() != null && !asset.publicId().isBlank()) {
                deleteCloudinaryAssetById(asset.publicId(), asset.resourceType());
            } else {
                deleteCloudinaryAsset(asset.url(), asset.resourceType());
            }
        }
    }

    private void deleteRemovedAssets(Project existingProject, Project updatedProject) {
        deleteRemovedAsset(existingProject.getCover(), updatedProject.getCover(), "image");
        deleteRemovedMediaAssets(existingProject.getVideosJson(), updatedProject.getVideosJson(), "video");
        deleteRemovedMediaAssets(existingProject.getAudiosJson(), updatedProject.getAudiosJson(), "video");
        deleteRemovedMediaAssets(existingProject.getPdfsJson(), updatedProject.getPdfsJson(), "image");

        deleteRemovedListAssets(existingProject.getImages(), updatedProject.getImages(), "image");
        deleteRemovedContentAssets(existingProject.getContentJson(), updatedProject.getContentJson());
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

    private void deleteRemovedMediaAssets(
            String existingMediaJson,
            String updatedMediaJson,
            String resourceType
    ) {
        List<CloudinaryAssetRef> existingAssets = extractMediaAssets(existingMediaJson, resourceType);
        List<CloudinaryAssetRef> updatedAssets = extractMediaAssets(updatedMediaJson, resourceType);

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

    private List<CloudinaryAssetRef> extractMediaAssets(String mediaJson, String resourceType) {
        List<CloudinaryAssetRef> assets = new ArrayList<>();

        if (mediaJson == null || mediaJson.isBlank()) {
            return assets;
        }

        try {
            JsonNode items = objectMapper.readTree(mediaJson);

            if (!items.isArray()) {
                return assets;
            }

            for (JsonNode item : items) {
                addAssetRef(
                        assets,
                        item.path("url").asString(),
                        item.path("publicId").asString(null),
                        resourceType
                );
            }
        } catch (Exception error) {
            System.out.println("Failed parsing media items");
            error.printStackTrace();
        }

        return assets;
    }

    private List<CloudinaryAssetRef> extractContentAssets(String contentJson) {
        List<CloudinaryAssetRef> assets = new ArrayList<>();

        if (contentJson == null || contentJson.isBlank()) {
            return assets;
        }

        try {
            JsonNode root = objectMapper.readTree(contentJson);
            assets.addAll(extractContentAssets(root));
        } catch (Exception error) {
            System.out.println("Failed parsing content blocks");
            error.printStackTrace();
        }

        return assets;
    }

    private List<CloudinaryAssetRef> extractContentAssets(JsonNode node) {
        List<CloudinaryAssetRef> assets = new ArrayList<>();

        if (node == null || node.isMissingNode()) {
            return assets;
        }

        String type = node.path("type").asString();
        JsonNode attrs = node.path("attrs");

        if ("image".equals(type)) {
            addAssetRef(
                    assets,
                    attrs.path("src").asString(),
                    attrs.path("publicId").asString(null),
                    "image"
            );
        }

        if ("projectVideo".equals(type)) {
            addAssetRef(
                    assets,
                    attrs.path("url").asString(),
                    attrs.path("publicId").asString(null),
                    "video"
            );
        }

        if ("mediaText".equals(type)) {
            String mediaType = attrs.path("mediaType").asString("image");

            addAssetRef(
                    assets,
                    attrs.path("imageUrl").asString(),
                    attrs.path("publicId").asString(null),
                    mediaType
            );
            addAssetRef(
                    assets,
                    attrs.path("imageUrlRight").asString(),
                    attrs.path("publicIdRight").asString(null),
                    "image"
            );
        }

        if (node.path("content").isArray()) {
            for (JsonNode child : node.path("content")) {
                assets.addAll(extractContentAssets(child));
            }
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
