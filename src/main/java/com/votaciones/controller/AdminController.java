package com.votaciones.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@org.springframework.context.annotation.Profile("!view")
public class AdminController {

        @GetMapping
        public String home() {
            return "redirect:/admin/partidos";
        }
        @GetMapping("/admin/partidos")
        public String verPartidos() {
            return "admin/partidos-list";
        }

        @GetMapping("/admin/candidatos")
        public String verCandidatos() {
            return "admin/candidatos-list";
        }

        @GetMapping("/admin/circunscripciones")
        public String verCircunscripciones() {
            return "admin/circuns-list";
        }

        @GetMapping("/admin/elecciones/nueva")
        public String programarEleccion() {
            return "admin/elecciones-form";
        }

        @GetMapping("/admin/electores/upload-csv")
        public String subirElectoresCsv() {
            return "admin/electores-upload";
        }

        @GetMapping("/votar")
        public String votar() {
            return "voto/votar-form";
        }

}
