package com.votaciones.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @GetMapping
    public String dashboard() {
        return "admin/dashboard";
    }

    @GetMapping("/partidos")
    public String verPartidos() {
        return "admin/partidos-list";
    }

    @GetMapping("/candidatos")
    public String verCandidatos() {
        return "admin/candidatos-list";
    }

    @GetMapping("/circunscripciones")
    public String verCircunscripciones() {
        return "admin/circuns-list";
    }

    @GetMapping("/elecciones/nueva")
    public String programarEleccion() {
        return "admin/elecciones-form";
    }

    @GetMapping("/electores/upload-csv")
    public String subirElectoresCsv() {
        return "admin/electores-upload";
    }
}
