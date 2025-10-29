package com.votaciones.web.voto;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/votar")
public class VotoController {

    @GetMapping
    public String votar() {
        return "voto/votar-form";
    }
}