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
    /*    private final VotoService service;

    public VotoController(VotoService s){ this.service=s; }

    @GetMapping
    public String form(Model model){
        model.addAttribute("templates/voto", new VotoDTO()); // contiene cod_partido, codigo_dane, cod_cir
        return "templates/voto/votar-form";
    }

    @PostMapping
    public String registrar(@ModelAttribute @Valid VotoDTO dto, BindingResult br, RedirectAttributes ra){
        if (br.hasErrors()) return "templates/voto/votar-form";
        service.registrar(dto); // guarda VOTO y reglas que definas
        ra.addFlashAttribute("ok","Voto registrado con éxito.");
        return "redirect:/votar/ok";
    }

    @GetMapping("/ok")
    public String ok(){ return "templates/voto/votar-ok"; }*/
}