package com.votaciones.web.admin;

import com.votaciones.service.VotoService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/votar")
@org.springframework.context.annotation.Profile("!view")
public class VotoController {
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
