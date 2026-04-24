package com.jeshurun.portfolio.controller;

import com.jeshurun.portfolio.entity.Project;
import com.jeshurun.portfolio.entity.Tag;
import com.jeshurun.portfolio.repository.ProjectRepository;
import com.jeshurun.portfolio.repository.TagRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class TagController {

    private final TagRepository tagRepository;
    private final ProjectRepository projectRepository;

    public TagController(TagRepository tagRepository, ProjectRepository projectRepository) {
        this.tagRepository = tagRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/api/tags")
    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }

    @PostMapping("/api/tags")
    public Tag createTag(@RequestBody Tag tag) {
        tag.setName(tag.getName().trim().toLowerCase());
        return tagRepository.save(tag);
    }

    @Transactional
@PutMapping("/api/tags/{id}")
public Tag updateTag(@PathVariable Long id, @RequestBody Tag updatedTag) {
    Tag existingTag = tagRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));

    String oldName = existingTag.getName().trim().toLowerCase();
    String newName = updatedTag.getName().trim().toLowerCase();

    existingTag.setName(newName);
    Tag savedTag = tagRepository.save(existingTag);

    List<Project> projects = projectRepository.findAll();

    for (Project project : projects) {
        if (project.getTags() == null) {
            continue;
        }

        List<String> updatedTags = project.getTags().stream()
                .map(tag -> {
                    String normalizedProjectTag = tag.trim().toLowerCase();

                    if (normalizedProjectTag.equals(oldName)) {
                        return newName;
                    }

                    return normalizedProjectTag;
                })
                .distinct()
                .collect(Collectors.toList());

        project.setTags(updatedTags);
        projectRepository.save(project);
    }

    return savedTag;
}

    @Transactional
@DeleteMapping("/api/tags/{id}")
public void deleteTag(@PathVariable Long id) {
    Tag existingTag = tagRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));

    String tagName = existingTag.getName().trim().toLowerCase();

    List<Project> projects = projectRepository.findAll();

    for (Project project : projects) {
        if (project.getTags() == null) {
            continue;
        }

        List<String> updatedTags = project.getTags().stream()
                .map(tag -> tag.trim().toLowerCase())
                .filter(tag -> !tag.equals(tagName))
                .distinct()
                .collect(Collectors.toList());

        project.setTags(updatedTags);
        projectRepository.save(project);
    }

    tagRepository.deleteById(id);
}
}