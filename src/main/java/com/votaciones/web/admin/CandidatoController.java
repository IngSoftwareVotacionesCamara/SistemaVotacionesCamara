package com.votaciones.web.admin;

import com.votaciones.domain.Candidato;
import com.votaciones.service.CandidatoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;   // 👈 importante
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/candidatos")
@RequiredArgsConstructor
public class CandidatoController {

    private final CandidatoService service;

    @GetMapping
    public String listar(Model model) {
        model.addAttribute("candidatos", service.listar());
        return "admin/candidatos-list";
    }

    @GetMapping("/nuevo")
    public String nuevo(Model model) {
        model.addAttribute("titulo", "Nuevo candidato");
        model.addAttribute("candidato", new Candidato());
        return "admin/candidatos-form";
    }

    @PostMapping
    public String crear(@Valid @ModelAttribute("candidato") Candidato candidato,
                        BindingResult br,
                        RedirectAttributes ra,
                        Model model) {
        if (br.hasErrors()) {
            model.addAttribute("titulo", "Nuevo candidato");
            return "admin/candidatos-form";
        }
        service.guardar(candidato);
        ra.addFlashAttribute("ok", "Candidato creado correctamente.");
        return "redirect:/admin/candidatos";
    }

    @GetMapping("/{id}/editar")
    public String editar(@PathVariable Long id, Model model, RedirectAttributes ra) {
        var cand = service.obtener(id);
        if (cand == null) {
            ra.addFlashAttribute("error", "El candidato con id " + id + " no existe.");
            return "redirect:/admin/candidatos";
        }
        model.addAttribute("titulo", "Editar candidato");
        model.addAttribute("candidato", cand);
        return "admin/candidatos-form";
    }

    @PostMapping("/{id}")
    public String actualizar(@PathVariable Long id,
                             @Valid @ModelAttribute("candidato") Candidato candidato,
                             BindingResult br,
                             RedirectAttributes ra,
                             Model model) {
        if (br.hasErrors()) {
            model.addAttribute("titulo", "Editar candidato");
            return "admin/candidatos-form";
        }

        // ⚠️ Ajusta este setter al nombre real de tu PK.
        // Si tu entidad tiene setId(Long id), úsalo. Si no, cambia a tu campo real.
        // Ejemplo recomendado:
        // candidato.setId(id);
        candidato.setIdElector(id);

        service.guardar(candidato);
        ra.addFlashAttribute("ok", "Candidato actualizado correctamente.");
        return "redirect:/admin/candidatos";
    }

    @PostMapping("/{id}/eliminar")
    public String eliminar(@PathVariable Long id, RedirectAttributes ra) {
        service.eliminar(id);
        ra.addFlashAttribute("ok", "Candidato eliminado correctamente.");
        return "redirect:/admin/candidatos";
    }

    @PostMapping("/upload-csv")
    public String uploadCsv(@RequestParam("file") MultipartFile file, RedirectAttributes ra) {
        try {
            int n = service.importarCsv(file);
            ra.addFlashAttribute("ok", "Se importaron " + n + " candidatos correctamente.");
        } catch (Exception e) {
            ra.addFlashAttribute("error", "Error al importar: " + e.getMessage());
        }
        return "redirect:/admin/candidatos";
    }
}
