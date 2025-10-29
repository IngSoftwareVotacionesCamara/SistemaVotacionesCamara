package com.votaciones.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.util.unit.DataSize;

import jakarta.servlet.MultipartConfigElement;

@Configuration
public class WebConfig {
    @Bean
    public MultipartConfigElement multipartConfigElement(){
        MultipartConfigFactory f = new MultipartConfigFactory();
        f.setMaxFileSize(DataSize.ofMegabytes(50));
        f.setMaxRequestSize(DataSize.ofMegabytes(50));
        return f.createMultipartConfig();
    }
}
