package com.votaciones.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class VotoController {
    @GetMapping("/votar")
    public String votar() {
        return "voto/votar-form";
    }
}