package com.jeshurun.portfolio.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.*;

@Component
public class ProjectContentMigrationService {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ProjectContentMigrationService(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void migrateLegacyProjectContent() {
        try {
            Set<String> columns = getProjectColumns();

            if (!columns.contains("id") || !columns.contains("content_json")) {
                return;
            }

            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM project");

            for (Map<String, Object> row : rows) {
                Number id = (Number) row.get("id");
                if (id == null) {
                    continue;
                }

                String legacyDescription = readString(row, "description");
                String legacyDescriptionJson = readString(row, "description_json");
                String legacyContent = readString(row, "content");
                String existingContentJson = readString(row, "content_json");

                String mergedContentJson = mergeLegacyContent(
                        existingContentJson,
                        legacyContent,
                        legacyDescription,
                        legacyDescriptionJson
                );

                if (mergedContentJson == null) {
                    continue;
                }

                List<Object> params = new ArrayList<>();
                StringBuilder sql = new StringBuilder("UPDATE project SET content_json = ?");
                params.add(mergedContentJson);

                if (columns.contains("description")) {
                    sql.append(", description = NULL");
                }
                if (columns.contains("description_json")) {
                    sql.append(", description_json = NULL");
                }
                if (columns.contains("content")) {
                    sql.append(", content = NULL");
                }

                sql.append(" WHERE id = ?");
                params.add(id.longValue());
                jdbcTemplate.update(sql.toString(), params.toArray());
            }
        } catch (Exception exception) {
            System.out.println("Project content migration skipped: " + exception.getMessage());
        }
    }

    private Set<String> getProjectColumns() throws Exception {
        Set<String> columns = new HashSet<>();

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();

            for (String tableName : List.of("project", "PROJECT")) {
                try (ResultSet resultSet = metaData.getColumns(null, null, tableName, null)) {
                    while (resultSet.next()) {
                        columns.add(resultSet.getString("COLUMN_NAME").toLowerCase(Locale.ROOT));
                    }
                }

                if (!columns.isEmpty()) {
                    break;
                }
            }
        }

        return columns;
    }

    private String mergeLegacyContent(
            String contentJson,
            String legacyContent,
            String legacyDescription,
            String legacyDescriptionJson
    ) throws Exception {
        ArrayNode mainContent = extractDocContent(contentJson);
        ArrayNode legacyBlocks = extractLegacyBlocks(legacyContent);
        ArrayNode descriptionContent = extractDescriptionContent(legacyDescriptionJson, legacyDescription);

        if (mainContent.isEmpty() && legacyBlocks.isEmpty() && descriptionContent.isEmpty()) {
            return isBlank(contentJson) ? null : contentJson;
        }

        ObjectNode document = objectMapper.createObjectNode();
        ArrayNode merged = objectMapper.createArrayNode();

        descriptionContent.forEach((node) -> merged.add(node.deepCopy()));

        if (!mainContent.isEmpty()) {
          mainContent.forEach((node) -> merged.add(node.deepCopy()));
        } else {
          legacyBlocks.forEach((node) -> merged.add(node.deepCopy()));
        }

        document.put("type", "doc");
        document.set("content", merged);
        return objectMapper.writeValueAsString(document);
    }

    private ArrayNode extractDocContent(String rawJson) throws Exception {
        ArrayNode empty = objectMapper.createArrayNode();

        if (isBlank(rawJson)) {
            return empty;
        }

        JsonNode root = objectMapper.readTree(rawJson);

        if (!root.isObject() || !"doc".equals(root.path("type").asText()) || !root.path("content").isArray()) {
            return empty;
        }

        return (ArrayNode) root.path("content");
    }

    private ArrayNode extractDescriptionContent(String descriptionJson, String description) throws Exception {
        ArrayNode richDescription = extractDocContent(descriptionJson);

        if (!richDescription.isEmpty()) {
            return richDescription;
        }

        if (isBlank(description)) {
            return objectMapper.createArrayNode();
        }

        return paragraphsFromPlainText(description, null);
    }

    private ArrayNode extractLegacyBlocks(String legacyContent) throws Exception {
        ArrayNode result = objectMapper.createArrayNode();

        if (isBlank(legacyContent)) {
            return result;
        }

        JsonNode blocks = objectMapper.readTree(legacyContent);
        if (!blocks.isArray()) {
            return result;
        }

        for (JsonNode block : blocks) {
            String type = block.path("type").asText();

            switch (type) {
                case "heading" -> result.add(headingNode(2, block.path("text").asText("")));
                case "subheading" -> result.add(headingNode(3, block.path("text").asText("")));
                case "paragraph" -> paragraphsFromPlainText(
                        block.path("text").asText(""),
                        emptyToNull(block.path("align").asText())
                ).forEach(result::add);
                case "quote" -> result.add(blockquoteNode(block.path("text").asText("")));
                case "image" -> result.add(imageNode(
                        block.path("url").asText(""),
                        block.path("alt").asText(""),
                        block.path("caption").asText(""),
                        emptyToNull(block.path("publicId").asText())
                ));
                case "video" -> result.add(videoNode(
                        block.path("url").asText(""),
                        block.path("caption").asText(""),
                        emptyToNull(block.path("publicId").asText())
                ));
                case "list" -> result.add(bulletListNode(block.path("items")));
                case "divider" -> result.add(simpleNode("horizontalRule"));
                case "twoColumn" -> result.add(twoColumnNode(block));
                case "mediaText" -> result.add(mediaTextNode(block));
                case "references" -> result.add(referencesNode(block.path("items")));
                default -> {
                }
            }
        }

        return result;
    }

    private ObjectNode headingNode(int level, String text) {
        ObjectNode node = simpleNode("heading");
        ObjectNode attrs = objectMapper.createObjectNode();
        attrs.put("level", level);
        node.set("attrs", attrs);
        node.set("content", inlineTextContent(text));
        return node;
    }

    private ObjectNode blockquoteNode(String text) {
        ObjectNode node = simpleNode("blockquote");
        ArrayNode content = objectMapper.createArrayNode();
        content.add(paragraphNode(text, null));
        node.set("content", content);
        return node;
    }

    private ObjectNode imageNode(String url, String alt, String caption, String publicId) {
        ObjectNode node = simpleNode("image");
        ObjectNode attrs = objectMapper.createObjectNode();
        attrs.put("src", url);
        attrs.put("alt", alt);
        attrs.put("caption", caption == null ? "" : caption);
        if (publicId == null) {
            attrs.putNull("publicId");
        } else {
            attrs.put("publicId", publicId);
        }
        node.set("attrs", attrs);
        return node;
    }

    private ObjectNode videoNode(String url, String caption, String publicId) {
        ObjectNode node = simpleNode("projectVideo");
        ObjectNode attrs = objectMapper.createObjectNode();
        attrs.put("url", url);
        attrs.put("caption", caption == null ? "" : caption);
        if (publicId == null) {
            attrs.putNull("publicId");
        } else {
            attrs.put("publicId", publicId);
        }
        node.set("attrs", attrs);
        return node;
    }

    private ObjectNode bulletListNode(JsonNode items) {
        ObjectNode node = simpleNode("bulletList");
        ArrayNode content = objectMapper.createArrayNode();

        if (items.isArray()) {
            items.forEach((item) -> {
                ObjectNode listItem = simpleNode("listItem");
                ArrayNode listContent = objectMapper.createArrayNode();
                listContent.add(paragraphNode(item.asText(""), null));
                listItem.set("content", listContent);
                content.add(listItem);
            });
        }

        node.set("content", content);
        return node;
    }

    private ObjectNode twoColumnNode(JsonNode block) {
        ObjectNode node = simpleNode("twoColumn");
        ObjectNode attrs = objectMapper.createObjectNode();
        attrs.put("left", block.path("left").asText(""));
        attrs.put("right", block.path("right").asText(""));
        attrs.put("align", defaultAlign(block.path("align").asText()));
        node.set("attrs", attrs);
        return node;
    }

    private ObjectNode mediaTextNode(JsonNode block) {
        ObjectNode node = simpleNode("mediaText");
        ObjectNode attrs = objectMapper.createObjectNode();
        attrs.put("layout", block.path("layout").asText("image-left"));
        attrs.put("mediaType", block.path("mediaType").asText("image"));
        attrs.put("text", block.path("text").asText(""));
        attrs.put("imageUrl", block.path("imageUrl").asText(""));
        attrs.put("imageAlt", block.path("imageAlt").asText(""));
        attrs.put("imageUrlRight", block.path("imageUrlRight").asText(""));
        attrs.put("imageAltRight", block.path("imageAltRight").asText(""));
        attrs.put("align", defaultAlign(block.path("align").asText()));

        if (isBlank(block.path("publicId").asText())) {
            attrs.putNull("publicId");
        } else {
            attrs.put("publicId", block.path("publicId").asText());
        }

        if (isBlank(block.path("publicIdRight").asText())) {
            attrs.putNull("publicIdRight");
        } else {
            attrs.put("publicIdRight", block.path("publicIdRight").asText());
        }

        node.set("attrs", attrs);
        return node;
    }

    private ObjectNode referencesNode(JsonNode items) {
        ObjectNode node = simpleNode("references");
        ObjectNode attrs = objectMapper.createObjectNode();
        ArrayNode normalizedItems = objectMapper.createArrayNode();

        if (items.isArray()) {
            items.forEach((item) -> {
                ObjectNode normalized = objectMapper.createObjectNode();
                normalized.put("label", item.path("label").asText(""));
                normalized.put("value", item.path("value").asText(""));
                normalizedItems.add(normalized);
            });
        }

        attrs.set("items", normalizedItems);
        node.set("attrs", attrs);
        return node;
    }

    private ArrayNode paragraphsFromPlainText(String text, String align) {
        ArrayNode nodes = objectMapper.createArrayNode();
        List<String> bulletItems = new ArrayList<>();
        List<String> orderedItems = new ArrayList<>();

        for (String line : text.split("\n")) {
            String trimmed = line.trim();

            if (trimmed.startsWith("- ")) {
                flushOrdered(nodes, orderedItems);
                bulletItems.add(trimmed.substring(2));
                continue;
            }

            if (trimmed.matches("^\\d+\\.\\s.*")) {
                flushBullets(nodes, bulletItems);
                orderedItems.add(trimmed.replaceFirst("^\\d+\\.\\s", ""));
                continue;
            }

            flushBullets(nodes, bulletItems);
            flushOrdered(nodes, orderedItems);

            if ("---".equals(trimmed)) {
                nodes.add(simpleNode("horizontalRule"));
                continue;
            }

            nodes.add(paragraphNode(trimmed, align));
        }

        flushBullets(nodes, bulletItems);
        flushOrdered(nodes, orderedItems);
        return nodes;
    }

    private void flushBullets(ArrayNode nodes, List<String> bulletItems) {
        if (bulletItems.isEmpty()) {
            return;
        }

        ObjectNode bulletList = simpleNode("bulletList");
        ArrayNode content = objectMapper.createArrayNode();

        for (String item : bulletItems) {
            ObjectNode listItem = simpleNode("listItem");
            ArrayNode itemContent = objectMapper.createArrayNode();
            itemContent.add(paragraphNode(item, null));
            listItem.set("content", itemContent);
            content.add(listItem);
        }

        bulletList.set("content", content);
        nodes.add(bulletList);
        bulletItems.clear();
    }

    private void flushOrdered(ArrayNode nodes, List<String> orderedItems) {
        if (orderedItems.isEmpty()) {
            return;
        }

        ObjectNode orderedList = simpleNode("orderedList");
        ArrayNode content = objectMapper.createArrayNode();

        for (String item : orderedItems) {
            ObjectNode listItem = simpleNode("listItem");
            ArrayNode itemContent = objectMapper.createArrayNode();
            itemContent.add(paragraphNode(item, null));
            listItem.set("content", itemContent);
            content.add(listItem);
        }

        orderedList.set("content", content);
        nodes.add(orderedList);
        orderedItems.clear();
    }

    private ObjectNode paragraphNode(String text, String align) {
        ObjectNode node = simpleNode("paragraph");
        if (align != null && !"left".equals(align)) {
            ObjectNode attrs = objectMapper.createObjectNode();
            attrs.put("textAlign", align);
            node.set("attrs", attrs);
        }
        node.set("content", inlineTextContent(text));
        return node;
    }

    private ArrayNode inlineTextContent(String text) {
        ArrayNode content = objectMapper.createArrayNode();

        if (text == null || text.isEmpty()) {
            return content;
        }

        ObjectNode textNode = simpleNode("text");
        textNode.put("text", text);
        content.add(textNode);
        return content;
    }

    private ObjectNode simpleNode(String type) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", type);
        return node;
    }

    private String readString(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) {
            value = row.get(key.toUpperCase(Locale.ROOT));
        }
        return value instanceof String ? (String) value : null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String emptyToNull(String value) {
        return isBlank(value) ? null : value;
    }

    private String defaultAlign(String value) {
        return isBlank(value) ? "left" : value;
    }
}
