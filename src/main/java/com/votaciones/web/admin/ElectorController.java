package com.votaciones.web.admin;

import com.votaciones.service.ElectorCsvService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequestMapping("/admin/electores")
public class ElectorController {

    private final ElectorCsvService electorCsvService;

    public ElectorController(ElectorCsvService electorCsvService) {
        this.electorCsvService = electorCsvService;
    }

    @GetMapping("/upload-csv")
    public String uploadForm(Model model) {
        model.addAttribute("title", "Cargar electores CSV");
        return "admin/electores-upload";
    }

    @PostMapping("/upload-csv")
    public String uploadCsv(MultipartFile file, Model model) {
        try {
            int inserted = electorCsvService.importar(file);
            model.addAttribute("ok", "Archivo procesado. Registros insertados: " + inserted);
        } catch (Exception e) {
            model.addAttribute("error", "No se pudo procesar el CSV: " + e.getMessage());
        }
        return "admin/electores-upload";
    }
}
