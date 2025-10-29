package com.votaciones.web.admin;


import com.votaciones.service.CircunscripcionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/circunscripciones")
@RequiredArgsConstructor
public class CircunscripcionController {

    private final CircunscripcionService service;

    @GetMapping
    public String listar(org.springframework.ui.Model model) {
        model.addAttribute("circunscripciones", service.listar());
        return "admin/circunscripciones-list";
    }

    @PostMapping("/upload-csv")
    public String uploadCsv(@RequestParam("file") MultipartFile file, RedirectAttributes ra) {
        try {
            int n = service.importarCsv(file);
            ra.addFlashAttribute("ok", "Se importaron " + n + " circunscripciones correctamente.");
        } catch (Exception e) {
            ra.addFlashAttribute("error", "Error al importar: " + e.getMessage());
        }
        return "redirect:/admin/circunscripciones";
    }
}