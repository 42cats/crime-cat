package com.crimecat.backend.notification.config;

import com.crimecat.backend.notification.template.impl.GameRecordRequestTemplate;
import com.crimecat.backend.notification.template.HandlebarsMessageRenderer;
import com.crimecat.backend.notification.template.TemplateRegistry;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

@Configuration
@Slf4j
public class NotificationTemplateConfiguration {
    
    private final TemplateRegistry templateRegistry;
    private final HandlebarsMessageRenderer handlebarsMessageRenderer;
    
    public NotificationTemplateConfiguration(TemplateRegistry templateRegistry, HandlebarsMessageRenderer handlebarsMessageRenderer) {
        this.templateRegistry = templateRegistry;
        this.handlebarsMessageRenderer = handlebarsMessageRenderer;
    }
    
    @PostConstruct
    public void registerTemplates() {
        log.info("PostConstruct: Manually registering GameRecordRequestTemplate with Handlebars");
        GameRecordRequestTemplate template = new GameRecordRequestTemplate(handlebarsMessageRenderer);
        templateRegistry.registerTemplate(template.getNotificationType(), template);
        log.info("Registered GameRecordRequestTemplate. Current registered types: {}", templateRegistry.getRegisteredTypes());
    }
    
    @Bean
    @DependsOn("gameRecordRequestTemplate")
    public Object templateRegistryDebugger(TemplateRegistry templateRegistry) {
        log.info("TemplateRegistry debugger - checking registered templates");
        log.info("Registered template types: {}", templateRegistry.getRegisteredTypes());
        return new Object();
    }
}
