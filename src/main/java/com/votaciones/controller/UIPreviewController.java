package com.votaciones.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@org.springframework.context.annotation.Profile("view")
@Controller
public class UIPreviewController {
    @GetMapping("/ping") public String ping(){ return "ping"; }
    @GetMapping("/admin/partidos")
    public String partidos() { return "admin/partidos-list"; }

    @GetMapping("/admin/candidatos")
    public String candidatos() { return "admin/candidatos-list"; }

    @GetMapping("/admin/circunscripciones")
    public String circuns() { return "admin/circuns-list"; }

    @GetMapping("/admin/elecciones/nueva")
    public String elecciones() { return "admin/elecciones-form"; }

    @GetMapping("/admin/electores/upload-csv")
    public String electoresCsv() { return "admin/electores-upload"; }

    @GetMapping("/votar")
    public String votar() { return "voto/votar-form"; }
}
