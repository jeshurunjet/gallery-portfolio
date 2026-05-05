package com.jeshurun.portfolio.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.jeshurun.portfolio.entity.Project;
import com.jeshurun.portfolio.repository.ProjectRepository;
import com.jeshurun.portfolio.repository.TagRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
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

        projectRepository.deleteById(id);
    }

    private void deleteCloudinaryImage(String imageUrl) {
        try {
            String publicId = extractPublicId(imageUrl);

            if (publicId == null) return;

            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception error) {
            System.out.println("Failed to delete Cloudinary image: " + imageUrl);
            error.printStackTrace();
        }
    }

    private String extractPublicId(String url) {
        if (url == null || !url.contains("/upload/")) return null;

        String[] parts = url.split("/upload/");
        if (parts.length < 2) return null;

        String path = parts[1];

        if (path.startsWith("v")) {
            int slashIndex = path.indexOf("/");
            if (slashIndex != -1) {
                path = path.substring(slashIndex + 1);
            }
        }

        int dotIndex = path.lastIndexOf(".");
        if (dotIndex == -1) return path;

        return path.substring(0, dotIndex);
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