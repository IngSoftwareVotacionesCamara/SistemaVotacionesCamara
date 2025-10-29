package com.votaciones.web.admin;

import com.votaciones.service.ElectorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/electores")
@RequiredArgsConstructor
public class ElectorController {

    private final ElectorCsvService electorCsvService;

    @GetMapping("/upload-csv")
    public String uploadForm(Model model) {
        model.addAttribute("title", "Cargar electores CSV");
        return "admin/electores-upload";
    }

    @PostMapping("/upload-csv")
    public String uploadCsv(MultipartFile file, Model model) {
        try {
            int insertados = electorCsvService.importar(file);
            model.addAttribute("ok", "Archivo procesado. Registros insertados: " + insertados);
        } catch (Exception e) {
            model.addAttribute("error", "No se pudo procesar el CSV: " + e.getMessage());
        }
        return "admin/electores-upload";
    }
}