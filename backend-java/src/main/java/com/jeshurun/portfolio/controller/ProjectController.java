package com.jeshurun.portfolio.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.jeshurun.portfolio.entity.Project;
import com.jeshurun.portfolio.repository.ProjectRepository;
import com.jeshurun.portfolio.repository.TagRepository;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

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

        existingProject.setTitle(updatedProject.getTitle());
        existingProject.setCategory(updatedProject.getCategory());
        existingProject.setDescription(updatedProject.getDescription());
        existingProject.setContent(updatedProject.getContent());
        existingProject.setCover(updatedProject.getCover());
        existingProject.setImages(updatedProject.getImages());
        existingProject.setVideoUrl(updatedProject.getVideoUrl());
        existingProject.setAudioUrl(updatedProject.getAudioUrl());
        existingProject.setPdfUrl(updatedProject.getPdfUrl());
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
    public void deleteProject(@PathVariable("id") Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        deleteCloudinaryImage(project.getCover());

        if (project.getImages() != null) {
            for (String imageUrl : project.getImages()) {
                deleteCloudinaryImage(imageUrl);
            }
        }

        deleteContentImages(project.getContent());
        projectRepository.deleteById(id);
    }

    private void deleteCloudinaryImage(String imageUrl) {
        try {
            String publicId = extractPublicId(imageUrl);

            if (publicId == null) return;

            cloudinary.uploader().destroy(
    publicId,
    ObjectUtils.asMap(
        "resource_type", "image"
    )
);
        } catch (Exception error) {
            System.out.println("Failed to delete Cloudinary image: " + imageUrl);
            error.printStackTrace();
        }
    }

    private void deleteContentImages(String contentJson) {
    if (contentJson == null || contentJson.isBlank()) return;

    try {
        ObjectMapper mapper = new ObjectMapper();

        JsonNode blocks = mapper.readTree(contentJson);

        for (JsonNode block : blocks) {

            String type = block.path("type").asText();

            if ("image".equals(type)) {
                deleteCloudinaryImage(
                        block.path("url").asText()
                );
            }

            if ("mediaText".equals(type)) {

                deleteCloudinaryImage(
                        block.path("imageUrl").asText()
                );

                deleteCloudinaryImage(
                        block.path("imageUrlRight").asText()
                );
            }
        }

    } catch (Exception error) {
        System.out.println("Failed parsing content blocks");
        error.printStackTrace();
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
