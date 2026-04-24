package com.jeshurun.portfolio.controller;

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

    public ProjectController(ProjectRepository projectRepository, TagRepository tagRepository) {
        this.projectRepository = projectRepository;
        this.tagRepository = tagRepository;
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
public Project updateProject(@PathVariable("id") Long id, @RequestBody Project updatedProject) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        existingProject.setTitle(updatedProject.getTitle());
        existingProject.setCategory(updatedProject.getCategory());
        existingProject.setDescription(updatedProject.getDescription());
        existingProject.setCover(updatedProject.getCover());
        existingProject.setLiveUrl(updatedProject.getLiveUrl());
        existingProject.setGithubUrl(updatedProject.getGithubUrl());
        existingProject.setExternalUrl(updatedProject.getExternalUrl());
        existingProject.setTags(updatedProject.getTags());

        syncTags(updatedProject.getTags());

        return projectRepository.save(existingProject);
    }

    @DeleteMapping("/api/projects/{id}")
    public void deleteProject(@PathVariable Long id) {
        projectRepository.deleteById(id);
    }

    private void syncTags(List<String> tags) {
        if (tags == null) return;

        for (String tagName : tags) {
            if (tagName == null || tagName.trim().isEmpty()) continue;

            String normalized = tagName.trim().toLowerCase();

            boolean exists = tagRepository.findByName(normalized).isPresent();

            if (!exists) continue; // prevent tag resurrection
        }
    }
}