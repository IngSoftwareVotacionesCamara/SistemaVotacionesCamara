package com.votaciones.web.admin;

import com.votaciones.domain.Partido;
import com.votaciones.service.PartidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.BindingResult;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/partidos")
@RequiredArgsConstructor
public class PartidoController {

    private final PartidoService service;

    // LISTA
    @GetMapping
    public String listar(Model model) {
        model.addAttribute("partidos", service.listar());
        return "admin/partidos-list";
    }

    // DETALLE
    @GetMapping("/{id}")
    public String detalle(@PathVariable Long id, Model model, RedirectAttributes ra) {
        Partido partido = service.obtener(id);
        if (partido == null) {
            ra.addFlashAttribute("error", "El partido con id " + id + " no existe.");
            return "redirect:/admin/partidos";
        }
        model.addAttribute("partido", partido);
        return "admin/partidos-detalle";
    }

    // FORM CREAR
    @GetMapping("/nuevo")
    public String nuevo(Model model) {
        model.addAttribute("partido", new Partido());
        model.addAttribute("titulo", "Crear partido");
        return "admin/partidos-form";
    }

    // GUARDAR NUEVO
    @PostMapping
    public String crear(@Valid @ModelAttribute("partido") Partido partido,
                        BindingResult br,
                        RedirectAttributes ra,
                        Model model) {
        if (br.hasErrors()) {
            model.addAttribute("titulo", "Crear partido");
            return "admin/partidos-form";
        }
        service.guardar(partido);
        ra.addFlashAttribute("ok", "Partido creado correctamente.");
        return "redirect:/admin/partidos";
    }

    // FORM EDITAR
    @GetMapping("/{id}/editar")
    public String editar(@PathVariable Long id, Model model, RedirectAttributes ra) {
        Partido partido = service.obtener(id);
        if (partido == null) {
            ra.addFlashAttribute("error", "El partido con id " + id + " no existe.");
            return "redirect:/admin/partidos";
        }
        model.addAttribute("partido", partido);
        model.addAttribute("titulo", "Editar partido");
        return "admin/partidos-form";
    }

    // ACTUALIZAR
    @PostMapping("/{id}")
    public String actualizar(@PathVariable Long id,
                             @Valid @ModelAttribute("partido") Partido partido,
                             BindingResult br,
                             RedirectAttributes ra,
                             Model model) {
        if (br.hasErrors()) {
            model.addAttribute("titulo", "Editar partido");
            return "admin/partidos-form";
        }
        // asegurar que el id del path prevalezca
        partido.setCodPartido(id.intValue());
        service.guardar(partido);
        ra.addFlashAttribute("ok", "Partido actualizado correctamente.");
        return "redirect:/admin/partidos";
    }

    // ELIMINAR
    @PostMapping("/{id}/eliminar")
    public String eliminar(@PathVariable Long id, RedirectAttributes ra) {
        try {
            service.eliminar(id);
            ra.addFlashAttribute("ok", "Partido eliminado correctamente.");
        } catch (Exception e) {
            ra.addFlashAttribute("error", "No se pudo eliminar: " + e.getMessage());
        }
        return "redirect:/admin/partidos";
    }

    // IMPORTAR CSV
    @PostMapping("/upload-csv")
    public String uploadCsv(@RequestParam("file") MultipartFile file, RedirectAttributes ra) {
        try {
            int n = service.importarCsv(file);
            ra.addFlashAttribute("ok", "Se importaron " + n + " partidos correctamente.");
        } catch (Exception e) {
            ra.addFlashAttribute("error", "Error al importar: " + e.getMessage());
        }
        return "redirect:/admin/partidos";
    }
}
