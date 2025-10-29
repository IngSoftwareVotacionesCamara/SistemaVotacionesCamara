package com.votaciones.service;


import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Componente genérico para leer archivos CSV con separador ';'
 * y devolver las filas como lista de arreglos de String.
 *
 * Uso:
 *  var rows = csvImporter.read(file);
 *  for (String[] r : rows) { ... }
 */
@Component
public class CsvImporter {

    /**
     * Lee un archivo CSV (con codificación UTF-8 y separador ';')
     * y devuelve una lista de filas, donde cada fila es un arreglo String[].
     *
     * @param file archivo cargado (MultipartFile)
     * @return lista de filas (incluye cabecera)
     * @throws Exception si hay error al leer el archivo
     */
    public List<String[]> read(MultipartFile file) throws Exception {
        List<String[]> rows = new ArrayList<>();

        try (var reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            while ((line = reader.readLine()) != null) {
                // Quita BOM, espacios y separa por ';' (puedes cambiar a ',' si tus CSV usan coma)
                line = line.replace("\uFEFF", "").trim();
                if (!line.isEmpty()) {
                    rows.add(line.split(";"));
                }
            }
        }
        return rows;
    }
}